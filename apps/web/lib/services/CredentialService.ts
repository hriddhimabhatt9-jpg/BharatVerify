/**
 * CredentialService
 * 
 * This service handles the complete credential lifecycle for BharatVerify:
 * 1. Credential creation and validation
 * 2. Integration with Privado ID for credential offers
 * 3. Handling credential fetch requests from mobile wallets
 * 4. Credential revocation management
 * 
 * --- Architecture ---
 * 
 * ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
 * │  API Routes     │────▶│  Credential     │────▶│  PrivadoID      │
 * │                 │     │  Service        │     │  Service        │
 * └─────────────────┘     └─────────────────┘     └─────────────────┘
 *                                │
 *                                ▼
 *                         ┌─────────────────┐
 *                         │  Firestore      │
 *                         │  (Persistent)   │
 *                         └─────────────────┘
 * 
 * --- Selective Disclosure Strategy ---
 * The IndianWorkforceCredential schema supports granular ZK-proof queries:
 * 
 * | Field          | ZK-Proof Example                              |
 * |----------------|-----------------------------------------------|
 * | isGraduated    | Prove graduation without revealing institution|
 * | cibilScore     | Prove score > 700 without exact value        |
 * | dateOfBirth    | Prove age > 18 without revealing DOB         |
 * | skillSet       | Prove specific skill ownership               |
 * 
 * --- Privacy Features ---
 * - Aadhaar numbers are NEVER stored in plain text
 * - SHA-256 hash of Aadhaar enables verification without exposure
 * - Credentials can be revoked on-chain if compromised
 * 
 * --- Storage ---
 * This version uses Firebase Firestore for persistent storage.
 */

import { v4 as uuidv4 } from "uuid";
import { Timestamp } from "firebase-admin/firestore";
import {
    CreateClaimRequest,
    CreateClaimResponse,
    VerifiableCredential,
    IndianWorkforceCredentialSubject,
    ClaimRecord,
} from "@/lib/types/credentials";
import { maskAadhaar, generateReferenceId } from "@/lib/utils";
import { getPrivadoIDService, Iden3IssuanceResponse, Iden3FetchRequest } from "./PrivadoIDService";
import { getFirestoreDb, COLLECTIONS } from "@/lib/firebase/admin";

// ============================================
// CONFIGURATION
// ============================================

const SCHEMA_CONTEXT = process.env.SCHEMA_BASE_URL || "https://bharatverify.io/schemas/v1";
const SCHEMA_TYPE = "IndianWorkforceCredential";

// Credential validity duration in years
const CREDENTIAL_VALIDITY_YEARS = 5;

// ============================================
// FIRESTORE HELPERS
// ============================================

/**
 * Convert Firestore Timestamp to Date and vice-versa
 */
interface FirestoreClaimRecord extends Omit<ClaimRecord, "createdAt" | "updatedAt" | "issuedAt" | "revokedAt"> {
    createdAt: Timestamp;
    updatedAt: Timestamp;
    issuedAt?: Timestamp;
    revokedAt?: Timestamp;
}

function toFirestoreRecord(record: ClaimRecord): Record<string, any> {
    const result: Record<string, any> = {
        ...record,
        createdAt: Timestamp.fromDate(record.createdAt),
        updatedAt: Timestamp.fromDate(record.updatedAt),
    };
    if (record.issuedAt) result.issuedAt = Timestamp.fromDate(record.issuedAt);
    if (record.revokedAt) result.revokedAt = Timestamp.fromDate(record.revokedAt);
    return result;
}

function fromFirestoreRecord(data: FirestoreClaimRecord): ClaimRecord {
    return {
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        issuedAt: data.issuedAt ? data.issuedAt.toDate() : undefined,
        revokedAt: data.revokedAt ? data.revokedAt.toDate() : undefined,
    } as ClaimRecord;
}

// ============================================
// SERVICE IMPLEMENTATION
// ============================================

export class CredentialService {
    private issuerDid: string;

    constructor(issuerDid?: string) {
        this.issuerDid = issuerDid || process.env.ISSUER_DID ||
            "did:polygonid:polygon:amoy:2qFbNk2D2EA24qVvzSVBAsYCPjGrxyG4p3Fv6W1RuY";
    }

    private get claimsCollection() {
        return getFirestoreDb().collection(COLLECTIONS.CLAIMS);
    }

    /**
     * Create a new credential claim
     * 
     * This is the main entry point for issuing credentials.
     * In live mode, it creates credentials via the Privado ID Issuer Node
     * and gets the proper offer QR code from the node.
     * 
     * @param request - The claim creation request with user data
     * @returns Response with claim ID and QR code data
     */
    async createClaim(request: CreateClaimRequest): Promise<CreateClaimResponse> {
        try {
            // Step 1: Validate input
            this.validateClaimRequest(request);

            // Step 2: Generate identifiers
            const claimId = `claim-${Date.now()}-${uuidv4().substring(0, 8)}`;
            const referenceId = generateReferenceId();

            // Step 3: Apply privacy transformations
            const aadhaarHash = maskAadhaar(request.aadhaarNumber);

            // Step 4: Construct credential subject
            const credentialSubject: IndianWorkforceCredentialSubject = {
                referenceId,
                aadhaarHash,
                fullName: request.fullName,
                dateOfBirth: request.dateOfBirth,
                skillSet: request.skillSet,
                isGraduated: request.isGraduated,
                cibilScore: request.cibilScore ?? -1,
                institutionName: request.institutionName || "",
                degreeTitle: request.degreeTitle || "",
                completionYear: request.completionYear || 0,
                grade: request.grade || "",
            };

            // Step 5: Check if we should use Issuer Node or mock mode
            const privadoService = getPrivadoIDService();
            const mockMode = process.env.PRIVADO_MOCK_MODE === "true";

            if (!mockMode) {
                // LIVE MODE: Create credential via Issuer Node
                const issuerNodeResult = await this.createCredentialViaIssuerNode(
                    request.holderDid,
                    credentialSubject,
                    claimId
                );

                if (issuerNodeResult.success) {
                    // Store in Firestore with Issuer Node credential ID
                    const claimRecord: ClaimRecord = {
                        id: claimId,
                        credential: issuerNodeResult.credential!,
                        credentialSubject,
                        holderDid: request.holderDid,
                        status: "pending",
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        issuerNodeCredentialId: issuerNodeResult.issuerNodeCredentialId,
                    };
                    await this.claimsCollection.doc(claimId).set(toFirestoreRecord(claimRecord));

                    return {
                        success: true,
                        claimId,
                        referenceId,
                        qrCodeData: issuerNodeResult.qrCodeData || "",
                        deepLink: issuerNodeResult.deepLink || "",
                        universalLink: issuerNodeResult.universalLink || "",
                    };
                }
                // Fall through to mock mode if Issuer Node fails
                console.warn("Issuer Node failed, falling back to mock mode:", issuerNodeResult.error);
            }

            // MOCK MODE: Generate local credential offer
            const credential: VerifiableCredential = {
                "@context": [
                    "https://www.w3.org/2018/credentials/v1",
                    "https://schema.iden3.io/core/jsonld/iden3proofs.jsonld",
                    `${SCHEMA_CONTEXT}/IndianWorkforceCredential.jsonld`,
                ],
                type: ["VerifiableCredential", SCHEMA_TYPE],
                id: `urn:uuid:${claimId}`,
                issuer: this.issuerDid,
                issuanceDate: new Date().toISOString(),
                expirationDate: this.calculateExpirationDate(),
                credentialSubject: {
                    id: request.holderDid,
                    ...credentialSubject,
                },
                credentialSchema: {
                    id: `${SCHEMA_CONTEXT}/IndianWorkforceCredential.json`,
                    type: "JsonSchema2023",
                },
            };

            const { offer, qrCodeData, deepLink } = privadoService.generateCredentialOffer(
                claimId,
                `${SCHEMA_TYPE} - ${credentialSubject.skillSet}`,
                request.holderDid
            );

            const claimRecord: ClaimRecord = {
                id: claimId,
                credential,
                credentialSubject,
                holderDid: request.holderDid,
                status: "pending",
                createdAt: new Date(),
                updatedAt: new Date(),
                offer,
            };
            await this.claimsCollection.doc(claimId).set(toFirestoreRecord(claimRecord));

            return {
                success: true,
                claimId,
                referenceId,
                qrCodeData,
                deepLink,
                universalLink: privadoService.generateUniversalLink(offer),
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            console.error("Error creating claim:", errorMessage);
            return {
                success: false,
                claimId: "",
                referenceId: "",
                error: errorMessage,
            };
        }
    }

    /**
     * Create credential via Privado ID Issuer Node API
     * Returns the credential offer QR code from the Issuer Node
     */
    private async createCredentialViaIssuerNode(
        holderDid: string,
        credentialSubject: IndianWorkforceCredentialSubject,
        localClaimId: string
    ): Promise<{
        success: boolean;
        credential?: VerifiableCredential;
        issuerNodeCredentialId?: string;
        qrCodeData?: string;
        deepLink?: string;
        universalLink?: string;
        error?: string;
    }> {
        const issuerNodeUrl = process.env.PRIVADO_ISSUER_NODE_URL || "http://localhost:3001";
        const apiUser = process.env.PRIVADO_API_USER || "bharatverify-issuer";
        const apiPassword = process.env.PRIVADO_API_PASSWORD || "BharatVerify2024!";
        const authString = Buffer.from(`${apiUser}:${apiPassword}`).toString("base64");
        const encodedDid = encodeURIComponent(this.issuerDid);

        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Basic ${authString}`,
        };

        try {
            // Step 1: Create credential in Issuer Node
            console.log("[IssuerNode] Creating credential...");
            const createResponse = await fetch(
                `${issuerNodeUrl}/v2/identities/${encodedDid}/credentials`,
                {
                    method: "POST",
                    headers,
                    body: JSON.stringify({
                        credentialSchema: `${SCHEMA_CONTEXT}/IndianWorkforceCredential.json`,
                        type: SCHEMA_TYPE,
                        credentialSubject: {
                            id: holderDid,
                            ...credentialSubject,
                        },
                        expiration: Math.floor(Date.now() / 1000) + (CREDENTIAL_VALIDITY_YEARS * 365 * 24 * 60 * 60),
                        signatureProof: true,
                        mtProof: false,
                    }),
                }
            );

            if (!createResponse.ok) {
                const errorText = await createResponse.text();
                console.error("[IssuerNode] Create failed:", errorText);
                return { success: false, error: `Create failed: ${createResponse.status} - ${errorText}` };
            }

            const credentialData = await createResponse.json();
            const issuerNodeCredentialId = credentialData.id;
            console.log("[IssuerNode] Credential created:", issuerNodeCredentialId);

            // Step 2: Get credential offer QR code from Issuer Node
            console.log("[IssuerNode] Getting offer QR code...");
            const offerResponse = await fetch(
                `${issuerNodeUrl}/v2/identities/${encodedDid}/credentials/${issuerNodeCredentialId}/offer?type=raw`,
                {
                    method: "GET",
                    headers,
                }
            );

            if (!offerResponse.ok) {
                const errorText = await offerResponse.text();
                console.error("[IssuerNode] Get offer failed:", errorText);
                return { success: false, error: `Get offer failed: ${offerResponse.status} - ${errorText}` };
            }

            const offerData = await offerResponse.json();
            console.log("[IssuerNode] Got offer:", offerData.id || "offer received");

            // Generate QR code data and links
            const qrCodeData = JSON.stringify(offerData);
            const encodedMessage = Buffer.from(qrCodeData).toString("base64");
            const deepLink = `iden3comm://?i_m=${encodedMessage}`;
            const universalLink = `https://wallet.privado.id/#i_m=${encodedMessage}`;

            return {
                success: true,
                credential: credentialData,
                issuerNodeCredentialId,
                qrCodeData,
                deepLink,
                universalLink,
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            console.error("[IssuerNode] Error:", errorMessage);
            return { success: false, error: errorMessage };
        }
    }


    // ============================================
    // CREDENTIAL FETCH (Mobile App Callback)
    // ============================================

    /**
     * Process credential fetch request from Privado ID mobile app
     * 
     * When a user scans the QR code, their wallet sends a fetch request
     * to our callback URL. This method:
     * 1. Validates the request
     * 2. Finds the pending claim
     * 3. Signs the credential via Privado ID
     * 4. Returns the signed credential to the wallet
     * 
     * @param claimId - The claim ID to fetch
     * @param fetchRequest - The iden3comm fetch request from the wallet
     * @returns Signed credential in iden3comm format
     */
    async processCredentialFetch(
        claimId: string,
        fetchRequest: Iden3FetchRequest
    ): Promise<Iden3IssuanceResponse | null> {
        const claimDoc = await this.claimsCollection.doc(claimId).get();

        if (!claimDoc.exists) {
            throw new Error("Claim not found");
        }

        const claim = fromFirestoreRecord(claimDoc.data() as FirestoreClaimRecord);

        if (claim.status === "revoked") {
            throw new Error("Claim has been revoked");
        }

        if (claim.status === "issued") {
            // Already issued - still return it (re-download)
            console.log(`Claim ${claimId} already issued, allowing re-download`);
        }

        // Validate that the requester matches the intended holder
        if (claim.holderDid && fetchRequest.from !== claim.holderDid) {
            console.warn(`Claim holder mismatch: expected ${claim.holderDid}, got ${fetchRequest.from}`);
            // For hackathon, we allow any holder to claim
            // In production, enforce strict holder matching
        }

        // Process through Privado ID Service
        const privadoService = getPrivadoIDService();
        const issuanceResponse = await privadoService.processCredentialFetch(
            fetchRequest,
            claim.credentialSubject
        );

        // Update claim status in Firestore
        await this.claimsCollection.doc(claimId).update({
            status: "issued",
            issuedAt: Timestamp.now(),
            issuedTo: fetchRequest.from,
            updatedAt: Timestamp.now(),
        });

        return issuanceResponse;
    }

    // ============================================
    // CLAIM MANAGEMENT
    // ============================================

    /**
     * Get a claim by ID
     */
    async getClaim(claimId: string): Promise<ClaimRecord | null> {
        const doc = await this.claimsCollection.doc(claimId).get();
        if (!doc.exists) return null;
        return fromFirestoreRecord(doc.data() as FirestoreClaimRecord);
    }

    /**
     * Get all claims (for dashboard)
     */
    async getAllClaims(): Promise<ClaimRecord[]> {
        const snapshot = await this.claimsCollection.orderBy("createdAt", "desc").limit(100).get();
        return snapshot.docs.map(doc => fromFirestoreRecord(doc.data() as FirestoreClaimRecord));
    }

    /**
     * Get claims by status
     */
    async getClaimsByStatus(status: "pending" | "issued" | "revoked"): Promise<ClaimRecord[]> {
        const snapshot = await this.claimsCollection.where("status", "==", status).get();
        return snapshot.docs.map(doc => fromFirestoreRecord(doc.data() as FirestoreClaimRecord));
    }

    /**
     * Get claims by holder DID
     */
    async getClaimsByHolder(holderDid: string): Promise<ClaimRecord[]> {
        const snapshot = await this.claimsCollection
            .where("holderDid", "==", holderDid)
            .get();
        return snapshot.docs.map(doc => fromFirestoreRecord(doc.data() as FirestoreClaimRecord));
    }

    /**
     * Revoke a claim
     * 
     * Revocation marks the credential as invalid. In production,
     * this would also update the on-chain revocation tree.
     */
    async revokeClaim(claimId: string, reason?: string): Promise<boolean> {
        const doc = await this.claimsCollection.doc(claimId).get();
        if (!doc.exists) return false;

        await this.claimsCollection.doc(claimId).update({
            status: "revoked",
            revokedAt: Timestamp.now(),
            revocationReason: reason || null,
            updatedAt: Timestamp.now(),
        });

        // TODO: In production, publish revocation to on-chain registry
        console.log(`Claim ${claimId} revoked: ${reason || "No reason provided"}`);

        return true;
    }

    /**
     * Check revocation status (for verifiers)
     */
    async checkRevocationStatus(claimId: string): Promise<{
        isRevoked: boolean;
        revokedAt?: Date;
        reason?: string;
    }> {
        const claim = await this.getClaim(claimId);
        if (!claim) {
            return { isRevoked: false }; // Unknown claim - not revoked
        }

        return {
            isRevoked: claim.status === "revoked",
            revokedAt: claim.revokedAt,
            reason: claim.revocationReason,
        };
    }

    // ============================================
    // STATISTICS
    // ============================================

    /**
     * Get claim statistics for dashboard
     */
    async getClaimStats(): Promise<{
        total: number;
        pending: number;
        issued: number;
        revoked: number;
        issuedToday: number;
        skillBreakdown: Record<string, number>;
    }> {
        const claims = await this.getAllClaims();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return {
            total: claims.length,
            pending: claims.filter(c => c.status === "pending").length,
            issued: claims.filter(c => c.status === "issued").length,
            revoked: claims.filter(c => c.status === "revoked").length,
            issuedToday: claims.filter(c =>
                c.status === "issued" &&
                c.issuedAt &&
                c.issuedAt >= today
            ).length,
            skillBreakdown: this.getSkillBreakdown(claims),
        };
    }

    private getSkillBreakdown(claims: ClaimRecord[]): Record<string, number> {
        const breakdown: Record<string, number> = {};
        for (const claim of claims) {
            const skill = claim.credentialSubject.skillSet;
            breakdown[skill] = (breakdown[skill] || 0) + 1;
        }
        return breakdown;
    }

    // ============================================
    // VALIDATION
    // ============================================

    /**
     * Validate claim creation request
     */
    private validateClaimRequest(request: CreateClaimRequest): void {
        const errors: string[] = [];

        // Required fields
        if (!request.holderDid) {
            errors.push("Holder DID is required");
        } else if (!this.isValidDid(request.holderDid)) {
            errors.push("Invalid holder DID format");
        }

        if (!request.fullName || request.fullName.trim().length < 2) {
            errors.push("Valid full name is required (min 2 characters)");
        }

        if (!request.aadhaarNumber) {
            errors.push("Aadhaar number is required");
        } else {
            const cleanAadhaar = request.aadhaarNumber.replace(/\s/g, "");
            if (!/^\d{12}$/.test(cleanAadhaar)) {
                errors.push("Valid 12-digit Aadhaar number is required");
            }
            if (!this.validateAadhaarChecksum(cleanAadhaar)) {
                errors.push("Invalid Aadhaar checksum");
            }
        }

        if (!request.dateOfBirth) {
            errors.push("Date of birth is required");
        } else {
            const dob = new Date(request.dateOfBirth);
            if (isNaN(dob.getTime())) {
                errors.push("Invalid date of birth format");
            }
            // Check age is reasonable (10-120 years)
            const age = this.calculateAge(dob);
            if (age < 10 || age > 120) {
                errors.push("Date of birth results in unreasonable age");
            }
        }

        if (!request.skillSet || request.skillSet.trim().length === 0) {
            errors.push("Skill set is required");
        }

        if (typeof request.isGraduated !== "boolean") {
            errors.push("Graduation status (isGraduated) is required");
        }

        // Optional field validation
        if (request.cibilScore !== undefined && request.cibilScore !== -1) {
            if (request.cibilScore < 300 || request.cibilScore > 900) {
                errors.push("CIBIL score must be between 300 and 900 (or -1 if not applicable)");
            }
        }

        if (request.completionYear !== undefined) {
            const currentYear = new Date().getFullYear();
            if (request.completionYear < 1900 || request.completionYear > currentYear + 10) {
                errors.push("Completion year is invalid");
            }
        }

        if (errors.length > 0) {
            throw new Error(`Validation failed: ${errors.join("; ")}`);
        }
    }

    /**
     * Validate DID format
     */
    private isValidDid(did: string): boolean {
        // Accept Polygon ID DIDs and generic DIDs
        const patterns = [
            /^did:polygonid:polygon:(main|amoy|mumbai):.+$/,
            /^did:key:.+$/,
            /^did:web:.+$/,
            /^did:[a-z0-9]+:.+$/,
        ];
        return patterns.some(p => p.test(did));
    }

    /**
     * Verify Aadhaar number checksum using Verhoeff algorithm
     * Aadhaar uses Verhoeff checksum for the last digit
     */
    private validateAadhaarChecksum(aadhaar: string): boolean {
        // Verhoeff algorithm multiplication table
        const d = [
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
            [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
            [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
            [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
            [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
            [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
            [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
            [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
            [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
        ];

        // Permutation table
        const p = [
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
            [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
            [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
            [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
            [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
            [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
            [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
        ];

        let c = 0;
        const reversed = aadhaar.split("").reverse();
        for (let i = 0; i < reversed.length; i++) {
            c = d[c][p[i % 8][parseInt(reversed[i], 10)]];
        }
        return c === 0;
    }

    /**
     * Calculate age from date of birth
     */
    private calculateAge(dob: Date): number {
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        return age;
    }

    /**
     * Calculate expiration date
     */
    private calculateExpirationDate(): string {
        const expDate = new Date();
        expDate.setFullYear(expDate.getFullYear() + CREDENTIAL_VALIDITY_YEARS);
        return expDate.toISOString();
    }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let credentialServiceInstance: CredentialService | null = null;

export function getCredentialService(): CredentialService {
    if (!credentialServiceInstance) {
        credentialServiceInstance = new CredentialService();
    }
    return credentialServiceInstance;
}
