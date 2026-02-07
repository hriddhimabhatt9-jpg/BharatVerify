/**
 * GET /api/registry/issuers
 * GET /api/registry/issuers/[address]
 * 
 * Endpoints for querying registered issuers.
 */

import { NextRequest, NextResponse } from "next/server";
import { getBlockchainService } from "@/lib/services/BlockchainService";

/**
 * GET /api/registry/issuers
 * 
 * Returns list of all registered issuers.
 * Query params:
 * - activeOnly: boolean (default: true)
 */
export async function GET(request: NextRequest) {
    try {
        const blockchainService = getBlockchainService();

        if (!blockchainService.isConfigured()) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Registry contract not configured",
                    issuers: [],
                },
                { status: 503 }
            );
        }

        // Check query param
        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get("activeOnly") !== "false";

        // Get issuers
        const addresses = activeOnly
            ? await blockchainService.getActiveIssuers()
            : await blockchainService.getAllIssuers();

        // Fetch details for each issuer
        const issuers = await Promise.all(
            addresses.map(async (address) => {
                const info = await blockchainService.getIssuerInfo(address);
                return info;
            })
        );

        // Filter out nulls
        const validIssuers = issuers.filter(Boolean);

        return NextResponse.json({
            success: true,
            count: validIssuers.length,
            issuers: validIssuers,
        });

    } catch (error) {
        console.error("Error getting issuers:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Internal server error",
                issuers: [],
            },
            { status: 500 }
        );
    }
}
