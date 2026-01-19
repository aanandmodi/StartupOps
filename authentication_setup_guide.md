# Google & GitHub Authentication Setup Guide

Follow these steps to enable "Sign in with Google" and "Sign in with GitHub" in your application.

## Phase 1: Create Firebase Project

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Click **Add project** and name it `StartupOps` (or your preferred name).
3.  Disable Google Analytics for this project (unless you specifically want it) to simplify setup.
4.  Click **Create project**.

## Phase 2: Register Web App

1.  Inside your new project dashboard, click the **Web icon** (`</>`) to add an app.
2.  App nickname: `StartupOps Web`.
3.  Click **Register app**.
4.  **Copy the `firebaseConfig` object**. You will need these values for your environment variables.
5.  Create/Edit `.env.local` in your `startup-ops` (frontend) folder and add these lines:

    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456...
    NEXT_PUBLIC_FIREBASE_APP_ID=1:12345:web:abcdef...
    ```

## Phase 3: Enable Google Authentication

1.  In Firebase Console, go to **Build** -> **Authentication**.
2.  Click **Get Started**.
3.  Select **Sign-in method** tab.
4.  Click **Google**.
5.  Toggle **Enable**.
6.  Set the **Project support email** (select your email).
7.  Click **Save**.
8.  *Done! Google Auth is ready.*

## Phase 4: Enable GitHub Authentication

This requires settings in both GitHub and Firebase.

### Step 4.1: Get Callback URL
1.  In Firebase Console -> Authentication -> Sign-in method.
2.  Click **GitHub**.
3.  Toggle **Enable**.
4.  **Copy** the "Authorization callback URL". It looks like:
    `https://YOUR-PROJECT.firebaseapp.com/__/auth/handler`
5.  Keep this tab open.

### Step 4.2: Create GitHub OAuth App
1.  Open a new tab to [GitHub Developer Settings](https://github.com/settings/developers).
2.  Click **New OAuth App**.
3.  **Application Name**: `StartupOps Login`.
4.  **Homepage URL**: `http://localhost:3000` (for local dev).
5.  **Authorization callback URL**: Paste the URL you copied from Firebase (Step 4.1).
6.  Click **Register application**.

### Step 4.3: Finish Firebase Config
1.  On the GitHub App page you just created, look for **Client ID** (copy it).
2.  Click **Generate a new client secret** (copy it).
3.  Go back to your Firebase Console tab.
4.  Paste the **Client ID** and **Client Secret** into the GitHub configuration window.
5.  Click **Save**.

## Phase 5: Verification

1.  Restart your frontend server:
    ```bash
    # in startup-ops terminal
    Ctrl+C
    npm run dev
    ```
2.  Go to `http://localhost:3000/login`.
3.  Click "Google". A popup should appear asking you to sign in.
4.  Click "GitHub". A popup should appear asking you to authorize the app.

## Troubleshooting

*   **"Authorized domain" error**: If your app is live (not localhost/vercel), go to Firebase Auth -> Settings -> Authorized domains and add your domain (e.g., `myapp.com`).
*   **Popup closed by user**: This is normal if you close the window manually.
*   **Configuration not found**: Ensure you restarted the Next.js server after saving `.env.local`.
