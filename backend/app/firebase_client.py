import logging
import os
import firebase_admin
from firebase_admin import credentials, firestore, auth

logger = logging.getLogger(__name__)

_db = None

def ensure_firebase_initialized():
    """Ensure Firebase app is initialized."""
    try:
        app = firebase_admin.get_app()
        return app
    except ValueError:
        # Not initialized, try to init
        cred = None
        
        # 1. Try GOOGLE_APPLICATION_CREDENTIALS env var
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
        
        return firebase_admin.initialize_app(cred)

def get_firebase_db():
    """Get or initialize Firestore client."""
    global _db
    if _db:
        return _db
    
    try:
        ensure_firebase_initialized()
        _db = firestore.client()
        logger.info("Firestore client initialized successfully")
        return _db
    except Exception as e:
        logger.error(f"Failed to initialize Firestore: {e}")
        raise e

def verify_token(token: str):
    """Verify Firebase ID token."""
    try:
        ensure_firebase_initialized()
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        error_msg = str(e)
        # Handle clock skew (Token used too early)
        if "Token used too early" in error_msg:
            import time
            logger.warning(f"Token used too early (clock skew), retrying in 2 seconds... Error: {e}")
            time.sleep(2)
            try:
                decoded_token = auth.verify_id_token(token)
                return decoded_token
            except Exception as retry_e:
                logger.error(f"Token verification failed after retry: {retry_e}")
                return None
                
        logger.error(f"Token verification failed: {e}")
        return None
