/**
 * Firebase Admin SDK Configuration
 * 
 * Initializes Firebase Admin for server-side operations including Firestore.
 */

import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let firebaseApp: App | null = null;
let firestoreDb: Firestore | null = null;

/**
 * Get or initialize Firebase Admin app
 */
export function getFirebaseAdmin(): App {
    if (firebaseApp) return firebaseApp;

    const existingApps = getApps();
    if (existingApps.length > 0) {
        firebaseApp = existingApps[0];
        return firebaseApp;
    }

    // Initialize with service account or environment variables
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccount) {
        try {
            const parsedKey = JSON.parse(serviceAccount);
            firebaseApp = initializeApp({
                credential: cert(parsedKey),
                projectId: process.env.FIREBASE_PROJECT_ID,
            });
        } catch (error) {
            console.error("[Firebase] Error parsing service account:", error);
            // Fallback to default initialization
            firebaseApp = initializeApp({
                projectId: process.env.FIREBASE_PROJECT_ID,
            });
        }
    } else {
        // Initialize with project ID only (for local development with emulator)
        firebaseApp = initializeApp({
            projectId: process.env.FIREBASE_PROJECT_ID || "bharatverify-dev",
        });
    }

    return firebaseApp;
}

/**
 * Get Firestore instance
 */
export function getFirestoreDb(): Firestore {
    if (firestoreDb) return firestoreDb;

    getFirebaseAdmin(); // Ensure app is initialized
    firestoreDb = getFirestore();

    return firestoreDb;
}

// Collection names
export const COLLECTIONS = {
    USERS: "users",
    ORGANIZATIONS: "organizations",
    ACTIVITY_LOGS: "activity_logs",
    CLAIMS: "claims",
    VERIFICATIONS: "verifications",
    SESSIONS: "sessions",
} as const;
