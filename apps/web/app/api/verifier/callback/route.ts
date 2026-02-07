/**
 * POST /api/verifier/callback
 * GET  /api/verifier/callback/[id]
 * 
 * Callback endpoint for ZK-proof verification results.
 * 
 * --- Flow ---
 * 1. Verifier generates request via /generate-request
 * 2. User scans QR with Privado ID wallet
 * 3. Wallet generates ZK-proof and sends to this callback
 * 4. This endpoint validates the proof and updates status
 * 5. Verifier polls GET /callback/[id] to check result
 */

import { NextRequest, NextResponse } from "next/server";
import { getProofService } from "@/lib/services/ProofService";
import { getBlockchainService } from "@/lib/services/BlockchainService";

/**
 * POST - Receive ZK-proof from Privado ID wallet
 * 
 * The wallet sends the generated proof to this endpoint.
 * We validate it and check the issuer against our on-chain registry.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Extract request ID from the proof
        const requestId = body.thid || body.id;

        if (!requestId) {
            return NextResponse.json(
                { success: false, error: "Invalid proof: missing request ID" },
                { status: 400 }
            );
        }

        const proofService = getProofService();
        const blockchainService = getBlockchainService();

        // Process the verification callback
        const result = await proofService.processVerificationCallback(requestId, body);

        // If verified, additionally check the issuer against our smart contract
        if (result.verified && body.from) {
            const issuerAddress = extractAddressFromDid(body.from);
            if (issuerAddress) {
                const isAuthorized = await blockchainService.isIssuerAuthorized(issuerAddress);
                result.issuerAuthorized = isAuthorized;

                // If issuer is not authorized, mark verification as failed
                if (!isAuthorized) {
                    result.verified = false;
                    result.error = "Issuer is not authorized in the Government Trust Registry";
                }
            }
        }

        // Return standardized response
        return NextResponse.json({
            id: requestId,
            typ: "application/iden3comm-plain-json",
            type: "https://iden3-communication.io/authorization/1.0/response",
            thid: requestId,
            body: {
                message: result.verified ? "Verification successful" : result.error,
                verified: result.verified,
                issuerAuthorized: result.issuerAuthorized,
            },
        });

    } catch (error) {
        console.error("Error processing verification callback:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Internal server error"
            },
            { status: 500 }
        );
    }
}

/**
 * Extract Ethereum address from a DID string
 * 
 * Example DID: did:polygonid:polygon:amoy:2qH7XAwTWpA...
 * This would need proper DID resolution in production
 */
function extractAddressFromDid(did: string): string | null {
    // In production, use proper DID resolution
    // For MVP, we'll accept a direct address or try to extract from DID
    if (did.startsWith("0x") && did.length === 42) {
        return did;
    }

    // Attempt to extract address from DID (simplified)
    const parts = did.split(":");
    if (parts.length >= 5) {
        // The last part might be the identifier
        const identifier = parts[parts.length - 1];
        // This is a simplified extraction - real implementation needs DID resolver
        return null;
    }

    return null;
}
