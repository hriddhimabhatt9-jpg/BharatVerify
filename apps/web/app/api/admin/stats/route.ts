/**
 * GET /api/admin/stats
 * 
 * Get admin dashboard statistics.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/middleware";
import {
    getOrganizationsByStatus,
    getRecentActivityLogs,
} from "@/lib/stores/authStore";

export async function GET(request: NextRequest) {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    try {
        const [pending, approved, rejected, recentActivity] = await Promise.all([
            getOrganizationsByStatus("pending"),
            getOrganizationsByStatus("approved"),
            getOrganizationsByStatus("rejected"),
            getRecentActivityLogs(20),
        ]);

        // Separate issuers and verifiers
        const approvedIssuers = approved.filter((org) => org.role === "issuer");
        const approvedVerifiers = approved.filter((org) => org.role === "verifier");
        const authorizedOnChain = approved.filter((org) => org.isAuthorizedOnChain);

        return NextResponse.json({
            success: true,
            stats: {
                pendingApplications: pending.length,
                approvedTotal: approved.length,
                rejectedTotal: rejected.length,
                issuers: approvedIssuers.length,
                verifiers: approvedVerifiers.length,
                authorizedOnChain: authorizedOnChain.length,
            },
            pendingApplications: pending.map((org) => ({
                id: org.id,
                name: org.name,
                type: org.type,
                role: org.role,
                email: org.email,
                createdAt: org.createdAt.toISOString(),
            })),
            recentActivity: recentActivity.map((log) => ({
                id: log.id,
                eventType: log.eventType,
                actorType: log.actorType,
                timestamp: log.timestamp.toISOString(),
                metadata: log.metadata,
                txHash: log.txHash,
            })),
        });
    } catch (error) {
        console.error("[Admin Stats] Error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch stats" },
            { status: 500 }
        );
    }
}
