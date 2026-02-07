/**
 * POST /api/issuer/revoke/[id]
 * GET  /api/issuer/revoke/[id]
 * 
 * Revoke a credential claim.
 * 
 * --- POST Request ---
 * Body: { reason?: string }
 * 
 * --- GET Request ---
 * Returns revocation status for a claim.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCredentialService } from "@/lib/services/CredentialService";

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const claimId = params.id;

        if (!claimId) {
            return NextResponse.json(
                { success: false, error: "Claim ID is required" },
                { status: 400 }
            );
        }

        // Parse optional reason
        let reason: string | undefined;
        try {
            const body = await request.json();
            reason = body.reason;
        } catch {
            // No body or invalid JSON - that's OK, reason is optional
        }

        const credentialService = getCredentialService();
        const success = await credentialService.revokeClaim(claimId, reason);

        if (!success) {
            return NextResponse.json(
                { success: false, error: "Claim not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            claimId,
            message: "Credential has been revoked",
            reason: reason || "No reason provided",
        });

    } catch (error) {
        console.error("[Revoke Claim] Error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const claimId = params.id;

        if (!claimId) {
            return NextResponse.json(
                { success: false, error: "Claim ID is required" },
                { status: 400 }
            );
        }

        const credentialService = getCredentialService();
        const status = await credentialService.checkRevocationStatus(claimId);

        return NextResponse.json({
            success: true,
            claimId,
            ...status,
        });

    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
