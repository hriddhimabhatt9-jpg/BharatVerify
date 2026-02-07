/**
 * Auth Store
 * 
 * Firestore-based storage for users and organizations.
 * Handles CRUD operations for authentication data.
 */

import { getFirestoreDb, COLLECTIONS } from "@/lib/firebase/admin";
import { User, Organization, ActivityLog, UserRole, ApplicationStatus } from "@/lib/types/auth";
import { v4 as uuidv4 } from "uuid";

// ============================================
// USER OPERATIONS
// ============================================

/**
 * Create a new user
 */
export async function createUser(
    email: string,
    passwordHash: string,
    organizationId: string,
    role: UserRole = "pending"
): Promise<User> {
    const db = getFirestoreDb();
    const id = uuidv4();
    const now = new Date();

    const user: User = {
        id,
        email: email.toLowerCase(),
        passwordHash,
        role,
        organizationId,
        createdAt: now,
        updatedAt: now,
        isActive: true,
    };

    await db.collection(COLLECTIONS.USERS).doc(id).set({
        ...user,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
    });

    return user;
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
    const db = getFirestoreDb();
    const doc = await db.collection(COLLECTIONS.USERS).doc(id).get();

    if (!doc.exists) return null;

    const data = doc.data()!;
    return {
        ...data,
        id: doc.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        lastLoginAt: data.lastLoginAt ? new Date(data.lastLoginAt) : undefined,
    } as User;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
    const db = getFirestoreDb();
    const snapshot = await db
        .collection(COLLECTIONS.USERS)
        .where("email", "==", email.toLowerCase())
        .limit(1)
        .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
        ...data,
        id: doc.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        lastLoginAt: data.lastLoginAt ? new Date(data.lastLoginAt) : undefined,
    } as User;
}

/**
 * Update user's last login
 */
export async function updateUserLastLogin(userId: string): Promise<void> {
    const db = getFirestoreDb();
    await db.collection(COLLECTIONS.USERS).doc(userId).update({
        lastLoginAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });
}

/**
 * Update user role
 */
export async function updateUserRole(userId: string, role: UserRole): Promise<void> {
    const db = getFirestoreDb();
    await db.collection(COLLECTIONS.USERS).doc(userId).update({
        role,
        updatedAt: new Date().toISOString(),
    });
}

// ============================================
// ORGANIZATION OPERATIONS
// ============================================
/**
 * Create a new organization
 */
export async function createOrganization(
    data: Omit<Organization, "id" | "createdAt" | "updatedAt" | "status" | "isAuthorizedOnChain">
): Promise<Organization> {
    const db = getFirestoreDb();
    const id = uuidv4();
    const now = new Date();

    const organization: Organization = {
        ...data,
        id,
        status: "pending",
        isAuthorizedOnChain: false,
        createdAt: now,
        updatedAt: now,
    };

    // Remove undefined values (Firestore doesn't accept undefined)
    const firestoreData: Record<string, any> = {
        ...organization,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
    };
    Object.keys(firestoreData).forEach(key => {
        if (firestoreData[key] === undefined) {
            delete firestoreData[key];
        }
    });

    await db.collection(COLLECTIONS.ORGANIZATIONS).doc(id).set(firestoreData);

    return organization;
}

/**
 * Get organization by ID
 */
export async function getOrganizationById(id: string): Promise<Organization | null> {
    const db = getFirestoreDb();
    const doc = await db.collection(COLLECTIONS.ORGANIZATIONS).doc(id).get();

    if (!doc.exists) return null;

    const data = doc.data()!;
    return {
        ...data,
        id: doc.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        authorizedAt: data.authorizedAt ? new Date(data.authorizedAt) : undefined,
        rejectedAt: data.rejectedAt ? new Date(data.rejectedAt) : undefined,
    } as Organization;
}

/**
 * Get organizations by status
 */
export async function getOrganizationsByStatus(
    status: ApplicationStatus
): Promise<Organization[]> {
    const db = getFirestoreDb();
    // Note: Removed orderBy to avoid needing composite index
    const snapshot = await db
        .collection(COLLECTIONS.ORGANIZATIONS)
        .where("status", "==", status)
        .get();

    const orgs = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            ...data,
            id: doc.id,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
            authorizedAt: data.authorizedAt ? new Date(data.authorizedAt) : undefined,
            rejectedAt: data.rejectedAt ? new Date(data.rejectedAt) : undefined,
        } as Organization;
    });

    // Sort client-side (newest first)
    return orgs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Get all organizations (for admin)
 */
export async function getAllOrganizations(): Promise<Organization[]> {
    const db = getFirestoreDb();
    const snapshot = await db
        .collection(COLLECTIONS.ORGANIZATIONS)
        .orderBy("createdAt", "desc")
        .get();

    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            ...data,
            id: doc.id,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
            authorizedAt: data.authorizedAt ? new Date(data.authorizedAt) : undefined,
            rejectedAt: data.rejectedAt ? new Date(data.rejectedAt) : undefined,
        } as Organization;
    });
}

/**
 * Approve an organization
 */
export async function approveOrganization(
    organizationId: string,
    adminUserId: string
): Promise<void> {
    const db = getFirestoreDb();
    const now = new Date();

    await db.collection(COLLECTIONS.ORGANIZATIONS).doc(organizationId).update({
        status: "approved",
        authorizedAt: now.toISOString(),
        authorizedBy: adminUserId,
        updatedAt: now.toISOString(),
    });
}

/**
 * Reject an organization
 */
export async function rejectOrganization(
    organizationId: string,
    adminUserId: string,
    reason: string
): Promise<void> {
    const db = getFirestoreDb();
    const now = new Date();

    await db.collection(COLLECTIONS.ORGANIZATIONS).doc(organizationId).update({
        status: "rejected",
        rejectedAt: now.toISOString(),
        rejectedBy: adminUserId,
        rejectionReason: reason,
        updatedAt: now.toISOString(),
    });
}

/**
 * Update organization's on-chain authorization status
 */
export async function updateOrganizationOnChainStatus(
    organizationId: string,
    isAuthorized: boolean,
    walletAddress?: string
): Promise<void> {
    const db = getFirestoreDb();
    const updates: Record<string, any> = {
        isAuthorizedOnChain: isAuthorized,
        updatedAt: new Date().toISOString(),
    };

    if (walletAddress) {
        updates.walletAddress = walletAddress;
    }

    await db.collection(COLLECTIONS.ORGANIZATIONS).doc(organizationId).update(updates);
}

// ============================================
// ACTIVITY LOG OPERATIONS
// ============================================

/**
 * Log an activity
 */
export async function logActivity(
    eventType: ActivityLog["eventType"],
    actorId: string,
    actorType: ActivityLog["actorType"],
    targetId?: string,
    metadata?: Record<string, any>,
    txHash?: string
): Promise<ActivityLog> {
    const db = getFirestoreDb();
    const id = uuidv4();
    const now = new Date();

    const log: ActivityLog = {
        id,
        timestamp: now,
        eventType,
        actorId,
        actorType,
        targetId,
        metadata,
        txHash,
    };

    await db.collection(COLLECTIONS.ACTIVITY_LOGS).doc(id).set({
        ...log,
        timestamp: now.toISOString(),
    });

    return log;
}

/**
 * Get recent activity logs
 */
export async function getRecentActivityLogs(limit: number = 50): Promise<ActivityLog[]> {
    const db = getFirestoreDb();
    const snapshot = await db
        .collection(COLLECTIONS.ACTIVITY_LOGS)
        .orderBy("timestamp", "desc")
        .limit(limit)
        .get();

    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            ...data,
            id: doc.id,
            timestamp: new Date(data.timestamp),
        } as ActivityLog;
    });
}

/**
 * Get activity logs by actor
 */
export async function getActivityLogsByActor(
    actorId: string,
    limit: number = 50
): Promise<ActivityLog[]> {
    const db = getFirestoreDb();
    const snapshot = await db
        .collection(COLLECTIONS.ACTIVITY_LOGS)
        .where("actorId", "==", actorId)
        .orderBy("timestamp", "desc")
        .limit(limit)
        .get();

    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            ...data,
            id: doc.id,
            timestamp: new Date(data.timestamp),
        } as ActivityLog;
    });
}
