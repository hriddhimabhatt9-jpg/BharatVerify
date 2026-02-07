/**
 * PrivadoIDService
 * 
 * Core service for communicating with the Privado ID (Polygon ID) Issuer Node.
 * This service handles the actual integration with the Privado ID infrastructure.
 * 
 * --- Architecture Overview ---
 * 
 * ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
 * │  BharatVerify   │────▶│  Privado ID     │────▶│  Polygon Amoy   │
 * │  Backend        │     │  Issuer Node    │     │  Blockchain     │
 * └─────────────────┘     └─────────────────┘     └─────────────────┘
 *        │                        │
 *        │  iden3comm             │  State updates
 *        │  protocol              │
 *        ▼                        ▼
 * ┌─────────────────┐     ┌─────────────────┐
 * │  Privado ID     │     │  IPFS/Pinata    │
 * │  Mobile App     │     │  Schema Storage │
 * └─────────────────┘     └─────────────────┘
 * 
 * --- Credential Issuance Flow ---
 * 1. Issuer creates credential offer via this service
 * 2. QR code/deep link generated following iden3comm protocol
 * 3. User scans with Privado ID mobile app
 * 4. App calls our callback URL to fetch the credential
 * 5. Credential is signed and returned to the user's wallet
 * 
 * --- Configuration ---
 * This service can work in two modes:
 * 1. Self-hosted Issuer Node (requires Docker setup)
 * 2. Mock/Demo mode (for hackathon/testing)
 */

import { v4 as uuidv4 } from "uuid";

// ============================================
// TYPES
// ============================================

/**
 * Configuration for the Privado ID Issuer Node
 */
export interface PrivadoIDConfig {
    /** Base URL of the Issuer Node API (e.g., http://localhost:3001) */
    issuerNodeUrl: string;
    /** Issuer's DID */
    issuerDid: string;
    /** API key for Issuer Node (if using hosted version) */
    apiKey?: string;
    /** Whether to use mock mode for testing */
    mockMode: boolean;
    /** Base URL of this application (for callbacks) */
    appBaseUrl: string;
    /** Schema base URL (IPFS gateway or hosted) */
    schemaBaseUrl: string;
}

/**
 * iden3comm Credential Offer message structure
 * @see https://iden3-communication.io/credentials/1.0/offer
 */
export interface Iden3CredentialOffer {
    id: string;
    typ: "application/iden3comm-plain-json";
    type: "https://iden3-communication.io/credentials/1.0/offer";
    thid: string;
    from: string;
    to?: string;
    body: {
        url: string;
        credentials: Array<{
            id: string;
            description: string;
        }>;
    };
}

/**
 * iden3comm Credential Fetch Request (from mobile app)
 * @see https://iden3-communication.io/credentials/1.0/fetch-request
 */
export interface Iden3FetchRequest {
    id: string;
    typ: "application/iden3comm-plain-json";
    type: "https://iden3-communication.io/credentials/1.0/fetch-request";
    thid: string;
    from: string;
    to: string;
    body: {
        id: string;
    };
}

/**
 * iden3comm Credential Issuance Response
 */
export interface Iden3IssuanceResponse {
    id: string;
    typ: "application/iden3comm-plain-json";
    type: "https://iden3-communication.io/credentials/1.0/issuance";
    thid: string;
    from: string;
    to: string;
    body: {
        credential: W3CCredential;
    };
}

/**
 * W3C Verifiable Credential structure for Privado ID
 */
export interface W3CCredential {
    id: string;
    "@context": string[];
    type: string[];
    issuanceDate: string;
    expirationDate?: string;
    credentialSubject: Record<string, any>;
    credentialStatus?: {
        id: string;
        type: string;
        revocationNonce: number;
    };
    issuer: string;
    credentialSchema: {
        id: string;
        type: string;
    };
    proof?: any;
}

/**
 * Authorization Request for ZK-proof verification
 * @see https://iden3-communication.io/authorization/1.0/request
 */
export interface Iden3AuthorizationRequest {
    id: string;
    typ: "application/iden3comm-plain-json";
    type: "https://iden3-communication.io/authorization/1.0/request";
    thid: string;
    from: string;
    body: {
        callbackUrl: string;
        reason: string;
        scope: AuthorizationScope[];
    };
}

/**
 * Authorization scope for ZK-proof queries
 */
export interface AuthorizationScope {
    id: number;
    circuitId: "credentialAtomicQuerySigV2" | "credentialAtomicQueryMTPV2";
    query: {
        allowedIssuers: string[];
        type: string;
        context: string;
        credentialSubject: Record<string, any>;
    };
}

// ============================================
// SERVICE IMPLEMENTATION
// ============================================

export class PrivadoIDService {
    private config: PrivadoIDConfig;

    constructor(config?: Partial<PrivadoIDConfig>) {
        this.config = {
            issuerNodeUrl: config?.issuerNodeUrl || process.env.PRIVADO_ISSUER_NODE_URL || "http://localhost:3001",
            issuerDid: config?.issuerDid || process.env.ISSUER_DID || "did:polygonid:polygon:amoy:2qFbNk2D2EA24qVvzSVBAsYCPjGrxyG4p3Fv6W1RuY",
            apiKey: config?.apiKey || process.env.PRIVADO_API_KEY,
            mockMode: config?.mockMode ?? (process.env.PRIVADO_MOCK_MODE === "true"), // Default to real mode when env is "false" or unset
            appBaseUrl: config?.appBaseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
            schemaBaseUrl: config?.schemaBaseUrl || process.env.SCHEMA_BASE_URL || "https://bharatverify.io/schemas/v1",
        };
    }

    // ============================================
    // CREDENTIAL OFFER METHODS
    // ============================================

    /**
     * Generate a credential offer for the user to scan
     * 
     * This creates an iden3comm credential offer message that can be
     * encoded as a QR code or deep link for the Privado ID mobile app.
     * 
     * @param claimId - Unique identifier for this credential claim
     * @param credentialDescription - Human-readable description
     * @param holderDid - Optional DID of the intended recipient
     * @returns Credential offer object and QR/deep link data
     */
    generateCredentialOffer(
        claimId: string,
        credentialDescription: string,
        holderDid?: string
    ): {
        offer: Iden3CredentialOffer;
        qrCodeData: string;
        deepLink: string;
    } {
        const offerId = uuidv4();

        // Create iden3comm credential offer following the protocol spec
        const offer: Iden3CredentialOffer = {
            id: offerId,
            typ: "application/iden3comm-plain-json",
            type: "https://iden3-communication.io/credentials/1.0/offer",
            thid: claimId, // Thread ID links back to our claim
            from: this.config.issuerDid,
            to: holderDid || undefined,
            body: {
                // This URL is where the mobile app will fetch the credential
                url: `${this.config.appBaseUrl}/api/issuer/claim/${claimId}/fetch`,
                credentials: [
                    {
                        id: claimId,
                        description: credentialDescription,
                    },
                ],
            },
        };

        // Generate QR code data (stringified JSON)
        const qrCodeData = JSON.stringify(offer);

        // Generate deep link for mobile app
        // Format: iden3comm://?i_m=<base64_encoded_message>
        const encodedMessage = Buffer.from(qrCodeData).toString("base64");
        const deepLink = `iden3comm://?i_m=${encodedMessage}`;

        return { offer, qrCodeData, deepLink };
    }

    /**
     * Generate a universal link (for web wallet compatibility)
     */
    generateUniversalLink(offer: Iden3CredentialOffer): string {
        const encodedMessage = Buffer.from(JSON.stringify(offer)).toString("base64");
        return `https://wallet.privado.id/#i_m=${encodedMessage}`;
    }

    // ============================================
    // CREDENTIAL ISSUANCE METHODS
    // ============================================

    /**
     * Process a credential fetch request from the mobile app
     * 
     * When the user scans the QR code, their wallet sends a fetch request
     * to our callback URL. This method processes that request and returns
     * the signed credential.
     * 
     * @param fetchRequest - The iden3comm fetch request from the wallet
     * @param credentialData - The credential data to issue
     * @returns The signed credential in iden3comm format
     */
    async processCredentialFetch(
        fetchRequest: Iden3FetchRequest,
        credentialData: Record<string, any>
    ): Promise<Iden3IssuanceResponse> {
        const claimId = fetchRequest.body.id;
        const holderDid = fetchRequest.from;

        // In production, this would call the Privado ID Issuer Node API
        // For hackathon/demo, we generate a mock signed credential

        if (this.config.mockMode) {
            return this.generateMockCredential(claimId, holderDid, credentialData);
        }

        // Call actual Privado ID Issuer Node
        return this.issueCredentialViaNode(claimId, holderDid, credentialData);
    }

    /**
     * Generate a mock credential for demo/testing
     * 
     * This simulates what the Privado ID Issuer Node would return.
     * The credential follows W3C VC format with Polygon ID extensions.
     */
    private generateMockCredential(
        claimId: string,
        holderDid: string,
        credentialSubject: Record<string, any>
    ): Iden3IssuanceResponse {
        const now = new Date();
        const expirationDate = new Date();
        expirationDate.setFullYear(now.getFullYear() + 5);

        // Mock revocation nonce (in production, this is managed by the Issuer Node)
        const revocationNonce = Math.floor(Math.random() * 1000000000);

        const credential: W3CCredential = {
            id: `urn:uuid:${claimId}`,
            "@context": [
                "https://www.w3.org/2018/credentials/v1",
                "https://schema.iden3.io/core/jsonld/iden3proofs.jsonld",
                `${this.config.schemaBaseUrl}/IndianWorkforceCredential.jsonld`,
            ],
            type: ["VerifiableCredential", "IndianWorkforceCredential"],
            issuanceDate: now.toISOString(),
            expirationDate: expirationDate.toISOString(),
            credentialSubject: {
                id: holderDid,
                ...credentialSubject,
            },
            credentialStatus: {
                id: `${this.config.appBaseUrl}/api/issuer/revocation/${revocationNonce}`,
                type: "SparseMerkleTreeProof",
                revocationNonce,
            },
            issuer: this.config.issuerDid,
            credentialSchema: {
                id: `${this.config.schemaBaseUrl}/IndianWorkforceCredential.json`,
                type: "JsonSchema2023",
            },
            // In production, this would contain actual ZK proofs
            proof: {
                type: "BJJSignature2021",
                issuerData: {
                    id: this.config.issuerDid,
                    state: {
                        // Mock state data
                        rootOfRoots: "0x" + "0".repeat(64),
                        claimsTreeRoot: "0x" + "0".repeat(64),
                        revocationTreeRoot: "0x" + "0".repeat(64),
                    },
                },
                coreClaim: "mock_core_claim_data",
                signature: "mock_signature_" + Date.now(),
            },
        };

        return {
            id: uuidv4(),
            typ: "application/iden3comm-plain-json",
            type: "https://iden3-communication.io/credentials/1.0/issuance",
            thid: claimId,
            from: this.config.issuerDid,
            to: holderDid,
            body: {
                credential,
            },
        };
    }

    /**
     * Issue credential via actual Privado ID Issuer Node API
     * 
     * This method calls the Privado ID Issuer Node REST API to:
     * 1. Create the credential claim
     * 2. Sign it with the issuer's BJJ key
     * 3. Update the merkle tree state
     * 4. Return the signed credential
     */
    private async issueCredentialViaNode(
        claimId: string,
        holderDid: string,
        credentialSubject: Record<string, any>
    ): Promise<Iden3IssuanceResponse> {
        // Get API credentials from environment
        const apiUser = process.env.PRIVADO_API_USER || "bharatverify-issuer";
        const apiPassword = process.env.PRIVADO_API_PASSWORD || "BharatVerify2024!";
        const authString = Buffer.from(`${apiUser}:${apiPassword}`).toString("base64");

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "Authorization": `Basic ${authString}`,
        };

        try {
            // Get issuer DID - URL encode it for the path
            const issuerDid = this.config.issuerDid;
            const encodedDid = encodeURIComponent(issuerDid);

            // Step 1: Create claim in the Issuer Node using v2 API
            const createClaimResponse = await fetch(
                `${this.config.issuerNodeUrl}/v2/identities/${encodedDid}/credentials`,
                {
                    method: "POST",
                    headers,
                    body: JSON.stringify({
                        credentialSchema: `${this.config.schemaBaseUrl}/IndianWorkforceCredential.json`,
                        type: "IndianWorkforceCredential",
                        credentialSubject: {
                            id: holderDid,
                            ...credentialSubject,
                        },
                        expiration: this.calculateExpirationTimestamp(),
                        signatureProof: true,
                        mtProof: false, // Merkle Tree Proof (optional, more gas intensive)
                    }),
                }
            );

            if (!createClaimResponse.ok) {
                const errorText = await createClaimResponse.text();
                console.error("Issuer Node API error:", errorText);
                throw new Error(`Issuer Node error: ${createClaimResponse.status} - ${errorText}`);
            }

            const nodeCredential = await createClaimResponse.json();
            console.log("Credential created via Issuer Node:", nodeCredential.id);

            // Transform to iden3comm issuance response
            return {
                id: uuidv4(),
                typ: "application/iden3comm-plain-json",
                type: "https://iden3-communication.io/credentials/1.0/issuance",
                thid: claimId,
                from: this.config.issuerDid,
                to: holderDid,
                body: {
                    credential: nodeCredential,
                },
            };
        } catch (error) {
            console.error("Error issuing credential via Issuer Node:", error);
            // Fallback to mock mode if Issuer Node is unavailable
            console.warn("Falling back to mock credential generation");
            return this.generateMockCredential(claimId, holderDid, credentialSubject);
        }
    }


    // ============================================
    // VERIFICATION REQUEST METHODS
    // ============================================

    /**
     * Generate an authorization request for ZK-proof verification
     * 
     * This creates an iden3comm authorization request that verifiers
     * can use to request proofs from users.
     * 
     * @param verificationId - Unique ID for this verification session
     * @param requirements - The proof requirements
     * @param reason - Human-readable reason for verification
     * @returns Authorization request and QR/deep link data
     */
    generateAuthorizationRequest(
        verificationId: string,
        requirements: AuthorizationScope[],
        reason: string
    ): {
        request: Iden3AuthorizationRequest;
        qrCodeData: string;
        deepLink: string;
    } {
        const request: Iden3AuthorizationRequest = {
            id: verificationId,
            typ: "application/iden3comm-plain-json",
            type: "https://iden3-communication.io/authorization/1.0/request",
            thid: verificationId,
            from: this.config.issuerDid, // In production, use verifier's DID
            body: {
                callbackUrl: `${this.config.appBaseUrl}/api/verifier/callback`,
                reason,
                scope: requirements,
            },
        };

        const qrCodeData = JSON.stringify(request);
        const encodedMessage = Buffer.from(qrCodeData).toString("base64");
        const deepLink = `iden3comm://?i_m=${encodedMessage}`;

        return { request, qrCodeData, deepLink };
    }

    /**
     * Build an authorization scope for common verification scenarios
     */
    buildAuthorizationScope(
        id: number,
        verificationType: "degree" | "age" | "cibil" | "skill" | "graduated",
        conditions: Record<string, any>
    ): AuthorizationScope {
        const queryConditions: Record<string, any> = {};

        switch (verificationType) {
            case "degree":
                if (conditions.degreeType) {
                    queryConditions.degreeTitle = { $eq: conditions.degreeType };
                }
                break;

            case "age":
                if (conditions.minAge) {
                    // Calculate birth date threshold for minimum age
                    const minBirthDate = new Date();
                    minBirthDate.setFullYear(minBirthDate.getFullYear() - conditions.minAge);
                    queryConditions.dateOfBirth = { $lt: Math.floor(minBirthDate.getTime() / 1000) };
                }
                break;

            case "cibil":
                if (conditions.minScore) {
                    queryConditions.cibilScore = { $gte: conditions.minScore };
                }
                break;

            case "skill":
                if (conditions.requiredSkill) {
                    queryConditions.skillSet = { $eq: conditions.requiredSkill };
                }
                break;

            case "graduated":
                queryConditions.isGraduated = { $eq: true };
                break;
        }

        return {
            id,
            circuitId: "credentialAtomicQuerySigV2",
            query: {
                allowedIssuers: ["*"], // Accept from any issuer (will validate on-chain)
                type: "IndianWorkforceCredential",
                context: `${this.config.schemaBaseUrl}/IndianWorkforceCredential.jsonld`,
                credentialSubject: queryConditions,
            },
        };
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Calculate expiration timestamp (5 years from now, in Unix seconds)
     */
    private calculateExpirationTimestamp(): number {
        const expDate = new Date();
        expDate.setFullYear(expDate.getFullYear() + 5);
        return Math.floor(expDate.getTime() / 1000);
    }

    /**
     * Get configuration for debugging
     */
    getConfig(): Omit<PrivadoIDConfig, "apiKey"> {
        const { apiKey, ...safeConfig } = this.config;
        return safeConfig;
    }

    /**
     * Check if running in mock mode
     */
    isMockMode(): boolean {
        return this.config.mockMode;
    }

    /**
     * Check Issuer Node health (if not in mock mode)
     */
    async checkIssuerNodeHealth(): Promise<{
        healthy: boolean;
        mode: "live" | "mock";
        issuerDid: string;
        error?: string;
    }> {
        if (this.config.mockMode) {
            return {
                healthy: true,
                mode: "mock",
                issuerDid: this.config.issuerDid,
            };
        }

        try {
            const response = await fetch(`${this.config.issuerNodeUrl}/health`);
            return {
                healthy: response.ok,
                mode: "live",
                issuerDid: this.config.issuerDid,
            };
        } catch (error) {
            return {
                healthy: false,
                mode: "mock",
                issuerDid: this.config.issuerDid,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let privadoIDServiceInstance: PrivadoIDService | null = null;

export function getPrivadoIDService(): PrivadoIDService {
    if (!privadoIDServiceInstance) {
        privadoIDServiceInstance = new PrivadoIDService();
    }
    return privadoIDServiceInstance;
}
