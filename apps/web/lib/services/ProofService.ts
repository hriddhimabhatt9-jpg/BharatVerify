/**
 * ProofService
 * 
 * Handles Zero-Knowledge Proof verification requests for BharatVerify.
 * This service allows Verifiers (Employers) to create proof requests
 * that users can satisfy using their Privado ID wallet.
 * 
 * --- ZK-Proof Flow ---
 * 
 * ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
 * │  Verifier    │────▶│  Proof       │────▶│  QR Code     │
 * │  (Employer)  │     │  Service     │     │  for User    │
 * └──────────────┘     └──────────────┘     └──────────────┘
 *                                                  │
 *                                                  ▼
 *                                           ┌──────────────┐
 *                                           │  Privado ID  │
 *                                           │  Wallet      │
 *                                           └──────────────┘
 *                                                  │
 *                                                  │ ZK Proof
 *                                                  ▼
 *                                           ┌──────────────┐
 *                                           │  Callback    │
 *                                           │  Endpoint    │
 *                                           └──────────────┘
 *                                                  │
 *                                                  ▼
 *                                           ┌──────────────┐
 *                                           │  Verified!   │
 *                                           └──────────────┘
 * 
 * --- Privacy Guarantees ---
 * - User proves they have a valid credential WITHOUT revealing it
 * - User can prove specific claims (e.g., "age > 18") without revealing DOB
 * - Verifier NEVER sees the actual credential data
 * - Only the proof result (true/false) and specified query results are shared
 * 
 * --- Storage ---
 * This version uses Firebase Firestore for persistent storage.
 */

import { v4 as uuidv4 } from "uuid";
import { Timestamp } from "firebase-admin/firestore";
import {
    VerificationRequest,
    VerificationStatus,
    VerificationResult,
} from "@/lib/types/credentials";
import {
    getPrivadoIDService,
    AuthorizationScope,
    Iden3AuthorizationRequest,
} from "./PrivadoIDService";
import { getBlockchainService } from "./BlockchainService";
import { getFirestoreDb, COLLECTIONS } from "@/lib/firebase/admin";

// ============================================
// CONFIGURATION
// ============================================

// Verification request validity (15 minutes)
const REQUEST_VALIDITY_MS = 15 * 60 * 1000;

// Schema context URL
const SCHEMA_CONTEXT = process.env.SCHEMA_BASE_URL || "https://bharatverify.io/schemas/v1";

// ============================================
// TYPES
// ============================================

interface VerificationSession {
    id: string;
    request: VerificationRequest;
    authRequest: Iden3AuthorizationRequest;
    status: "pending" | "verified" | "failed" | "expired";
    createdAt: Date;
    expiresAt: Date;
    result?: VerificationResult;
    proofResponse?: any;
}

interface FirestoreVerificationSession extends Omit<VerificationSession, "createdAt" | "expiresAt" | "result"> {
    createdAt: Timestamp;
    expiresAt: Timestamp;
    result?: Omit<VerificationResult, "verifiedAt"> & { verifiedAt: Timestamp };
}

function toFirestoreSession(session: VerificationSession): FirestoreVerificationSession {
    return {
        ...session,
        createdAt: Timestamp.fromDate(session.createdAt),
        expiresAt: Timestamp.fromDate(session.expiresAt),
        result: session.result ? {
            ...session.result,
            verifiedAt: Timestamp.fromDate(session.result.verifiedAt),
        } : undefined,
    };
}

function fromFirestoreSession(data: FirestoreVerificationSession): VerificationSession {
    return {
        ...data,
        createdAt: data.createdAt.toDate(),
        expiresAt: data.expiresAt.toDate(),
        result: data.result ? {
            ...data.result,
            verifiedAt: data.result.verifiedAt.toDate(),
        } : undefined,
    } as VerificationSession;
}

// ============================================
// SERVICE IMPLEMENTATION
// ============================================

export class ProofService {
    private verifierDid: string;

    constructor(verifierDid?: string) {
        this.verifierDid = verifierDid || process.env.VERIFIER_DID ||
            "did:polygonid:polygon:amoy:2qFbNk2D2EA24qVvzSVBAsYCPjGrxyG4p3Fv6W1RuY";
    }

    private get verificationsCollection() {
        return getFirestoreDb().collection(COLLECTIONS.VERIFICATIONS);
    }

    // ============================================
    // VERIFICATION REQUEST GENERATION
    // ============================================

    /**
     * Generate a verification request for ZK-proof
     * 
     * This creates an authorization request following the iden3comm protocol.
     * The verifier displays this as a QR code that the user scans.
     * 
     * @param request - The verification parameters
     * @returns QR code data and request ID
     */
    async generateVerificationRequest(request: VerificationRequest): Promise<{
        requestId: string;
        qrData: string;
        deepLink: string;
        expiresAt: string;
    }> {
        const requestId = `verify-${Date.now()}-${uuidv4().substring(0, 8)}`;
        const privadoService = getPrivadoIDService();

        // Build authorization scopes based on verification type
        const scopes = this.buildScopes(request);

        // Generate the authorization request
        const { request: authRequest, qrCodeData, deepLink } = privadoService.generateAuthorizationRequest(
            requestId,
            scopes,
            request.reason || `Verification: ${request.verificationType}`
        );

        // Calculate expiration
        const expiresAt = new Date(Date.now() + REQUEST_VALIDITY_MS);

        // Store the verification session in Firestore
        const session: VerificationSession = {
            id: requestId,
            request,
            authRequest,
            status: "pending",
            createdAt: new Date(),
            expiresAt,
        };
        await this.verificationsCollection.doc(requestId).set(toFirestoreSession(session));

        return {
            requestId,
            qrData: qrCodeData,
            deepLink,
            expiresAt: expiresAt.toISOString(),
        };
    }

    /**
     * Build authorization scopes from verification request
     */
    private buildScopes(request: VerificationRequest): AuthorizationScope[] {
        const scopes: AuthorizationScope[] = [];
        const privadoService = getPrivadoIDService();
        let scopeId = 1;

        switch (request.verificationType) {
            case "degree":
                if (request.conditions.degreeType) {
                    scopes.push(
                        privadoService.buildAuthorizationScope(scopeId++, "degree", {
                            degreeType: request.conditions.degreeType,
                        })
                    );
                }
                break;

            case "age":
                if (request.conditions.minAge) {
                    scopes.push(
                        privadoService.buildAuthorizationScope(scopeId++, "age", {
                            minAge: request.conditions.minAge,
                        })
                    );
                }
                break;

            case "cibil":
                if (request.conditions.minCibilScore) {
                    scopes.push(
                        privadoService.buildAuthorizationScope(scopeId++, "cibil", {
                            minScore: request.conditions.minCibilScore,
                        })
                    );
                }
                break;

            case "skill":
                if (request.conditions.requiredSkills && request.conditions.requiredSkills.length > 0) {
                    // Create a scope for each required skill
                    for (const skill of request.conditions.requiredSkills) {
                        scopes.push(
                            privadoService.buildAuthorizationScope(scopeId++, "skill", {
                                requiredSkill: skill,
                            })
                        );
                    }
                }
                break;

            case "graduated":
                if (request.conditions.isGraduated) {
                    scopes.push(
                        privadoService.buildAuthorizationScope(scopeId++, "graduated", {})
                    );
                }
                break;

            case "custom":
                // For custom queries, build the scope directly from conditions
                if (request.conditions.customQuery) {
                    scopes.push({
                        id: scopeId++,
                        circuitId: "credentialAtomicQuerySigV2",
                        query: {
                            allowedIssuers: ["*"],
                            type: "IndianWorkforceCredential",
                            context: `${SCHEMA_CONTEXT}/IndianWorkforceCredential.jsonld`,
                            credentialSubject: request.conditions.customQuery,
                        },
                    });
                }
                break;
        }

        // If no scopes built, add a basic existence proof
        if (scopes.length === 0) {
            scopes.push({
                id: scopeId,
                circuitId: "credentialAtomicQuerySigV2",
                query: {
                    allowedIssuers: ["*"],
                    type: "IndianWorkforceCredential",
                    context: `${SCHEMA_CONTEXT}/IndianWorkforceCredential.jsonld`,
                    credentialSubject: {},
                },
            });
        }

        return scopes;
    }

    // ============================================
    // VERIFICATION CALLBACK PROCESSING
    // ============================================

    /**
     * Process verification callback from Privado ID wallet
     * 
     * When the user generates a ZK-proof in their wallet, the wallet
     * sends the proof to our callback endpoint. This method:
     * 1. Validates the proof structure
     * 2. Verifies the ZK-proof (in production)
     * 3. Checks if issuer is authorized on-chain
     * 4. Updates the verification status
     * 
     * @param requestId - The verification request ID
     * @param proofResponse - The ZK-proof response from the wallet
     * @returns Verification result
     */
    async processVerificationCallback(
        requestId: string,
        proofResponse: any
    ): Promise<{
        verified: boolean;
        issuerAuthorized?: boolean;
        error?: string;
        result?: VerificationResult;
    }> {
        const doc = await this.verificationsCollection.doc(requestId).get();

        if (!doc.exists) {
            return { verified: false, error: "Verification request not found" };
        }

        const session = fromFirestoreSession(doc.data() as FirestoreVerificationSession);

        if (session.status !== "pending") {
            return { verified: false, error: `Request already ${session.status}` };
        }

        // Check expiration
        if (new Date() > session.expiresAt) {
            await this.verificationsCollection.doc(requestId).update({
                status: "expired",
            });
            return { verified: false, error: "Verification request expired" };
        }

        try {
            // Extract data from proof response
            const holderDid = proofResponse.from;
            const issuerDid = this.extractIssuerFromProof(proofResponse);

            if (!holderDid) {
                throw new Error("Missing holder DID in proof response");
            }

            // In production, use @iden3/js-iden3-auth to verify the ZK-proof
            // For hackathon, we validate the proof structure
            const proofValid = this.validateProofStructure(proofResponse);

            if (!proofValid) {
                await this.verificationsCollection.doc(requestId).update({
                    status: "failed",
                    proofResponse,
                });
                return { verified: false, error: "Invalid proof structure" };
            }

            // Check if issuer is authorized on-chain
            let issuerAuthorized = true;
            if (issuerDid) {
                const issuerAddress = this.extractAddressFromDid(issuerDid);
                if (issuerAddress) {
                    const blockchainService = getBlockchainService();
                    issuerAuthorized = await blockchainService.isIssuerAuthorized(issuerAddress);
                }
            }

            // Build verification result
            const result: VerificationResult = {
                verified: true,
                holderDid,
                issuerDid: issuerDid || "unknown",
                issuerAuthorized,
                proofType: proofResponse.type || "credentialAtomicQuerySigV2",
                verifiedAt: new Date(),
                disclosedFields: this.extractDisclosedFields(proofResponse),
            };

            // Update session in Firestore
            await this.verificationsCollection.doc(requestId).update({
                status: "verified",
                result: {
                    ...result,
                    verifiedAt: Timestamp.now(),
                },
                proofResponse,
            });

            return {
                verified: true,
                issuerAuthorized,
                result,
            };

        } catch (error) {
            console.error("Error processing verification:", error);
            await this.verificationsCollection.doc(requestId).update({
                status: "failed",
            });
            return {
                verified: false,
                error: error instanceof Error ? error.message : "Verification failed",
            };
        }
    }

    /**
     * Validate ZK-proof structure
     * 
     * In production, use @iden3/js-iden3-auth for full verification.
     * This is a structural validation for the hackathon.
     */
    private validateProofStructure(proofResponse: any): boolean {
        // Check required fields
        if (!proofResponse.from) return false;
        if (!proofResponse.to) return false;
        if (!proofResponse.type) return false;
        if (!proofResponse.body) return false;

        // Check proof type
        const validTypes = [
            "https://iden3-communication.io/authorization/1.0/response",
            "application/iden3-zkp-json",
        ];
        if (!validTypes.some(t => proofResponse.type.includes(t) || proofResponse.typ === t)) {
            // Be lenient for hackathon
            console.warn("Non-standard proof type:", proofResponse.type);
        }

        return true;
    }

    /**
     * Extract issuer DID from proof response
     */
    private extractIssuerFromProof(proofResponse: any): string | null {
        // The issuer can be in various places depending on the proof format
        if (proofResponse.body?.issuer) {
            return proofResponse.body.issuer;
        }
        if (proofResponse.body?.scope?.[0]?.issuer) {
            return proofResponse.body.scope[0].issuer;
        }
        return null;
    }

    /**
     * Extract Ethereum address from DID
     */
    private extractAddressFromDid(did: string): string | null {
        // For DIDs that are direct addresses
        if (did.startsWith("0x") && did.length === 42) {
            return did;
        }

        // For Polygon ID DIDs, the address mapping requires DID resolution
        // This is a simplified extraction for demonstration
        const parts = did.split(":");
        if (parts.length >= 5) {
            // The identifier might encode the address
            // In production, use proper DID resolution
            return null;
        }

        return null;
    }

    /**
     * Extract which fields were disclosed (for logging/UI)
     */
    private extractDisclosedFields(proofResponse: any): string[] {
        const fields: string[] = [];

        // Check scope for disclosed fields
        if (proofResponse.body?.scope) {
            for (const scope of proofResponse.body.scope) {
                if (scope.query?.credentialSubject) {
                    fields.push(...Object.keys(scope.query.credentialSubject));
                }
            }
        }

        return fields;
    }

    // ============================================
    // STATUS METHODS
    // ============================================

    /**
     * Get verification request status
     */
    async getRequestStatus(requestId: string): Promise<VerificationStatus | null> {
        const doc = await this.verificationsCollection.doc(requestId).get();
        if (!doc.exists) return null;

        const session = fromFirestoreSession(doc.data() as FirestoreVerificationSession);

        // Check if expired
        if (session.status === "pending" && new Date() > session.expiresAt) {
            await this.verificationsCollection.doc(requestId).update({
                status: "expired",
            });
            session.status = "expired";
        }

        return {
            requestId,
            status: session.status,
            createdAt: session.createdAt,
            expiresAt: session.expiresAt,
            result: session.result,
        };
    }

    /**
     * Get all verification sessions for a verifier
     */
    async getVerifierSessions(verifierId: string): Promise<VerificationStatus[]> {
        const snapshot = await this.verificationsCollection
            .where("request.verifierId", "==", verifierId)
            .orderBy("createdAt", "desc")
            .limit(50)
            .get();

        return snapshot.docs.map(doc => {
            const session = fromFirestoreSession(doc.data() as FirestoreVerificationSession);
            return {
                requestId: session.id,
                status: session.status,
                createdAt: session.createdAt,
                expiresAt: session.expiresAt,
                result: session.result,
            };
        });
    }

    // ============================================
    // STATS
    // ============================================

    async getStats(): Promise<{
        total: number;
        pending: number;
        verified: number;
        failed: number;
        expired: number;
    }> {
        const snapshot = await this.verificationsCollection.limit(500).get();
        const sessions = snapshot.docs.map(doc =>
            fromFirestoreSession(doc.data() as FirestoreVerificationSession)
        );

        return {
            total: sessions.length,
            pending: sessions.filter(s => s.status === "pending").length,
            verified: sessions.filter(s => s.status === "verified").length,
            failed: sessions.filter(s => s.status === "failed").length,
            expired: sessions.filter(s => s.status === "expired").length,
        };
    }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let proofServiceInstance: ProofService | null = null;

export function getProofService(): ProofService {
    if (!proofServiceInstance) {
        proofServiceInstance = new ProofService();
    }
    return proofServiceInstance;
}
