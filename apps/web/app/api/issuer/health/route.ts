/**
 * GET /api/issuer/health
 * 
 * Health check endpoint for the issuer service.
 * Returns status of all connected services.
 */

import { NextResponse } from "next/server";
import { getCredentialService } from "@/lib/services/CredentialService";
import { getPrivadoIDService } from "@/lib/services/PrivadoIDService";
import { getBlockchainService } from "@/lib/services/BlockchainService";

export async function GET() {
    try {
        // Get service statuses
        const credentialService = getCredentialService();
        const privadoService = getPrivadoIDService();
        const blockchainService = getBlockchainService();

        // Check Privado ID service
        const privadoHealth = await privadoService.checkIssuerNodeHealth();

        // Check blockchain connection
        const networkInfo = await blockchainService.getNetworkInfo();

        // Get claim stats
        const claimStats = credentialService.getClaimStats();

        return NextResponse.json({
            status: "healthy",
            timestamp: new Date().toISOString(),
            services: {
                credentialService: {
                    status: "ok",
                    stats: claimStats,
                },
                privadoID: {
                    status: privadoHealth.healthy ? "ok" : "degraded",
                    mode: privadoHealth.mode,
                    issuerDid: privadoHealth.issuerDid,
                    error: privadoHealth.error,
                },
                blockchain: {
                    status: networkInfo.isConnected ? "ok" : "disconnected",
                    network: networkInfo.name,
                    chainId: networkInfo.chainId,
                    blockNumber: networkInfo.blockNumber,
                    registryConfigured: blockchainService.isConfigured(),
                },
            },
            config: {
                mockMode: privadoService.isMockMode(),
                schemaBaseUrl: privadoService.getConfig().schemaBaseUrl,
                appBaseUrl: privadoService.getConfig().appBaseUrl,
            },
        });

    } catch (error) {
        console.error("[Health Check] Error:", error);
        return NextResponse.json(
            {
                status: "unhealthy",
                error: error instanceof Error ? error.message : "Unknown error",
                timestamp: new Date().toISOString(),
            },
            { status: 503 }
        );
    }
}
