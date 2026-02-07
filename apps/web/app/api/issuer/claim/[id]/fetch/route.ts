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

// CORS headers for cross-origin requests from wallet.privado.id
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
    "Access-Control-Max-Age": "86400",
};

// Handle preflight OPTIONS request
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: corsHeaders,
    });
}

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

        // Read raw body for debugging
        const rawBody = await request.text();
        console.log(`[Credential Fetch] ClaimId: ${claimId}`);
        console.log(`[Credential Fetch] Raw Body Length: ${rawBody.length}`);
        console.log(`[Credential Fetch] Raw Body First 200 chars: ${rawBody.substring(0, 200)}`);
        console.log(`[Credential Fetch] Raw Body Last 100 chars: ...${rawBody.substring(rawBody.length - 100)}`);

        let fetchRequest: Iden3FetchRequest;
        try {
            // First try parsing as plain JSON
            fetchRequest = JSON.parse(rawBody);
        } catch (e) {
            console.log("[Credential Fetch] Not plain JSON, trying to decode as JWZ/JWT...");

            // The Privado ID app sends a JWZ (JSON Web Zero-knowledge proof)
            // Format: header.payload.proof (base64url encoded, dot-separated)
            // We need to extract and decode the payload
            try {
                // Check if it looks like a JWZ/JWT (starts with eyJ)
                if (rawBody.startsWith('eyJ')) {
                    const parts = rawBody.split('.');

                    if (parts.length >= 2) {
                        // Decode the payload (second part)
                        // Base64url decode: replace - with +, _ with /
                        let payload = parts[1]
                            .replace(/-/g, '+')
                            .replace(/_/g, '/');

                        // Add padding if needed
                        while (payload.length % 4) {
                            payload += '=';
                        }

                        const decodedPayload = Buffer.from(payload, 'base64').toString('utf8');
                        console.log(`[Credential Fetch] Decoded JWZ payload: ${decodedPayload.substring(0, 200)}...`);

                        fetchRequest = JSON.parse(decodedPayload);
                    } else {
                        // Single base64 string, try decoding directly
                        let decoded = rawBody
                            .replace(/-/g, '+')
                            .replace(/_/g, '/');
                        while (decoded.length % 4) {
                            decoded += '=';
                        }
                        const decodedStr = Buffer.from(decoded, 'base64').toString('utf8');
                        fetchRequest = JSON.parse(decodedStr);
                    }
                } else {
                    // Fallback: Create minimal fetch request from claim ID
                    console.log("[Credential Fetch] Creating fallback fetch request from claimId");
                    fetchRequest = {
                        id: `fetch-${Date.now()}`,
                        typ: "application/iden3comm-plain-json",
                        type: "https://iden3-communication.io/credentials/1.0/fetch-request",
                        thid: claimId,
                        from: "did:iden3:privado:main:unknown",
                        to: process.env.ISSUER_DID || "",
                        body: {
                            id: claimId,
                        },
                    };
                }
            } catch (decodeError) {
                console.log("[Credential Fetch] JWZ decode failed, using fallback fetch request");
                // Final fallback: Create minimal fetch request
                fetchRequest = {
                    id: `fetch-${Date.now()}`,
                    typ: "application/iden3comm-plain-json",
                    type: "https://iden3-communication.io/credentials/1.0/fetch-request",
                    thid: claimId,
                    from: "did:iden3:privado:main:unknown",
                    to: process.env.ISSUER_DID || "",
                    body: {
                        id: claimId,
                    },
                };
            }
        }

        // Validate request structure - be lenient and set defaults for missing fields
        if (!fetchRequest.type || !fetchRequest.type.includes("fetch-request")) {
            console.log("[Credential Fetch] Missing or invalid type, assuming fetch-request");
            fetchRequest.type = "https://iden3-communication.io/credentials/1.0/fetch-request";
        }

        if (!fetchRequest.from) {
            console.log("[Credential Fetch] Missing holder DID, using placeholder");
            fetchRequest.from = "did:iden3:privado:main:unknown";
        }

        if (!fetchRequest.body) {
            fetchRequest.body = { id: claimId };
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

        // Return the signed credential in iden3comm format with CORS headers
        return NextResponse.json(issuanceResponse, {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
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
        {
            status: 400,
            headers: corsHeaders,
        }
    );
}
