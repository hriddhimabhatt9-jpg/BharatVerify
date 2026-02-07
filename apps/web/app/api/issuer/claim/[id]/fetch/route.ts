/**
 * POST /api/issuer/claim/[id]/fetch
 * 
 * This is the CRITICAL endpoint that the Privado ID mobile app calls
 * when the user scans the credential offer QR code.
 * 
 * --- Flow ---
 * 1. User scans QR code with Privado ID wallet
 * 2. Wallet extracts the credential offer URL
 * 3. Wallet sends iden3comm fetch request to this endpoint
 * 4. We validate and return the signed credential
 * 5. Wallet stores credential in user's identity wallet
 * 
 * --- Request Format (iden3comm) ---
 * {
 *   "id": "uuid",
 *   "typ": "application/iden3comm-plain-json",
 *   "type": "https://iden3-communication.io/credentials/1.0/fetch-request",
 *   "thid": "claim-id",
 *   "from": "did:polygonid:...",  // Holder's DID
 *   "to": "did:polygonid:...",    // Issuer's DID
 *   "body": {
 *     "id": "credential-id"
 *   }
 * }
 * 
 * --- Response Format (iden3comm) ---
 * {
 *   "id": "uuid",
 *   "typ": "application/iden3comm-plain-json", 
 *   "type": "https://iden3-communication.io/credentials/1.0/issuance",
 *   "from": "issuer-did",
 *   "to": "holder-did",
 *   "body": {
 *     "credential": { ... W3C VC ... }
 *   }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { getCredentialService } from "@/lib/services/CredentialService";
import { Iden3FetchRequest } from "@/lib/services/PrivadoIDService";

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const claimId = params.id;

        if (!claimId) {
            return createIden3ErrorResponse(
                "missing_claim_id",
                "Claim ID is required"
            );
        }

        // Read raw body to debug "Unexpected token" error
        const rawBody = await request.text();
        console.log(`[Credential Fetch] Raw Body: ${rawBody.substring(0, 100)}...`);

        let fetchRequest: Iden3FetchRequest;
        try {
            fetchRequest = JSON.parse(rawBody);
        } catch (e) {
            console.error("[Credential Fetch] JSON Parse Error:", e);
            // If it's a JWT/String, maybe the wallet sent it as raw text?
            // Attempt to handle or throw better error
            throw new Error(`Invalid JSON body: ${rawBody.substring(0, 20)}...`);
        }

        // Validate request structure
        if (!fetchRequest.type?.includes("fetch-request")) {
            return createIden3ErrorResponse(
                "invalid_request_type",
                "Expected iden3comm fetch-request"
            );
        }

        if (!fetchRequest.from) {
            return createIden3ErrorResponse(
                "missing_holder_did",
                "Holder DID (from) is required"
            );
        }

        // Log for debugging
        console.log(`[Credential Fetch] Claim: ${claimId}, Holder: ${fetchRequest.from}`);

        // Process the credential fetch
        const credentialService = getCredentialService();
        const issuanceResponse = await credentialService.processCredentialFetch(
            claimId,
            fetchRequest
        );

        if (!issuanceResponse) {
            return createIden3ErrorResponse(
                "issuance_failed",
                "Failed to issue credential"
            );
        }

        console.log(`[Credential Fetch] Success: Credential issued for ${claimId}`);

        // Return the signed credential in iden3comm format
        return NextResponse.json(issuanceResponse, {
            headers: {
                "Content-Type": "application/json",
            },
        });

    } catch (error) {
        console.error("[Credential Fetch] Error:", error);

        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return createIden3ErrorResponse("server_error", errorMessage);
    }
}

/**
 * GET - Returns claim info for debugging/status checks
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const claimId = params.id;
        const credentialService = getCredentialService();
        const claim = await credentialService.getClaim(claimId);

        if (!claim) {
            return NextResponse.json(
                { success: false, error: "Claim not found" },
                { status: 404 }
            );
        }

        // Return public claim info (not the full credential)
        return NextResponse.json({
            success: true,
            claimId: claim.id,
            status: claim.status,
            createdAt: claim.createdAt.toISOString(),
            issuedAt: claim.issuedAt?.toISOString() || null,
            credentialType: claim.credential.type,
            skillSet: claim.credentialSubject.skillSet,
        });

    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * Create an iden3comm-compliant error response
 */
function createIden3ErrorResponse(code: string, message: string) {
    return NextResponse.json(
        {
            id: `error-${Date.now()}`,
            typ: "application/iden3comm-plain-json",
            type: "https://iden3-communication.io/credentials/1.0/problem-report",
            body: {
                code,
                comment: message,
            },
        },
        { status: 400 }
    );
}
