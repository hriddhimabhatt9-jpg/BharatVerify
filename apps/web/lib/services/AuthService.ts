/**
 * AuthService
 * 
 * Handles DID-based authentication for the BharatVerify platform.
 * This service manages:
 * 1. Admin authentication for issuer operations
 * 2. Session management
 * 3. DID resolution and validation
 * 
 * --- Authentication Flow ---
 * 
 * ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
 * │  Admin User  │────▶│  Auth QR     │────▶│  Privado ID  │
 * │              │     │  (iden3comm) │     │  Wallet      │
 * └──────────────┘     └──────────────┘     └──────────────┘
 *                              │
 *                              ▼
 *                      ┌──────────────┐
 *                      │  Callback    │
 *                      │  with proof  │
 *                      └──────────────┘
 *                              │
 *                              ▼
 *                      ┌──────────────┐
 *                      │  Session     │
 *                      │  Created     │
 *                      └──────────────┘
 * 
 * For the MVP/hackathon, we also support simple API key authentication.
 */

import { v4 as uuidv4 } from "uuid";
import { getPrivadoIDService, AuthorizationScope, Iden3AuthorizationRequest } from "./PrivadoIDService";

// ============================================
// TYPES
// ============================================

export interface AuthSession {
    id: string;
    type: "admin" | "issuer" | "verifier";
    did?: string;
    userId?: string;
    createdAt: Date;
    expiresAt: Date;
    metadata?: Record<string, any>;
}

export interface AuthChallengeRequest {
    challengeId: string;
    authRequest: Iden3AuthorizationRequest;
    qrCodeData: string;
    deepLink: string;
    expiresAt: Date;
}

export interface AuthResult {
    success: boolean;
    session?: AuthSession;
    error?: string;
}

// ============================================
// IN-MEMORY STORES (Replace with Redis/DB in production)
// ============================================

const sessionStore = new Map<string, AuthSession>();
const challengeStore = new Map<string, {
    type: "admin" | "issuer" | "verifier";
    createdAt: Date;
    resolved: boolean;
    did?: string;
}>();

// Session validity duration (24 hours)
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

// Challenge validity duration (5 minutes)
const CHALLENGE_DURATION_MS = 5 * 60 * 1000;

// ============================================
// SERVICE IMPLEMENTATION
// ============================================

export class AuthService {
    private adminApiKeys: Set<string>;

    constructor() {
        // Load admin API keys from environment
        const apiKeysEnv = process.env.ADMIN_API_KEYS || "";
        this.adminApiKeys = new Set(
            apiKeysEnv.split(",").map(k => k.trim()).filter(Boolean)
        );

        // Add default dev key if no keys configured
        if (this.adminApiKeys.size === 0 && process.env.NODE_ENV !== "production") {
            this.adminApiKeys.add("dev-api-key-12345");
        }
    }

    // ============================================
    // API KEY AUTHENTICATION (Simple mode for MVP)
    // ============================================

    /**
     * Authenticate using API key
     * 
     * Simple authentication method for backend-to-backend communication
     * and admin operations.
     */
    authenticateWithApiKey(apiKey: string): AuthResult {
        if (!apiKey) {
            return { success: false, error: "API key is required" };
        }

        if (!this.adminApiKeys.has(apiKey)) {
            return { success: false, error: "Invalid API key" };
        }

        const session = this.createSession("admin");
        return { success: true, session };
    }

    // ============================================
    // DID-BASED AUTHENTICATION (Production mode)
    // ============================================

    /**
     * Generate an authentication challenge
     * 
     * Creates an iden3comm authorization request that the admin
     * scans with their Privado ID wallet to prove their identity.
     */
    generateAuthChallenge(
        type: "admin" | "issuer" | "verifier",
        requiredCredentials?: AuthorizationScope[]
    ): AuthChallengeRequest {
        const challengeId = uuidv4();
        const privadoService = getPrivadoIDService();

        // Build scope based on authentication type
        const scope: AuthorizationScope[] = requiredCredentials || [];

        // For admin auth, we could require specific credentials
        if (type === "admin" && scope.length === 0) {
            // No specific credential requirement for basic auth
            // In production, you might require an "AdminCredential"
        }

        const { request, qrCodeData, deepLink } = privadoService.generateAuthorizationRequest(
            challengeId,
            scope,
            `Authenticate as ${type} for BharatVerify`
        );

        // Store the challenge
        challengeStore.set(challengeId, {
            type,
            createdAt: new Date(),
            resolved: false,
        });

        // Clean up expired challenges
        this.cleanupExpiredChallenges();

        return {
            challengeId,
            authRequest: request,
            qrCodeData,
            deepLink,
            expiresAt: new Date(Date.now() + CHALLENGE_DURATION_MS),
        };
    }

    /**
     * Process authentication callback from wallet
     * 
     * Called when the user's wallet sends the ZK-proof to our callback.
     */
    async processAuthCallback(
        challengeId: string,
        proofResponse: any
    ): Promise<AuthResult> {
        const challenge = challengeStore.get(challengeId);

        if (!challenge) {
            return { success: false, error: "Challenge not found or expired" };
        }

        if (challenge.resolved) {
            return { success: false, error: "Challenge already resolved" };
        }

        // Check if challenge has expired
        const challengeAge = Date.now() - challenge.createdAt.getTime();
        if (challengeAge > CHALLENGE_DURATION_MS) {
            challengeStore.delete(challengeId);
            return { success: false, error: "Challenge expired" };
        }

        // Extract DID from proof response
        const holderDid = proofResponse.from || proofResponse.body?.id;
        if (!holderDid) {
            return { success: false, error: "Invalid proof: missing DID" };
        }

        // In production, verify the ZK-proof here using @iden3/js-iden3-auth
        // For MVP, we trust the proof if the structure is valid

        // Mark challenge as resolved
        challengeStore.set(challengeId, {
            ...challenge,
            resolved: true,
            did: holderDid,
        });

        // Create session
        const session = this.createSession(challenge.type, holderDid);

        return { success: true, session };
    }

    // ============================================
    // SESSION MANAGEMENT
    // ============================================

    /**
     * Create a new session
     */
    private createSession(
        type: "admin" | "issuer" | "verifier",
        did?: string,
        userId?: string
    ): AuthSession {
        const session: AuthSession = {
            id: uuidv4(),
            type,
            did,
            userId,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
        };

        sessionStore.set(session.id, session);

        // Cleanup old sessions periodically
        this.cleanupExpiredSessions();

        return session;
    }

    /**
     * Validate a session
     */
    validateSession(sessionId: string): AuthSession | null {
        if (!sessionId) return null;

        const session = sessionStore.get(sessionId);
        if (!session) return null;

        // Check expiration
        if (new Date() > session.expiresAt) {
            sessionStore.delete(sessionId);
            return null;
        }

        return session;
    }

    /**
     * Revoke a session
     */
    revokeSession(sessionId: string): boolean {
        return sessionStore.delete(sessionId);
    }

    /**
     * Get session by DID
     */
    getSessionByDid(did: string): AuthSession | null {
        for (const session of sessionStore.values()) {
            if (session.did === did && new Date() < session.expiresAt) {
                return session;
            }
        }
        return null;
    }

    // ============================================
    // DID UTILITIES
    // ============================================

    /**
     * Validate DID format
     * 
     * Privado ID DIDs follow the format:
     * did:polygonid:polygon:{network}:{identifier}
     */
    isValidDid(did: string): boolean {
        if (!did) return false;

        // Basic Polygon ID DID format check
        const polygonIdPattern = /^did:polygonid:polygon:(main|amoy|mumbai):.+$/;
        if (polygonIdPattern.test(did)) return true;

        // Also accept other DID methods for flexibility
        const genericPattern = /^did:[a-z0-9]+:.+$/;
        return genericPattern.test(did);
    }

    /**
     * Extract network from DID
     */
    extractNetworkFromDid(did: string): string | null {
        const match = did.match(/^did:polygonid:polygon:([^:]+):/);
        return match ? match[1] : null;
    }

    // ============================================
    // CLEANUP METHODS
    // ============================================

    private cleanupExpiredSessions(): void {
        const now = new Date();
        for (const [id, session] of sessionStore.entries()) {
            if (now > session.expiresAt) {
                sessionStore.delete(id);
            }
        }
    }

    private cleanupExpiredChallenges(): void {
        const now = Date.now();
        for (const [id, challenge] of challengeStore.entries()) {
            if (now - challenge.createdAt.getTime() > CHALLENGE_DURATION_MS) {
                challengeStore.delete(id);
            }
        }
    }

    // ============================================
    // STATS
    // ============================================

    getStats() {
        return {
            activeSessions: sessionStore.size,
            pendingChallenges: Array.from(challengeStore.values())
                .filter(c => !c.resolved).length,
        };
    }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let authServiceInstance: AuthService | null = null;

export function getAuthService(): AuthService {
    if (!authServiceInstance) {
        authServiceInstance = new AuthService();
    }
    return authServiceInstance;
}
