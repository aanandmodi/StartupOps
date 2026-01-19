# Implementation Plan - Backend Migration to Firestore

This plan outlines the steps to replace the PostgreSQL/SQLAlchemy backend with Firebase Admin SDK and Cloud Firestore.

## Goal
Completely remove PostgreSQL dependencies and use Cloud Firestore as the primary database for the StartupOps backend.

## 1. Configuration & Dependencies
- [ ] Add `firebase-admin` to `requirements.txt`.
- [ ] Create `app/firebase_client.py` to initialize the Firebase Admin app singleton.
- [ ] Update `app/config.py` to support Google Application Credentials path.

## 2. Authentication Refactor (`app/routers/auth.py`)
The authentication flow changes significantly.
- **Current**: Frontend sends credentials -> Backend validates hash -> Backend issues JWT.
- **New Pattern**: Frontend signs in with Firebase -> Frontend sends Firebase ID Token -> Backend verifies Token.

**Changes:**
- [ ] Update `get_current_user` dependency to:
    1. Extract Bearer token.
    2. Verify via `auth.verify_id_token(token)`.
    3. Return user dict/object from Firestore 'users' collection.
- [ ] Remove `login`, `signup`, `google`, `github` endpoints from backend (handled by frontend).
- [ ] Keep `get_current_user` (or `/me`) endpoint for profile data.

## 3. Data Access Refactor
We will replace SQLAlchemy queries with Firestore calls.

### Startup Router (`app/routers/startups.py`)
- [ ] `list_my_startups`: Query `db.collection('startups').where('user_id', '==', uid).stream()`.
- [ ] `create_startup`: `db.collection('startups').add({...})`.
- [ ] `get_startup`, `update_startup`, `delete_startup`: Document references `db.collection('startups').document(id)`.

### Execution Router (`app/routers/execution.py`)
- [ ] Refactor to use sub-collections or top-level collections for `tasks`, `kpis`, `logs`.
- [ ] Path: `startups/{startup_id}/tasks` is a good structure for sub-collections.

### Chat Router (`app/routers/chat.py`)
- [ ] Store messages in `startups/{startup_id}/chat_messages`.
- [ ] Structure timestamps for ordering.

## 4. Cleanup
- [ ] Remove `app/database.py`.
- [ ] Remove `app/models/` (SQLAlchemy models).
- [ ] Clean `main.py` (remove `init_db`).

## Migration Strategy
We will perform this router-by-router to keep the app runnable (though mixed state) during the process, or do it all in one go if preferred. Given the interdependencies, a "Core First" approach is best.

1.  **Setup Firebase Client**.
2.  **Fix Auth**.
3.  **Fix Startups**.
4.  **Fix key Services** (Agents).
