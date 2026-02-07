/**
 * GET /api/issuer/claims
 * 
 * Returns all claims (for issuer dashboard).
 * Supports filtering by status.
 * 
 * --- Query Parameters ---
 * - status: "pending" | "issued" | "revoked" | "all" (default: "all")
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 */

import { NextRequest, NextResponse } from "next/server";
import { getCredentialService } from "@/lib/services/CredentialService";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") || "all";
        const limit = parseInt(searchParams.get("limit") || "50", 10);
        const offset = parseInt(searchParams.get("offset") || "0", 10);

        const credentialService = getCredentialService();

        let claims;
        if (status === "all") {
            claims = await credentialService.getAllClaims();
        } else if (["pending", "issued", "revoked"].includes(status)) {
            claims = await credentialService.getClaimsByStatus(status as "pending" | "issued" | "revoked");
        } else {
            return NextResponse.json(
                { success: false, error: "Invalid status filter" },
                { status: 400 }
            );
        }

        // Apply pagination
        const total = claims.length;
        const paginatedClaims = claims.slice(offset, offset + limit);

        // Map to safe response format (hide sensitive data)
        const safeClaims = paginatedClaims.map(claim => ({
            id: claim.id,
            status: claim.status,
            referenceId: claim.credentialSubject.referenceId,
            fullName: claim.credentialSubject.fullName,
            skillSet: claim.credentialSubject.skillSet,
            isGraduated: claim.credentialSubject.isGraduated,
            institutionName: claim.credentialSubject.institutionName,
            createdAt: claim.createdAt.toISOString(),
            issuedAt: claim.issuedAt?.toISOString() || null,
            revokedAt: claim.revokedAt?.toISOString() || null,
        }));

        return NextResponse.json({
            success: true,
            claims: safeClaims,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total,
            },
        });

    } catch (error) {
        console.error("[List Claims] Error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
