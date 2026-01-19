"""Agent Orchestrator - Manages agent execution flow using Firestore."""
import logging
from typing import Any
import datetime
from google.cloud import firestore

from app.agents import ProductAgent, TechAgent, MarketingAgent, FinanceAgent, AdvisorAgent
from app.firebase_client import get_firebase_db

logger = logging.getLogger(__name__)


class AgentOrchestrator:
    """Orchestrates the execution of all AI agents in the correct order."""
    
    def __init__(self, db=None):
        self.db = db or get_firebase_db()
        self.product_agent = ProductAgent()
        self.tech_agent = TechAgent()
        self.marketing_agent = MarketingAgent()
        self.finance_agent = FinanceAgent()
        self.advisor_agent = AdvisorAgent()
    
    async def run_full_orchestration(self, startup_id: str, startup_data: dict) -> dict[str, Any]:
        """
        Run the complete agent orchestration flow using LangGraph.
        """
        logger.info(f"Starting LangGraph orchestration for startup {startup_id}")
        
        # Import here to avoid circular dependencies if any
        from app.agents.graph import agent_graph
        
        initial_state = {
            "startup_id": startup_id,
            "goal": startup_data.get("goal"),
            "domain": startup_data.get("domain"),
            "team_size": startup_data.get("team_size"),
            "product_output": {},
            "tech_output": {},
            "marketing_output": {},
            "finance_output": {},
            "advisor_output": {},
            "logs": []
        }
        
        # Execute the graph
        final_state = await agent_graph.ainvoke(initial_state)
        
        # Extract outputs
        product_output = final_state.get("product_output", {})
        tech_output = final_state.get("tech_output", {})
        marketing_output = final_state.get("marketing_output", {})
        finance_output = final_state.get("finance_output", {})
        advisor_output = final_state.get("advisor_output", {})
        
        results = {
            "product": product_output,
            "tech": tech_output,
            "marketing": marketing_output,
            "finance": finance_output,
            "advisor": advisor_output
        }
        
        # Save agent logs
        startup_ref = self.db.collection("startups").document(startup_id)
        
        await self._save_agent_log(startup_ref, "product", product_output)
        await self._save_agent_log(startup_ref, "tech", tech_output)
        await self._save_agent_log(startup_ref, "marketing", marketing_output)
        await self._save_agent_log(startup_ref, "finance", finance_output)
        await self._save_agent_log(startup_ref, "advisor", advisor_output)
        
        # Save all tasks with proper cross-department dependencies
        await self._save_all_tasks_with_dependencies(
            startup_ref,
            product_output.get("tasks", []),
            tech_output.get("tasks", []),
            marketing_output.get("tasks", []),
            finance_output.get("tasks", [])
        )
        
        # Save KPIs and alerts
        await self._save_kpis(startup_ref, marketing_output, finance_output)
        await self._save_alerts(startup_ref, advisor_output)
        
        logger.info(f"Orchestration complete for startup {startup_id}")
        
        return results
    
    async def _save_agent_log(self, startup_ref, agent_name: str, output: dict):
        """Save agent output to database."""
        startup_ref.collection("agent_logs").add({
            "agent_name": agent_name,
            "output_json": output,
            "created_at": datetime.datetime.utcnow()
        })
    
    async def _save_all_tasks_with_dependencies(
        self,
        startup_ref,
        product_tasks: list,
        tech_tasks: list,
        marketing_tasks: list,
        finance_tasks: list
    ):
        """
        Save all tasks with proper cross-department dependencies.
        """
        all_tasks_data = []
        task_ref_map = {}  # Maps (category, local_index) -> firestore_doc_ref
        
        tasks_col = startup_ref.collection("tasks")
        
        # Helper to prep tasks
        def prep_tasks(tasks, dept, category_enum):
            for i, t_data in enumerate(tasks):
                doc_ref = tasks_col.document() # Auto-ID
                task_ref_map[(dept, i)] = doc_ref
                all_tasks_data.append({
                    "doc_ref": doc_ref,
                    "dept": dept,
                    "local_idx": i,
                    "data": t_data,
                    "category": category_enum
                })

        # Product tasks (Level 0)
        prep_tasks(product_tasks, "product", "product")
        # Tech tasks (Level 1)
        prep_tasks(tech_tasks, "tech", "tech")
        # Marketing (Level 2)
        prep_tasks(marketing_tasks, "marketing", "marketing")
        # Finance (Level 2)
        prep_tasks(finance_tasks, "finance", "finance")
        
        batch = self.db.batch()
        
        for item in all_tasks_data:
            doc_ref = item["doc_ref"]
            task_data = item["data"]
            dept = item["dept"]
            
            # Resolve dependencies
            global_deps = []
            
            # Local deps
            for local_dep in task_data.get("dependencies", []):
                if isinstance(local_dep, int) and local_dep >= 0:
                    dep_ref = task_ref_map.get((dept, local_dep))
                    if dep_ref:
                        global_deps.append(dep_ref.id)
            
            # Cross-dept logic
            # Tech depends on Product[0]
            if dept == "tech":
                first_prod_ref = task_ref_map.get(("product", 0))
                # Depends on Product[0] if this is Tech[0] (or all? Original logic said Tech[0]->Prod[0])
                # Original logic: "if task_data['global_idx'] == ... map(('tech', 0))" -> so only Tech[0]
                if item["local_idx"] == 0 and first_prod_ref:
                     global_deps.append(first_prod_ref.id)
            
            if dept == "marketing":
                 first_tech_ref = task_ref_map.get(("tech", 0))
                 if item["local_idx"] == 0 and first_tech_ref:
                     global_deps.append(first_tech_ref.id)

            if dept == "finance":
                 first_tech_ref = task_ref_map.get(("tech", 0))
                 if item["local_idx"] == 0 and first_tech_ref:
                     global_deps.append(first_tech_ref.id)

            batch.set(doc_ref, {
                "title": task_data.get("title", "Untitled Task"),
                "description": task_data.get("description"),
                "category": item["category"],
                "priority": task_data.get("priority", 3),
                "estimated_days": task_data.get("estimated_days", 1),
                "status": "pending",
                "dependencies": list(set(global_deps)),
                "created_at": datetime.datetime.utcnow()
            })
            
        batch.commit()
    
    async def _save_kpis(self, startup_ref, marketing_output: dict, finance_output: dict):
        """Save KPIs from Marketing and Finance outputs."""
        kpis_col = startup_ref.collection("kpis")
        batch = self.db.batch()
        
        for kpi_data in marketing_output.get("kpis", []):
            ref = kpis_col.document()
            batch.set(ref, {
                "type": "marketing",
                "name": kpi_data.get("name", "Unknown KPI"),
                "value": 0,
                "target": kpi_data.get("target_value"),
                "unit": kpi_data.get("unit"),
                "timestamp": datetime.datetime.utcnow()
            })
            
        for kpi_data in finance_output.get("kpis", []):
            ref = kpis_col.document()
            batch.set(ref, {
                "type": "finance",
                "name": kpi_data.get("name", "Unknown KPI"),
                "value": 0,
                "target": kpi_data.get("target_value"),
                "unit": kpi_data.get("unit"),
                "timestamp": datetime.datetime.utcnow()
            })
        
        batch.commit()
    
    async def _save_alerts(self, startup_ref, advisor_output: dict):
        """Save alerts from Advisor output."""
        alerts_col = startup_ref.collection("alerts")
        batch = self.db.batch()
        
        for alert_data in advisor_output.get("alerts", []):
             ref = alerts_col.document()
             batch.set(ref, {
                "severity": alert_data.get("severity", "info").lower(),
                "message": alert_data.get("message", ""),
                "recommended_action": alert_data.get("recommended_action"),
                "is_active": True,
                "created_at": datetime.datetime.utcnow()
             })
        
        batch.commit()
