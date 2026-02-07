/**
 * GET /api/verifier/status/[id]
 * 
 * Check the status of a verification request.
 * Verifiers poll this endpoint to see if the candidate has submitted proof.
 * 
 * --- Response ---
 * {
 *   success: boolean,
 *   requestId: string,
 *   status: "pending" | "verified" | "failed" | "expired",
 *   result?: {
 *     verified: boolean,
 *     holderDid: string,
 *     issuerAuthorized: boolean,
 *     verifiedAt: string
 *   }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { getProofService } from "@/lib/services/ProofService";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const requestId = params.id;

        if (!requestId) {
            return NextResponse.json(
                { success: false, error: "Request ID is required" },
                { status: 400 }
            );
        }

        const proofService = getProofService();
        const status = await proofService.getRequestStatus(requestId);

        if (!status) {
            return NextResponse.json(
                { success: false, error: "Verification request not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            requestId: status.requestId,
            status: status.status,
            createdAt: status.createdAt.toISOString(),
            expiresAt: status.expiresAt.toISOString(),
            result: status.result ? {
                verified: status.result.verified,
                holderDid: status.result.holderDid,
                issuerDid: status.result.issuerDid,
                issuerAuthorized: status.result.issuerAuthorized,
                proofType: status.result.proofType,
                verifiedAt: status.result.verifiedAt.toISOString(),
                disclosedFields: status.result.disclosedFields,
            } : undefined,
        });

    } catch (error) {
        console.error("[Verification Status] Error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
