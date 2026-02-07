/**
 * GET /api/registry/check/[address]
 * 
 * Check if a specific address is an authorized issuer.
 * This is the primary endpoint used during ZK-proof verification.
 */

import { NextRequest, NextResponse } from "next/server";
import { getBlockchainService } from "@/lib/services/BlockchainService";

export async function GET(
    request: NextRequest,
    { params }: { params: { address: string } }
) {
    try {
        const address = params.address;

        // Validate address format
        if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
            return NextResponse.json(
                { success: false, error: "Invalid Ethereum address format" },
                { status: 400 }
            );
        }

        const blockchainService = getBlockchainService();

        if (!blockchainService.isConfigured()) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Registry contract not configured",
                    isAuthorized: false,
                },
                { status: 503 }
            );
        }

        // Check authorization
        const isAuthorized = await blockchainService.isIssuerAuthorized(address);

        // Get additional info if authorized
        let issuerInfo = null;
        if (isAuthorized) {
            issuerInfo = await blockchainService.getIssuerInfo(address);
        }

        return NextResponse.json({
            success: true,
            address,
            isAuthorized,
            issuerInfo,
            explorerUrl: blockchainService.getExplorerUrl(address, "address"),
        });

    } catch (error) {
        console.error("Error checking issuer:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Internal server error",
                isAuthorized: false,
            },
            { status: 500 }
        );
    }
}
