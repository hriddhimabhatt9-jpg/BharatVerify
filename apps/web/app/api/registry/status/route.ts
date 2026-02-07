/**
 * GET /api/registry/status
 * GET /api/registry/issuers
 * 
 * API endpoints for querying the IssuerRegistry smart contract.
 * These are public read-only endpoints.
 */

import { NextRequest, NextResponse } from "next/server";
import { getBlockchainService } from "@/lib/services/BlockchainService";

/**
 * GET /api/registry/status
 * 
 * Returns the status of the blockchain connection and registry contract.
 */
export async function GET(request: NextRequest) {
    try {
        const blockchainService = getBlockchainService();

        // Get network info
        const networkInfo = await blockchainService.getNetworkInfo();

        // Get contract info
        const contractAddress = blockchainService.getContractAddress();
        const isConfigured = blockchainService.isConfigured();

        let issuerCount = 0;
        let owner = null;

        if (isConfigured) {
            issuerCount = await blockchainService.getIssuerCount();
            owner = await blockchainService.getOwner();
        }

        return NextResponse.json({
            success: true,
            blockchain: {
                network: networkInfo.name,
                chainId: networkInfo.chainId,
                blockNumber: networkInfo.blockNumber,
                isConnected: networkInfo.isConnected,
            },
            registry: {
                isConfigured,
                contractAddress: contractAddress || "Not configured",
                owner,
                issuerCount,
                explorerUrl: contractAddress
                    ? blockchainService.getExplorerUrl(contractAddress, "address")
                    : null,
            },
        });

    } catch (error) {
        console.error("Error getting registry status:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Internal server error"
            },
            { status: 500 }
        );
    }
}
