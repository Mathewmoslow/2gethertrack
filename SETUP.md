# 2getherTrack Setup

The app is wired to the Firebase project `togethertrack-8d603` and uses only Email/Password sign-in. There is no Google sign-in, no local-only mode, and no in-app Firebase project switcher.

Firebase can stay under your Google account for now. Later, you can add the trainer as a project owner in Firebase Console or transfer operational access without changing the app's sign-in method.

## Step 1 — Enable Email/Password Auth

1. Open `https://console.firebase.google.com/project/togethertrack-8d603/overview`.
2. In the left sidebar, click **Authentication**. If you do not see it, use the sidebar search box and search for **Authentication**.
3. Click **Get started** if Firebase asks.
4. Open **Sign-in method** or **Providers**.
5. Click **Add new provider**.
6. Choose **Email/Password**, toggle **Enable**, and click **Save**.

Do not enable Google as a provider. The app does not use it.

## Step 2 — Create Firestore

1. In the Firebase sidebar, click **Databases & Storage → Firestore Database** or search for **Firestore**.
2. Click **Create database**.
3. Choose **Start in production mode**.
4. Pick the closest region, then click **Enable**.

## Step 3 — Publish Firestore Rules

In Firestore, open the **Rules** tab, replace the rules with this, then click **Publish**:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## Step 4 — Use The Hosted App

Open the hosted URL, then create the trainer account with email/password. That same email/password works on every device and syncs the same Firestore workspace.

## Backups

Use **Settings → Export Backup** to download a JSON backup of clients, expenses, and app settings. Use **Import Backup** to replace the current workspace with a backup.

## Cost

Firebase's free Spark plan is enough for a single trainer:

- 1 GB Firestore storage
- 50,000 reads / 20,000 writes / 20,000 deletes per day
- Email/password authentication

No credit card is required for the expected use here.

## Troubleshooting

**Email/password says it is disabled:** Enable **Authentication → Sign-in method/Providers → Email/Password** in Firebase.

**Permission denied or data will not save:** Publish the Firestore rules from Step 3.

**Hosted domain auth error:** In Firebase Console, go to **Authentication → Settings → Authorized domains** and add the hosted app domain.
