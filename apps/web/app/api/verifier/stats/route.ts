/**
 * GET /api/verifier/stats
 * 
 * Get verifier dashboard statistics.
 * Returns verification counts and authorization status.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireVerifier } from "@/lib/auth/middleware";
import { getProofService } from "@/lib/services/ProofService";

export async function GET(request: NextRequest) {
    const authResult = await requireVerifier(request);
    if (authResult instanceof NextResponse) return authResult;

    try {
        const { user } = authResult;

        // Get real stats from Firestore via ProofService
        const proofService = getProofService();
        const proofStats = await proofService.getStats();

        const stats = {
            totalVerifications: proofStats.total,
            successRate: proofStats.total > 0
                ? Math.round((proofStats.verified / proofStats.total) * 100)
                : 0,
            pending: proofStats.pending,
            verified: proofStats.verified,
            failed: proofStats.failed,
        };

        return NextResponse.json({
            success: true,
            stats,
            organization: {
                id: user.organizationId,
                name: user.organizationName,
                isAuthorizedOnChain: user.isAuthorizedOnChain,
            },
            network: {
                name: "Polygon Amoy",
                chainId: 80002,
            },
        });
    } catch (error) {
        console.error("[Verifier Stats] Error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch stats" },
            { status: 500 }
        );
    }
}
