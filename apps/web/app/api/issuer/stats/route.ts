/**
 * GET /api/issuer/stats
 * 
 * Get issuer dashboard statistics.
 * Returns claim counts and authorization status.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireIssuer } from "@/lib/auth/middleware";
import { getBlockchainService } from "@/lib/services/BlockchainService";
import { getCredentialService } from "@/lib/services/CredentialService";

export async function GET(request: NextRequest) {
    const authResult = await requireIssuer(request);
    if (authResult instanceof NextResponse) return authResult;

    try {
        const { user } = authResult;

        // Check on-chain authorization
        let isAuthorizedOnChain = user.isAuthorizedOnChain;

        // If we have the issuer registry configured, verify on-chain
        const blockchainService = getBlockchainService();
        if (blockchainService.isConfigured()) {
            // In a real implementation, we would query the contract
            // For now, trust the token's authorization status
        }

        // Get real stats from Firestore via CredentialService
        const credentialService = getCredentialService();
        const claimStats = await credentialService.getClaimStats();

        const stats = {
            total: claimStats.total,
            issued: claimStats.issued,
            pending: claimStats.pending,
            claimed: claimStats.issued, // Alias for issued
            revoked: claimStats.revoked,
        };

        return NextResponse.json({
            success: true,
            stats,
            organization: {
                id: user.organizationId,
                name: user.organizationName,
                isAuthorizedOnChain,
            },
            network: {
                name: "Polygon Amoy",
                chainId: 80002,
                contractAddress: blockchainService.getContractAddress() || null,
            },
        });
    } catch (error) {
        console.error("[Issuer Stats] Error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch stats" },
            { status: 500 }
        );
    }
}
