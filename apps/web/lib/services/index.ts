/**
 * Service Exports
 * 
 * Central export file for all BharatVerify services.
 * Import services from this file for cleaner imports.
 */

// Core Services
export { CredentialService, getCredentialService } from "./CredentialService";
export { ProofService, getProofService } from "./ProofService";
export { BlockchainService, getBlockchainService } from "./BlockchainService";
export { AuthService, getAuthService } from "./AuthService";
export { PrivadoIDService, getPrivadoIDService } from "./PrivadoIDService";

// Type re-exports from PrivadoIDService
export type {
    PrivadoIDConfig,
    Iden3CredentialOffer,
    Iden3FetchRequest,
    Iden3IssuanceResponse,
    Iden3AuthorizationRequest,
    AuthorizationScope,
    W3CCredential,
} from "./PrivadoIDService";

// Type re-exports from AuthService
export type {
    AuthSession,
    AuthChallengeRequest,
    AuthResult,
} from "./AuthService";
