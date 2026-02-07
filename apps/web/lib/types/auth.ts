/**
 * Authentication Types
 * 
 * Defines user roles, organization types, and auth-related structures
 * for the BharatVerify platform.
 */

// ============================================
// USER ROLES
// ============================================

export type UserRole = "admin" | "issuer" | "verifier" | "pending";

export type OrganizationType =
    | "university"
    | "iti"
    | "polytechnic"
    | "training_center"
    | "employer"
    | "government"
    | "other";

export type ApplicationStatus = "pending" | "approved" | "rejected";

// ============================================
// USER & ORGANIZATION
// ============================================

export interface User {
    id: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
    isActive: boolean;
    walletAddress?: string;
    did?: string;
}

export interface Organization {
    id: string;
    name: string;
    type: OrganizationType;
    registrationNumber: string; // CIN, AISHE code, etc.
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    website?: string;
    documentHashes?: string[]; // IPFS hashes of verification documents
    walletAddress?: string;
    did?: string;
    status: ApplicationStatus;
    role: "issuer" | "verifier";
    isAuthorizedOnChain: boolean;
    authorizedAt?: Date;
    authorizedBy?: string;
    rejectedAt?: Date;
    rejectedBy?: string;
    rejectionReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

// ============================================
// REGISTRATION REQUEST
// ============================================

export interface RegistrationRequest {
    // User info
    email: string;
    password: string;

    // Organization info
    organizationName: string;
    organizationType: OrganizationType;
    registrationNumber: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    website?: string;

    // Role being requested
    requestedRole: "issuer" | "verifier";

    // Optional wallet connection
    walletAddress?: string;
}

// ============================================
// JWT TOKENS
// ============================================

export interface JWTPayload {
    userId: string;
    email: string;
    role: UserRole;
    organizationId: string;
    organizationName: string;
    isAuthorizedOnChain: boolean;
    iat: number;
    exp: number;
}

export interface RefreshTokenPayload {
    userId: string;
    tokenVersion: number;
    iat: number;
    exp: number;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

// ============================================
// AUTH RESPONSES
// ============================================

export interface AuthResponse {
    success: boolean;
    message?: string;
    error?: string;
    user?: {
        id: string;
        email: string;
        role: UserRole;
        organization: {
            id: string;
            name: string;
            type: OrganizationType;
            isAuthorizedOnChain: boolean;
        };
    };
    tokens?: TokenPair;
}

export interface SessionResponse {
    valid: boolean;
    user?: {
        id: string;
        email: string;
        role: UserRole;
        organizationId: string;
        organizationName: string;
        isAuthorizedOnChain: boolean;
    };
}

// ============================================
// ADMIN TYPES
// ============================================

export interface ApplicationReview {
    applicationId: string;
    action: "approve" | "reject";
    reason?: string;
    adminUserId: string;
}

export interface ActivityLog {
    id: string;
    timestamp: Date;
    eventType:
    | "REGISTRATION_SUBMITTED"
    | "APPLICATION_APPROVED"
    | "APPLICATION_REJECTED"
    | "CREDENTIAL_ISSUED"
    | "VERIFICATION_COMPLETED"
    | "AUTHORIZATION_GRANTED"
    | "AUTHORIZATION_REVOKED";
    actorId: string;
    actorType: "admin" | "issuer" | "verifier" | "system";
    targetId?: string;
    metadata?: Record<string, any>;
    txHash?: string; // Blockchain transaction hash if applicable
}
