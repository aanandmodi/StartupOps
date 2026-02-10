# Firebase Integration & Migration Instructions

## 1. Frontend Setup (Authentication)

### Environment Variables
You need to add your Firebase configuration to your frontend environment file (`startup-ops/.env` or `.env.local`).

Get these values from your Firebase Console -> Project Settings -> General -> Your Apps -> Web App.

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```
*+

### Firebase Console Setup
1. Go to **Authentication** -> **Sign-in method**.
2. Enable **Google**.
3. Enable **GitHub**.
   - You will need to creating an OAuth App in GitHub (Settings -> Developer settings -> OAuth Apps).
   - **Homepage URL**: `https://your-firebase-domain.firebaseapp.com` (or localhost for testing)
   - **Authorization callback URL**: The one provided in the Firebase Console (usually `https://your-project-id.firebaseapp.com/__/auth/handler`).

## 2. Backend Setup (Database Migration)

### Prerequisites
The backend script `migrate_to_firestore.py` uses the Firebase Admin SDK. It needs authentication to write to your Firestore database.

**Option A: GCloud CLI (Recommended for Local Dev)**
Run this command in your terminal:
```bash
gcloud auth application-default login
```
This authorizes your local environment to act as your Google account.

**Option B: Service Account Key**
1. Go to Firebase Console -> Project Settings -> Service accounts.
2. Click "Generate new private key".
3. Save the JSON file./
  21      q1 aza2WSAZZSWESDXZSDEW2E35T7UO90P[\]. Set the environment variable:
   ```powershell
   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\4
   ```

### Running the Migration
Once authenticated, run the migration script from the `backend/` directory:

```bash
cd backend
python migrate_to_firestore.py
```

This script currently migrates:
- **Users**: Moves users from SQLite `users` table to Firestore `users` collection.

You can extend this script (`migrate_to_firestore.py`) to include other models (`Startups`, `Tasks`, etc.) by following the pattern in the `migrate_users` function.
