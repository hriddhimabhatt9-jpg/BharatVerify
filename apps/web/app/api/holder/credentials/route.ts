/**
 * GET /api/holder/credentials
 * 
 * Returns credentials for a specific holder DID.
 * Used by the holder page to display user's credentials.
 * 
 * Query Parameters:
 * - did: The holder's DID (required)
 */

import { NextRequest, NextResponse } from "next/server";
import { getCredentialService } from "@/lib/services/CredentialService";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const did = searchParams.get("did");

        if (!did) {
            return NextResponse.json(
                { success: false, error: "DID parameter is required" },
                { status: 400 }
            );
        }

        const credentialService = getCredentialService();
        const claims = await credentialService.getClaimsByHolder(did);

        // Transform to holder-friendly format
        const credentials = claims.map(claim => ({
            id: claim.id,
            referenceId: claim.credentialSubject.referenceId,
            fullName: claim.credentialSubject.fullName,
            skillSet: claim.credentialSubject.skillSet,
            isGraduated: claim.credentialSubject.isGraduated,
            institutionName: claim.credentialSubject.institutionName || null,
            degreeTitle: claim.credentialSubject.degreeTitle || null,
            status: claim.status,
            createdAt: claim.createdAt.toISOString(),
            issuedAt: claim.issuedAt?.toISOString() || null,
        }));

        return NextResponse.json({
            success: true,
            did,
            count: credentials.length,
            credentials,
        });

    } catch (error) {
        console.error("[Holder Credentials] Error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Internal server error",
            },
            { status: 500 }
        );
    }
}
