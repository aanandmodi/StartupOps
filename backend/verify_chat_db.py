
import os
import asyncio
import logging
from datetime import datetime
from dotenv import load_dotenv
from google.cloud import firestore
from app.firebase_client import get_firebase_db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load env from .env file
load_dotenv()

async def list_startups(db):
    """List one startup to use for testing."""
    startups = db.collection("startups").limit(1).stream()
    for s in startups:
        return s.id
    return None

def verify_chat_persistence():
    try:
        db = get_firebase_db()
        print("Firestore connected.")
        
        # 1. Get a startup ID
        # Since running in async context might be tricky with stream(), let's just use synchronous stream() if possible.
        # firestore python client is sync by default unless using AsyncClient. 
        # app.firebase_client uses firestore.client() which is sync.
        
        startups = list(db.collection("startups").limit(1).stream())
        if not startups:
            print("No startups found. Creating a test startup...")
            startup_ref = db.collection("startups").document()
            startup_ref.set({
                "name": "Test Startup",
                "user_id": "test_user",
                "created_at": datetime.utcnow()
            })
            startup_id = startup_ref.id
        else:
            startup_id = startups[0].id
            
        print(f"Using Startup ID: {startup_id}")
        
        # 2. Add a Message for PRODUCT agent
        startup_ref = db.collection("startups").document(startup_id)
        msg_data = {
            "user_id": "test_user",
            "agent_name": "product",
            "role": "user",
            "content": f"Test message {datetime.utcnow()}",
            "created_at": datetime.utcnow()
        }
        _, ref = startup_ref.collection("chat_messages").add(msg_data)
        print(f"Added message ID: {ref.id} for agent 'product'")
        
        # 3. Add a Message for TECH agent (to test isolation)
        tech_msg_data = {
            "user_id": "test_user",
            "agent_name": "tech",
            "role": "user",
            "content": f"Tech message {datetime.utcnow()}",
            "created_at": datetime.utcnow()
        }
        _, ref_tech = startup_ref.collection("chat_messages").add(tech_msg_data)
        print(f"Added message ID: {ref_tech.id} for agent 'tech'")
        
        # 4. Query PRODUCT messages (Test Isolation & Index)
        print("Querying 'product' messages...")
        chat_ref = startup_ref.collection("chat_messages")
        query = chat_ref.where(filter=firestore.FieldFilter("agent_name", "==", "product"))
        query = query.order_by("created_at", direction=firestore.Query.DESCENDING).limit(10)
        
        docs = list(query.stream())
        print(f"Found {len(docs)} 'product' messages.")
        
        found_our_msg = False
        for doc in docs:
            d = doc.to_dict()
            print(f" - [{d.get('agent_name')}] {d.get('content')}")
            if doc.id == ref.id:
                found_our_msg = True
            if d.get("agent_name") != "product":
                print("!!! FAIL: Found non-product message in product query!")
                
        if found_our_msg:
            print("SUCCESS: Newly added message found.")
        else:
            print("FAIL: Newly added message NOT found (Index issue?).")
            
    except Exception as e:
        print("\n--- Error ---")
        print(str(e))
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    verify_chat_persistence()
