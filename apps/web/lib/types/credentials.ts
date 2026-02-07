/**
 * BharatVerify Type Definitions
 * 
 * This module contains all TypeScript types for the BharatVerify platform,
 * including credential schemas, API request/response types, and service types.
 */

import { Iden3CredentialOffer } from "../services/PrivadoIDService";

// ============================================
// CREDENTIAL TYPES
// ============================================

/**
 * W3C Verifiable Credential structure
 * @see https://www.w3.org/TR/vc-data-model/
 */
export interface VerifiableCredential {
    "@context": string[];
    type: string[];
    id: string;
    issuer: string | { id: string; name?: string };
    issuanceDate: string;
    expirationDate?: string;
    credentialSubject: IndianWorkforceCredentialSubject & { id: string };
    credentialSchema: {
        id: string;
        type: string;
    };
    credentialStatus?: {
        id: string;
        type: string;
        revocationNonce?: number;
    };
    proof?: any;
}

/**
 * IndianWorkforceCredential Subject
 * 
 * This is the core data structure for credentials issued by BharatVerify.
 * Each field is designed for selective disclosure via ZK-proofs.
 */
export interface IndianWorkforceCredentialSubject {
    /** Unique reference ID for this credential (format: BV-{timestamp}-{random}) */
    referenceId: string;

    /** SHA-256 hash of Aadhaar number (privacy-preserving) */
    aadhaarHash: string;

    /** Full legal name of the credential holder */
    fullName: string;

    /** Date of birth in ISO 8601 format (YYYY-MM-DD) */
    dateOfBirth: string;

    /** Primary skill set or qualification */
    skillSet: string;

    /** Whether the holder has completed graduation */
    isGraduated: boolean;

    /** CIBIL credit score (300-900, or -1 if not applicable) */
    cibilScore: number;

    /** Optional: Name of the issuing institution */
    institutionName?: string;

    /** Optional: Degree or certificate title */
    degreeTitle?: string;

    /** Optional: Year of completion */
    completionYear?: number;

    /** Optional: Grade or CGPA */
    grade?: string;
}

// ============================================
// CLAIM TYPES
// ============================================

/**
 * Request body for creating a new credential claim
 */
export interface CreateClaimRequest {
    /** DID of the credential holder (from Privado ID wallet) */
    holderDid: string;

    /** Full legal name */
    fullName: string;

    /** 12-digit Aadhaar number (will be hashed) */
    aadhaarNumber: string;

    /** Date of birth in ISO format */
    dateOfBirth: string;

    /** Primary skill/qualification */
    skillSet: string;

    /** Has completed graduation */
    isGraduated: boolean;

    /** CIBIL score (optional, 300-900 or -1) */
    cibilScore?: number;

    /** Name of issuing institution (optional) */
    institutionName?: string;

    /** Degree/certificate title (optional) */
    degreeTitle?: string;

    /** Year of completion (optional) */
    completionYear?: number;

    /** Grade achieved (optional) */
    grade?: string;
}

/**
 * Response from claim creation
 */
export interface CreateClaimResponse {
    success: boolean;
    claimId: string;
    referenceId: string;
    qrCodeData?: string;
    deepLink?: string;
    universalLink?: string;
    error?: string;
}

/**
 * Internal claim record structure
 */
export interface ClaimRecord {
    /** Unique claim identifier */
    id: string;

    /** The W3C Verifiable Credential */
    credential: VerifiableCredential;

    /** Credential subject data (for re-issuance) */
    credentialSubject: IndianWorkforceCredentialSubject;

    /** Intended holder DID */
    holderDid: string;

    /** Current status */
    status: "pending" | "issued" | "revoked";

    /** Creation timestamp */
    createdAt: Date;

    /** Last update timestamp */
    updatedAt: Date;

    /** The iden3comm offer (for QR regeneration) */
    offer?: Iden3CredentialOffer;

    /** When the credential was issued */
    issuedAt?: Date;

    /** DID of who claimed the credential */
    issuedTo?: string;

    /** When revoked */
    revokedAt?: Date;

    /** Reason for revocation */
    revocationReason?: string;

    /** Credential ID in Privado ID Issuer Node (when using live mode) */
    issuerNodeCredentialId?: string;
}

// ============================================
// VERIFICATION TYPES
// ============================================

/**
 * Request body for generating a verification request
 */
export interface VerificationRequest {
    /** Type of verification */
    verificationType: "degree" | "age" | "cibil" | "skill" | "graduated" | "custom";

    /** Verification conditions */
    conditions: VerificationConditions;

    /** Verifier's identifier */
    verifierId: string;

    /** Callback URL for proof submission */
    callbackUrl?: string;

    /** Human-readable reason for verification */
    reason?: string;
}

/**
 * Conditions for verification
 */
export interface VerificationConditions {
    /** Specific degree type to verify */
    degreeType?: string;

    /** Minimum age requirement */
    minAge?: number;

    /** Maximum age requirement */
    maxAge?: number;

    /** Minimum CIBIL score */
    minCibilScore?: number;

    /** Maximum CIBIL score */
    maxCibilScore?: number;

    /** Required skills (any match) */
    requiredSkills?: string[];

    /** Require graduation */
    isGraduated?: boolean;

    /** Minimum completion year */
    minCompletionYear?: number;

    /** Custom query conditions */
    customQuery?: Record<string, any>;
}

/**
 * Response from verification request generation
 */
export interface VerificationRequestResponse {
    success: boolean;
    requestId: string;
    qrCodeData: string;
    deepLink: string;
    expiresAt: Date;
    error?: string;
}

/**
 * Verification session status
 */
export interface VerificationStatus {
    requestId: string;
    status: "pending" | "verified" | "failed" | "expired";
    createdAt: Date;
    expiresAt: Date;
    result?: VerificationResult;
}

/**
 * Result of a successful verification
 */
export interface VerificationResult {
    verified: boolean;
    holderDid: string;
    issuerDid: string;
    issuerAuthorized?: boolean;
    proofType: string;
    verifiedAt: Date;
    disclosedFields?: string[];
}

// ============================================
// ISSUER REGISTRY TYPES
// ============================================

/**
 * Information about a registered issuer
 */
export interface IssuerInfo {
    /** Ethereum address of the issuer */
    address: string;

    /** Human-readable name */
    name: string;

    /** Type of issuer (University, ITI, etc.) */
    issuerType: string;

    /** When registered (Unix timestamp) */
    registeredAt: number;

    /** Whether currently active */
    isActive: boolean;
}

// ============================================
// API TYPES
// ============================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// ============================================
// BLOCKCHAIN TYPES
// ============================================

/**
 * Network configuration
 */
export interface NetworkConfig {
    chainId: number;
    name: string;
    rpcUrl: string;
    explorer: string;
}

/**
 * Transaction result
 */
export interface TransactionResult {
    success: boolean;
    hash?: string;
    explorerUrl?: string;
    error?: string;
}
