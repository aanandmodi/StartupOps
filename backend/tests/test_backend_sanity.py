import unittest
import sys
import os
import asyncio
from unittest.mock import MagicMock, patch

# Ensure backend root is in python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

class TestBackendSanity(unittest.IsolatedAsyncioTestCase):
    
    @classmethod
    def setUpClass(cls):
        # Patch settings globally to avoid pydantic validation errors during import
        cls.settings_patcher = patch("app.config.get_settings")
        cls.mock_get_settings = cls.settings_patcher.start()
        cls.mock_settings = MagicMock()
        cls.mock_settings.groq_api_key = "test_key"
        cls.mock_settings.environment = "test"
        cls.mock_settings.is_mock_mode = True
        cls.mock_get_settings.return_value = cls.mock_settings

    @classmethod
    def tearDownClass(cls):
        cls.settings_patcher.stop()

    @patch("app.firebase_client.get_firebase_db")
    async def test_orchestrator_initialization(self, mock_get_db):
        """Test that the orchestrator initializes correctly."""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        
        # We need to mock langgraph compile in graph.py to avoid actually compiling calls
        with patch("langgraph.graph.StateGraph.compile") as mock_compile:
             from app.services.orchestrator import AgentOrchestrator
             orchestrator = AgentOrchestrator()
             
             self.assertIsNotNone(orchestrator)
             # Verify core agents exist
             self.assertIsNotNone(orchestrator.product_agent)
             self.assertIsNotNone(orchestrator.tech_agent)
             self.assertIsNotNone(orchestrator.marketing_agent)
             self.assertIsNotNone(orchestrator.finance_agent)
             self.assertIsNotNone(orchestrator.advisor_agent)

    @patch("app.firebase_client.get_firebase_db")
    async def test_full_orchestration_mock(self, mock_get_db):
        """Test the full orchestration flow with mocked agents."""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        
        # Mock collections
        mock_startup_ref = MagicMock()
        # db.collection("startups").document(startup_id)
        mock_db.collection.return_value.document.return_value = mock_startup_ref
        
        # Mock agent outputs
        mock_prod_out = {"title": "Mock Product", "tasks": []}
        mock_tech_out = {"stack": "Mock Stack", "tasks": []}
        mock_mkt_out = {"strategy": "Mock Strat", "tasks": [], "kpis": []}
        mock_fin_out = {"budget": 1000, "tasks": [], "kpis": []}
        mock_adv_out = {"alerts": []}
        
        # Mock the graph execution
        state_mock = {
            "product_output": mock_prod_out,
            "tech_output": mock_tech_out,
            "marketing_output": mock_mkt_out,
            "finance_output": mock_fin_out,
            "advisor_output": mock_adv_out
        }
        
        # Patch app.agents.graph.agent_graph
        # app.services.orchestrator imports agent_graph inside the method
        # so we need to patch it in sys.modules or patch the module attribute
        
        with patch("app.agents.graph.agent_graph") as mock_graph:
            mock_graph.ainvoke = MagicMock(return_value=asyncio.Future())
            mock_graph.ainvoke.return_value.set_result(state_mock)
            
            from app.services.orchestrator import AgentOrchestrator
            orchestrator = AgentOrchestrator(db=mock_db)
            
            startup_data = {
                "goal": "Test Goal", 
                "domain": "Test Domain", 
                "team_size": "Small",
                "user_id": "test_user"
            }
            
            results = await orchestrator.run_full_orchestration("test_startup_id", startup_data)
            
            self.assertEqual(results["product"], mock_prod_out)
            self.assertEqual(results["tech"], mock_tech_out)
            self.assertEqual(results["marketing"], mock_mkt_out)
            self.assertEqual(results["finance"], mock_fin_out)
            self.assertEqual(results["advisor"], mock_adv_out)
            
            # Verify DB interactions
            # We expect collection() to be called for 'startups' and then subcollections 'tasks', 'kpis', 'alerts', 'agent_logs'
            self.assertTrue(mock_startup_ref.collection.called)

if __name__ == "__main__":
    unittest.main()
