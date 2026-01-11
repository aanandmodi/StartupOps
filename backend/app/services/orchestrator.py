"""Agent Orchestrator - Manages agent execution flow."""
import asyncio
import logging
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.agents import ProductAgent, TechAgent, MarketingAgent, FinanceAgent, AdvisorAgent
from app.models import Startup, Task, KPI, Alert, AgentLog
from app.models.task import TaskCategory, TaskStatus
from app.models.kpi import KPIType
from app.models.alert import AlertSeverity

logger = logging.getLogger(__name__)


class AgentOrchestrator:
    """Orchestrates the execution of all AI agents in the correct order."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.product_agent = ProductAgent()
        self.tech_agent = TechAgent()
        self.marketing_agent = MarketingAgent()
        self.finance_agent = FinanceAgent()
        self.advisor_agent = AdvisorAgent()
    
    async def run_full_orchestration(self, startup: Startup) -> dict[str, Any]:
        """
        Run the complete agent orchestration flow using LangGraph.
        
        Args:
            startup: The startup to run orchestration for
            
        Returns:
            Combined results from all agents
        """
        logger.info(f"Starting LangGraph orchestration for startup {startup.id}")
        
        # Import here to avoid circular dependencies if any
        from app.agents.graph import agent_graph
        
        initial_state = {
            "startup_id": startup.id,
            "goal": startup.goal,
            "domain": startup.domain,
            "team_size": startup.team_size,
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
        await self._save_agent_log(startup.id, "product", product_output)
        await self._save_agent_log(startup.id, "tech", tech_output)
        await self._save_agent_log(startup.id, "marketing", marketing_output)
        await self._save_agent_log(startup.id, "finance", finance_output)
        await self._save_agent_log(startup.id, "advisor", advisor_output)
        
        # Save all tasks with proper cross-department dependencies
        await self._save_all_tasks_with_dependencies(
            startup.id,
            product_output.get("tasks", []),
            tech_output.get("tasks", []),
            marketing_output.get("tasks", []),
            finance_output.get("tasks", [])
        )
        
        # Save KPIs and alerts
        await self._save_kpis(startup.id, marketing_output, finance_output)
        await self._save_alerts(startup.id, advisor_output)
        
        await self.db.commit()
        logger.info(f"Orchestration complete for startup {startup.id}")
        
        return results
    
    async def run_advisor_only(self, startup: Startup, current_tasks: list) -> dict[str, Any]:
        """Re-run only the advisor agent for health recalculation."""
        logger.info(f"Re-running Advisor Agent for startup {startup.id}")
        
        advisor_input = {
            "tasks": [{"title": t.title, "status": t.status.value} for t in current_tasks],
            "startup_goal": startup.goal,
            "team_size": startup.team_size,
        }
        advisor_output = await self.advisor_agent.run(advisor_input)
        await self._save_agent_log(startup.id, "advisor", advisor_output)
        await self._save_alerts(startup.id, advisor_output)
        await self.db.commit()
        
        return advisor_output
    
    async def _save_agent_log(self, startup_id: int, agent_name: str, output: dict):
        """Save agent output to database."""
        log = AgentLog(
            startup_id=startup_id,
            agent_name=agent_name,
            output_json=output,
        )
        self.db.add(log)
    
    async def _save_all_tasks_with_dependencies(
        self,
        startup_id: int,
        product_tasks: list,
        tech_tasks: list,
        marketing_tasks: list,
        finance_tasks: list
    ):
        """
        Save all tasks with proper cross-department dependencies.
        
        Creates a flow graph where:
        - Product tasks are foundation (level 0)
        - Tech tasks depend on product tasks (level 1)
        - Marketing/Finance can run in parallel after some tech tasks (level 2)
        - All tasks get proper database IDs for frontend graph visualization
        """
        all_tasks = []
        task_id_map = {}  # Maps (category, local_index) -> global_index
        
        # Collect all tasks with their category and assign global indices
        global_idx = 0
        
        # Product tasks (Level 0 - Foundation)
        for i, task_data in enumerate(product_tasks):
            task_id_map[("product", i)] = global_idx
            all_tasks.append({
                **task_data,
                "category": TaskCategory.PRODUCT,
                "global_idx": global_idx,
                "local_deps": task_data.get("dependencies", []),
                "dept": "product"
            })
            global_idx += 1
        
        # Tech tasks (Level 1 - Depends on Product)
        for i, task_data in enumerate(tech_tasks):
            task_id_map[("tech", i)] = global_idx
            all_tasks.append({
                **task_data,
                "category": TaskCategory.TECH,
                "global_idx": global_idx,
                "local_deps": task_data.get("dependencies", []),
                "dept": "tech"
            })
            global_idx += 1
        
        # Marketing tasks (Level 2 - Can run parallel with Finance)
        for i, task_data in enumerate(marketing_tasks):
            task_id_map[("marketing", i)] = global_idx
            all_tasks.append({
                **task_data,
                "category": TaskCategory.MARKETING,
                "global_idx": global_idx,
                "local_deps": task_data.get("dependencies", []),
                "dept": "marketing"
            })
            global_idx += 1
        
        # Finance tasks (Level 2 - Can run parallel with Marketing)
        for i, task_data in enumerate(finance_tasks):
            task_id_map[("finance", i)] = global_idx
            all_tasks.append({
                **task_data,
                "category": TaskCategory.FINANCE,
                "global_idx": global_idx,
                "local_deps": task_data.get("dependencies", []),
                "dept": "finance"
            })
            global_idx += 1
        
        # Now save tasks and build proper dependency graph
        saved_tasks = []
        for task_data in all_tasks:
            # Build global dependencies
            global_deps = []
            dept = task_data["dept"]
            
            # Map local dependencies to global indices
            for local_dep in task_data["local_deps"]:
                if isinstance(local_dep, int) and local_dep >= 0:
                    # Map to same department first
                    dep_key = (dept, local_dep)
                    if dep_key in task_id_map:
                        global_deps.append(task_id_map[dep_key])
            
            # Add cross-department dependencies for execution flow
            if dept == "tech" and len(product_tasks) > 0:
                # First tech task depends on first product task
                if task_data["global_idx"] == task_id_map.get(("tech", 0)):
                    if ("product", 0) in task_id_map:
                        global_deps.append(task_id_map[("product", 0)])
            
            if dept == "marketing" and len(tech_tasks) > 0:
                # First marketing task depends on first tech task
                if task_data["global_idx"] == task_id_map.get(("marketing", 0)):
                    if ("tech", 0) in task_id_map:
                        global_deps.append(task_id_map[("tech", 0)])
            
            if dept == "finance" and len(tech_tasks) > 0:
                # First finance task depends on first tech task
                if task_data["global_idx"] == task_id_map.get(("finance", 0)):
                    if ("tech", 0) in task_id_map:
                        global_deps.append(task_id_map[("tech", 0)])
            
            task = Task(
                startup_id=startup_id,
                title=task_data.get("title", "Untitled Task"),
                description=task_data.get("description"),
                category=task_data["category"],
                priority=task_data.get("priority", 3),
                estimated_days=task_data.get("estimated_days", 1),
                status=TaskStatus.PENDING,  # Tasks start as pending
                dependencies=list(set(global_deps)),  # Remove duplicates
            )
            self.db.add(task)
            saved_tasks.append(task)
        
        # Flush to get actual database IDs
        await self.db.flush()
        
        # Update dependencies to use actual database IDs
        id_mapping = {i: saved_tasks[i].id for i in range(len(saved_tasks))}
        
        for i, task in enumerate(saved_tasks):
            if task.dependencies:
                # Convert global indices to actual database IDs
                task.dependencies = [id_mapping.get(dep_idx, dep_idx) for dep_idx in task.dependencies if dep_idx in id_mapping]
        
        return saved_tasks
    
    async def _save_kpis(self, startup_id: int, marketing_output: dict, finance_output: dict):
        """Save KPIs from Marketing and Finance outputs."""
        # Marketing KPIs
        for kpi_data in marketing_output.get("kpis", []):
            kpi = KPI(
                startup_id=startup_id,
                type=KPIType.MARKETING,
                name=kpi_data.get("name", "Unknown KPI"),
                value=0,  # Initial value
                target=kpi_data.get("target_value"),
                unit=kpi_data.get("unit"),
            )
            self.db.add(kpi)
        
        # Finance KPIs
        for kpi_data in finance_output.get("kpis", []):
            kpi = KPI(
                startup_id=startup_id,
                type=KPIType.FINANCE,
                name=kpi_data.get("name", "Unknown KPI"),
                value=0,  # Initial value
                target=kpi_data.get("target_value"),
                unit=kpi_data.get("unit"),
            )
            self.db.add(kpi)
    
    async def _save_alerts(self, startup_id: int, advisor_output: dict):
        """Save alerts from Advisor output."""
        for alert_data in advisor_output.get("alerts", []):
            severity_str = alert_data.get("severity", "info").lower()
            severity = AlertSeverity(severity_str)
            
            alert = Alert(
                startup_id=startup_id,
                severity=severity,
                message=alert_data.get("message", ""),
                recommended_action=alert_data.get("recommended_action"),
            )
            self.db.add(alert)
