import logging
import os
import firebase_admin
from firebase_admin import credentials, firestore, auth

logger = logging.getLogger(__name__)

_db = None

def get_firebase_db():
    """Get or initialize Firestore client."""
    global _db
    if _db:
        return _db
    
    try:
        # Check if already initialized
        try:
            app = firebase_admin.get_app()
        except ValueError:
            # Not initialized, try to init
            cred = None
            
            # 1. Try GOOGLE_APPLICATION_CREDENTIALS env var (handled by ApplicationDefault automatically usually, 
            # but we can also check for explicit service account file)
            key_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
            if key_path and os.path.exists(key_path):
                logger.info(f"Initializing Firebase with service account: {key_path}")
                cred = credentials.Certificate(key_path)
            else:
                current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                local_key = os.path.join(current_dir, "service-account.json")
                if os.path.exists(local_key):
                     logger.info(f"Initializing Firebase with local service-account.json: {local_key}")
                     cred = credentials.Certificate(local_key)
                else:
                    logger.info("Initializing Firebase with Application Default Credentials")
                    cred = credentials.ApplicationDefault()
            
            app = firebase_admin.initialize_app(cred)
        
        _db = firestore.client()
        logger.info("Firestore client initialized successfully")
        return _db
    except Exception as e:
        logger.error(f"Failed to initialize Firestore: {e}")
        raise e

def verify_token(token: str):
    """Verify Firebase ID token."""
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        return None
