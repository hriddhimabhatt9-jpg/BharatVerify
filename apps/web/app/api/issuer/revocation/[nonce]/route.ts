import { NextRequest, NextResponse } from "next/server";

/**
 * Revocation Status Endpoint
 * 
 * Returns the revocation status for a credential. For hackathon purposes,
 * we always return "not revoked" status in SparseMerkleTreeProof format.
 */

// CORS headers for cross-origin access from wallet
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(
    request: NextRequest,
    { params }: { params: { nonce: string } }
) {
    const nonce = params.nonce;

    // Return SparseMerkleTreeProof revocation status
    // For demo, all credentials are non-revoked
    const revocationStatus = {
        issuer: {
            state: "d23eff2d8531a90efb18da1d693c38ae442dd50d27181dfa36e7a972b943e71c",
            rootOfRoots: "0000000000000000000000000000000000000000000000000000000000000000",
            claimsTreeRoot: "be166e8601560e36fd1ca73652a4782a6636cc917c7d7671dfa75d01bd53442d",
            revocationTreeRoot: "0000000000000000000000000000000000000000000000000000000000000000",
        },
        mtp: {
            existence: false, // false = NOT revoked
            siblings: [],
            node_aux: null,
        },
    };

    return NextResponse.json(revocationStatus, {
        status: 200,
        headers: corsHeaders,
    });
}

export async function POST(
    request: NextRequest,
    { params }: { params: { nonce: string } }
) {
    // Handle POST requests (some wallets might POST instead of GET)
    return GET(request, { params });
}
