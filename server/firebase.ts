import path from 'node:path';
import fs from 'node:fs';

/**
 * Firebase Firestore Backend Adapter for Chethan Kumar Portfolio
 * 
 * Provides unified persistence to Firebase Firestore with automatic
 * graceful fallback to local persistent storage (server/security-state.json).
 * 
 * Spark vs. Blaze Plan Notice:
 * - Firestore is free on Firebase Spark tier (up to 50k reads / 20k writes / 1 GB storage daily).
 * - Firebase Cloud Messaging (FCM) web push is free on all tiers.
 * - Outbound external network requests from Firebase Cloud Functions require Blaze plan,
 *   which is why this portfolio runs its backend on Railway/Node instead of paid Cloud Functions.
 */

let firestoreDb: any = null;
let firebaseInitialized = false;

export function isFirebaseConfigured(): boolean {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  return Boolean(projectId && clientEmail && privateKey);
}

export async function getFirestoreInstance(): Promise<any | null> {
  if (firebaseInitialized) return firestoreDb;
  
  if (!isFirebaseConfigured()) {
    return null;
  }

  try {
    // Dynamic import to avoid build errors if package is absent in dev
    // @ts-ignore
    const admin = await import('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')
        })
      });
    }
    firestoreDb = admin.firestore();
    firebaseInitialized = true;
    console.log('[Firebase] Firestore initialized successfully.');
    return firestoreDb;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn('[Firebase] Initialization skipped or failed:', errorMsg);
    return null;
  }
}

export async function persistProfileToFirestore(profile: any): Promise<boolean> {
  const db = await getFirestoreInstance();
  if (!db) return false;
  try {
    await db.collection('owner_profile').doc('current').set(profile, { merge: true });
    return true;
  } catch (err) {
    console.error('[Firebase] Failed to persist profile to Firestore:', err);
    return false;
  }
}

export async function logAuditToFirestore(auditLog: any): Promise<boolean> {
  const db = await getFirestoreInstance();
  if (!db) return false;
  try {
    await db.collection('audit_logs').doc(auditLog.id).set(auditLog);
    return true;
  } catch (err) {
    return false;
  }
}

export async function registerFCMDeviceTokenInFirestore(tokenData: any): Promise<boolean> {
  const db = await getFirestoreInstance();
  if (!db) return false;
  try {
    await db.collection('fcm_tokens').doc(tokenData.token).set(tokenData, { merge: true });
    return true;
  } catch (err) {
    return false;
  }
}
