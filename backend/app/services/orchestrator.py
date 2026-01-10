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
        Run the complete agent orchestration flow.
        
        Order:
        1. Product Agent (first)
        2. Tech Agent (after Product)
        3. Marketing & Finance (parallel)
        4. Advisor Agent (last)
        
        Args:
            startup: The startup to run orchestration for
            
        Returns:
            Combined results from all agents
        """
        logger.info(f"Starting orchestration for startup {startup.id}")
        results = {}
        
        # 1. Product Agent runs FIRST
        logger.info("Running Product Agent...")
        product_input = {
            "goal": startup.goal,
            "domain": startup.domain,
            "team_size": startup.team_size,
        }
        product_output = await self.product_agent.run(product_input)
        results["product"] = product_output
        await self._save_agent_log(startup.id, "product", product_output)
        await self._save_tasks_from_product(startup.id, product_output)
        
        # 2. Tech Agent runs AFTER Product
        logger.info("Running Tech Agent...")
        tech_input = {
            "product_output": product_output,
            "team_size": startup.team_size,
        }
        tech_output = await self.tech_agent.run(tech_input)
        results["tech"] = tech_output
        await self._save_agent_log(startup.id, "tech", tech_output)
        await self._save_tasks_from_tech(startup.id, tech_output)
        
        # 3. Marketing & Finance run IN PARALLEL
        logger.info("Running Marketing and Finance Agents in parallel...")
        timeline_days = product_output.get("recommended_launch_timeline_days", 60)
        
        marketing_input = {
            "product_output": product_output,
            "timeline_days": timeline_days,
            "domain": startup.domain,
        }
        finance_input = {
            "tasks": product_output.get("tasks", []) + tech_output.get("tasks", []),
            "timeline_days": timeline_days,
            "team_size": startup.team_size,
        }
        
        marketing_task = self.marketing_agent.run(marketing_input)
        finance_task = self.finance_agent.run(finance_input)
        
        marketing_output, finance_output = await asyncio.gather(
            marketing_task, finance_task
        )
        
        results["marketing"] = marketing_output
        results["finance"] = finance_output
        
        await self._save_agent_log(startup.id, "marketing", marketing_output)
        await self._save_agent_log(startup.id, "finance", finance_output)
        await self._save_tasks_from_marketing(startup.id, marketing_output)
        await self._save_tasks_from_finance(startup.id, finance_output)
        await self._save_kpis(startup.id, marketing_output, finance_output)
        
        # 4. Advisor Agent runs LAST
        logger.info("Running Advisor Agent...")
        advisor_input = {
            "product_output": product_output,
            "tech_output": tech_output,
            "marketing_output": marketing_output,
            "finance_output": finance_output,
            "startup_goal": startup.goal,
            "team_size": startup.team_size,
        }
        advisor_output = await self.advisor_agent.run(advisor_input)
        results["advisor"] = advisor_output
        await self._save_agent_log(startup.id, "advisor", advisor_output)
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
    
    async def _save_tasks_from_product(self, startup_id: int, output: dict):
        """Save tasks from Product Agent output."""
        for task_data in output.get("tasks", []):
            task = Task(
                startup_id=startup_id,
                title=task_data.get("title", "Untitled Task"),
                description=task_data.get("description"),
                category=TaskCategory.PRODUCT,
                priority=task_data.get("priority", 3),
                estimated_days=task_data.get("estimated_days", 1),
                status=TaskStatus.PENDING,
                dependencies=task_data.get("dependencies", []),
            )
            self.db.add(task)
    
    async def _save_tasks_from_tech(self, startup_id: int, output: dict):
        """Save tasks from Tech Agent output."""
        for task_data in output.get("tasks", []):
            task = Task(
                startup_id=startup_id,
                title=task_data.get("title", "Untitled Task"),
                description=task_data.get("description"),
                category=TaskCategory.TECH,
                priority=task_data.get("priority", 3),
                estimated_days=task_data.get("estimated_days", 1),
                status=TaskStatus.PENDING,
                dependencies=task_data.get("dependencies", []),
            )
            self.db.add(task)
    
    async def _save_tasks_from_marketing(self, startup_id: int, output: dict):
        """Save tasks from Marketing Agent output."""
        for task_data in output.get("tasks", []):
            task = Task(
                startup_id=startup_id,
                title=task_data.get("title", "Untitled Task"),
                description=task_data.get("description"),
                category=TaskCategory.MARKETING,
                priority=task_data.get("priority", 3),
                estimated_days=task_data.get("estimated_days", 1),
                status=TaskStatus.PENDING,
                dependencies=task_data.get("dependencies", []),
            )
            self.db.add(task)
    
    async def _save_tasks_from_finance(self, startup_id: int, output: dict):
        """Save tasks from Finance Agent output."""
        for task_data in output.get("tasks", []):
            task = Task(
                startup_id=startup_id,
                title=task_data.get("title", "Untitled Task"),
                description=task_data.get("description"),
                category=TaskCategory.FINANCE,
                priority=task_data.get("priority", 3),
                estimated_days=task_data.get("estimated_days", 1),
                status=TaskStatus.PENDING,
                dependencies=task_data.get("dependencies", []),
            )
            self.db.add(task)
    
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
