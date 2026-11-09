# Firebase Production Setup: Chethan Kumar B S Engineering Portfolio

**Database Tier:** Cloud Firestore (Native Mode)  
**Firebase Plan:** Spark Tier (Free — 50k reads, 20k writes, 1 GB storage daily)  
**Security Rules File:** [`firestore.rules`](file:///c:/Users/cheth/Downloads/Portfolio%20Website/firestore.rules)  
**Backend Adapter:** [`server/firebase.ts`](file:///c:/Users/cheth/Downloads/Portfolio%20Website/server/firebase.ts)

---

## 1. Firebase Architecture & Free Spark Tier Suitability

- **Zero Cloud Functions:** Outbound network calls from Firebase Cloud Functions require a paid Blaze plan. For this reason, this portfolio runs its backend on Railway (Node.js) instead of paid Cloud Functions.
- **Graceful Fallback:** If Firebase credentials are not supplied, the backend uses local persistent JSON storage (`server/security-state.json`) with zero runtime errors.
- **Admin SDK on Railway:** The Firebase Admin SDK runs strictly on the Railway backend, keeping service account keys confidential.

---

## 2. Firestore Production Collections

| Collection | Access Level | Description |
| :--- | :--- | :--- |
| `owner_profile` | Owner Write / Public Read | Dynamic name, professional title, location, and philosophy |
| `audit_logs` | Owner Read / Internal Write | Immutable security audit trail of all login events & MFA challenges |
| `fcm_tokens` | Owner Read / Device Write | Enrolled Web Push FCM tokens for real-time security alerts |

---

## 3. Firestore Security Rules (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read for owner profile, write restricted
    match /owner_profile/{docId} {
      allow read: if true;
      allow write: if false; // Only Admin SDK on Railway can write
    }

    // Audit logs strictly private
    match /audit_logs/{logId} {
      allow read, write: if false; // Only Admin SDK on Railway can read/write
    }

    // FCM tokens write-only
    match /fcm_tokens/{tokenId} {
      allow read, write: if false; // Only Admin SDK on Railway can read/write
    }
  }
}
```

---

## 4. Enabling Firestore on Railway

To connect Firestore to the deployed Railway backend:
1. Go to [Google Cloud Console / Firebase Console](https://console.firebase.google.com).
2. Go to **Project Settings** → **Service Accounts**.
3. Click **Generate New Private Key** (downloads a JSON file).
4. Set the following environment variables in Railway:
   - `FIREBASE_PROJECT_ID`: Your project ID.
   - `FIREBASE_CLIENT_EMAIL`: The `client_email` from the JSON.
   - `FIREBASE_PRIVATE_KEY`: The `private_key` from the JSON (preserving `\n`).
