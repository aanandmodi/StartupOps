import asyncio
import logging
import os
import sys
from datetime import datetime

# Add current directory to path so we can import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import firebase_admin
from firebase_admin import credentials, firestore
from sqlalchemy import select
from sqlalchemy.orm import selectinload

# Import your app's database and all models
from app.database import async_session_maker
from app.models.user import User
from app.models.startup import Startup
from app.models.task import Task
from app.models.kpi import KPI
from app.models.alert import Alert
from app.models.agent_log import AgentLog
from app.models.execution import GeneratedArtifact, ExecutionLog
from app.models.chat import ChatMessage, AgentMemory

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def to_dict(obj):
    """Helper to convert SQLAlchemy model to dict."""
    data = {}
    for column in obj.__table__.columns:
        value = getattr(obj, column.name)
        
        # Handle Enums by converting to string
        if hasattr(value, "value"):  
            value = value.value
        # Handle Datetime (Firestore accepts datetime objects)
        elif isinstance(value, datetime):
            pass 
        
        data[column.name] = value
    return data

async def migrate_users(sql_session, firestore_db):
    """Migrate Users table to 'users' collection."""
    logger.info("Migrating Users...")
    result = await sql_session.execute(select(User))
    users = result.scalars().all()
    
    count = 0
    for user in users:
        try:
            doc_ref = firestore_db.collection('users').document(str(user.id))
            data = to_dict(user)
            doc_ref.set(data, merge=True)
            count += 1
        except Exception as e:
            logger.error(f"Failed to migrate user {user.email}: {e}")
            
    logger.info(f"Migrated {count} users.")

async def migrate_startups_and_related(sql_session, firestore_db):
    """Migrate Startups and all related sub-collections."""
    logger.info("Migrating Startups and related data...")
    
    # Eager load relationships to avoid N+1 queries if needed (though we might fetch sub-items separately)
    result = await sql_session.execute(select(Startup))
    startups = result.scalars().all()
    
    for startup in startups:
        try:
            # 1. Startup Document
            startup_ref = firestore_db.collection('startups').document(str(startup.id))
            startup_data = to_dict(startup)
            startup_ref.set(startup_data, merge=True)
            logger.info(f"Migrated Startup: {startup.id}")

            # 2. Tasks (Sub-collection)
            tasks_result = await sql_session.execute(select(Task).where(Task.startup_id == startup.id))
            for task in tasks_result.scalars().all():
                task_ref = startup_ref.collection('tasks').document(str(task.id))
                task_ref.set(to_dict(task), merge=True)

            # 3. KPIs (Sub-collection)
            kpis_result = await sql_session.execute(select(KPI).where(KPI.startup_id == startup.id))
            for kpi in kpis_result.scalars().all():
                kpi_ref = startup_ref.collection('kpis').document(str(kpi.id))
                kpi_ref.set(to_dict(kpi), merge=True)

            # 4. Alerts (Sub-collection)
            alerts_result = await sql_session.execute(select(Alert).where(Alert.startup_id == startup.id))
            for alert in alerts_result.scalars().all():
                alert_ref = startup_ref.collection('alerts').document(str(alert.id))
                alert_ref.set(to_dict(alert), merge=True)

            # 5. AgentLogs (Sub-collection)
            logs_result = await sql_session.execute(select(AgentLog).where(AgentLog.startup_id == startup.id))
            for log in logs_result.scalars().all():
                log_ref = startup_ref.collection('agent_logs').document(str(log.id))
                log_ref.set(to_dict(log), merge=True)
                
            # 6. GeneratedArtifacts (Sub-collection)
            artifacts_result = await sql_session.execute(select(GeneratedArtifact).where(GeneratedArtifact.startup_id == startup.id))
            for artifact in artifacts_result.scalars().all():
                artifact_ref = startup_ref.collection('artifacts').document(str(artifact.id))
                artifact_ref.set(to_dict(artifact), merge=True)
                
            # 7. ExecutionLogs (Sub-collection)
            exec_logs_result = await sql_session.execute(select(ExecutionLog).where(ExecutionLog.startup_id == startup.id))
            for exec_log in exec_logs_result.scalars().all():
                exec_log_ref = startup_ref.collection('execution_logs').document(str(exec_log.id))
                exec_log_ref.set(to_dict(exec_log), merge=True)

            # 8. ChatMessages (Sub-collection)
            chat_result = await sql_session.execute(select(ChatMessage).where(ChatMessage.startup_id == startup.id))
            for msg in chat_result.scalars().all():
                msg_ref = startup_ref.collection('chat_messages').document(str(msg.id))
                msg_ref.set(to_dict(msg), merge=True)

            # 9. AgentMemories (Sub-collection)
            mem_result = await sql_session.execute(select(AgentMemory).where(AgentMemory.startup_id == startup.id))
            for mem in mem_result.scalars().all():
                mem_ref = startup_ref.collection('agent_memories').document(str(mem.id))
                mem_ref.set(to_dict(mem), merge=True)

        except Exception as e:
            logger.error(f"Failed to migrate startup {startup.id}: {e}")

async def main():
    logger.info("Starting migration to Firestore...")
    
    # Initialize Firebase Admin
    try:
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred)
        logger.info("Initialized Firebase Admin with Application Default Credentials")
    except Exception:
        # If no default creds, try to find a json key in env or local dir
        key_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        if key_path and os.path.exists(key_path):
             cred = credentials.Certificate(key_path)
             firebase_admin.initialize_app(cred)
             logger.info(f"Initialized Firebase Admin with key: {key_path}")
        else:
            logger.error("No credentials found. running 'gcloud auth application-default login' might fix this.")
            return

    firestore_db = firestore.client()
    
    # Connect to SQL Database
    async with async_session_maker() as session:
        await migrate_users(session, firestore_db)
        await migrate_startups_and_related(session, firestore_db)
        
    logger.info("Full Migration finished.")

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
