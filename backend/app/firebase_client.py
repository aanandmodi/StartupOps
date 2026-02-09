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
        
        # 1. Try GOOGLE_APPLICATION_CREDENTIALS_JSON env var (Content)
        json_creds = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
        if json_creds:
            try:
                import json
                cred_dict = json.loads(json_creds)
                logger.info("Initializing Firebase with GOOGLE_APPLICATION_CREDENTIALS_JSON env var")
                cred = credentials.Certificate(cred_dict)
                return firebase_admin.initialize_app(cred)
            except Exception as e:
                logger.error(f"Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON: {e}")

        # 2. Try GOOGLE_APPLICATION_CREDENTIALS env var (Path)
        key_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        if key_path and os.path.exists(key_path):
            logger.info(f"Initializing Firebase with service account: {key_path}")
            cred = credentials.Certificate(key_path)
            return firebase_admin.initialize_app(cred)

        # 3. Local file fallback
        current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        local_key = os.path.join(current_dir, "service-account.json")
        if os.path.exists(local_key):
                logger.info(f"Initializing Firebase with local service-account.json: {local_key}")
                cred = credentials.Certificate(local_key)
                return firebase_admin.initialize_app(cred)
        
        # 4. Default credentials
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
        # Allow 10 seconds of clock skew
        decoded_token = auth.verify_id_token(token, clock_skew_seconds=10)
        return decoded_token
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        return None
