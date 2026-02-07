/**
 * GET /api/admin/applications
 * 
 * List pending organization applications for admin review.
 * 
 * POST /api/admin/applications
 * 
 * Approve or reject an application.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/middleware";
import {
    getOrganizationsByStatus,
    getOrganizationById,
    approveOrganization,
    rejectOrganization,
    updateUserRole,
    getUserByEmail,
    logActivity,
    updateOrganizationOnChainStatus,
} from "@/lib/stores/authStore";
import { getBlockchainService } from "@/lib/services/BlockchainService";
import { ApplicationReview } from "@/lib/types/auth";

export async function GET(request: NextRequest) {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    try {
        const url = new URL(request.url);
        const status = url.searchParams.get("status") || "pending";

        let organizations;
        if (status === "all") {
            const [pending, approved, rejected] = await Promise.all([
                getOrganizationsByStatus("pending"),
                getOrganizationsByStatus("approved"),
                getOrganizationsByStatus("rejected"),
            ]);
            organizations = [...pending, ...approved, ...rejected];
        } else {
            organizations = await getOrganizationsByStatus(
                status as "pending" | "approved" | "rejected"
            );
        }

        return NextResponse.json({
            success: true,
            applications: organizations.map((org) => ({
                id: org.id,
                name: org.name,
                type: org.type,
                email: org.email,
                registrationNumber: org.registrationNumber,
                role: org.role,
                status: org.status,
                isAuthorizedOnChain: org.isAuthorizedOnChain,
                walletAddress: org.walletAddress,
                website: org.website,
                city: org.city,
                state: org.state,
                createdAt: org.createdAt.toISOString(),
                authorizedAt: org.authorizedAt?.toISOString(),
                rejectedAt: org.rejectedAt?.toISOString(),
                rejectionReason: org.rejectionReason,
            })),
        });
    } catch (error) {
        console.error("[Admin Applications] Error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch applications" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    try {
        const body = (await request.json()) as ApplicationReview;

        if (!body.applicationId || !body.action) {
            return NextResponse.json(
                { success: false, error: "Application ID and action are required" },
                { status: 400 }
            );
        }

        const organization = await getOrganizationById(body.applicationId);
        if (!organization) {
            return NextResponse.json(
                { success: false, error: "Application not found" },
                { status: 404 }
            );
        }

        if (organization.status !== "pending") {
            return NextResponse.json(
                { success: false, error: "Application has already been processed" },
                { status: 400 }
            );
        }

        const adminUserId = authResult.user.userId;

        if (body.action === "approve") {
            // Approve in Firestore
            await approveOrganization(organization.id, adminUserId);

            // Update user role from pending to issuer/verifier
            const user = await getUserByEmail(organization.email);
            if (user) {
                await updateUserRole(user.id, organization.role);
            }

            // Try to authorize on-chain if wallet address provided
            let txHash: string | undefined;
            if (organization.walletAddress) {
                try {
                    const blockchainService = getBlockchainService();
                    const result = await blockchainService.authorizeIssuer(
                        organization.walletAddress,
                        organization.name,
                        organization.type
                    );
                    txHash = result.txHash;
                    await updateOrganizationOnChainStatus(
                        organization.id,
                        true,
                        organization.walletAddress
                    );
                } catch (bcError) {
                    console.warn("[Admin] On-chain authorization failed:", bcError);
                    // Continue with approval even if on-chain fails
                }
            }

            // Log activity
            await logActivity(
                "APPLICATION_APPROVED",
                adminUserId,
                "admin",
                organization.id,
                { organizationName: organization.name, role: organization.role },
                txHash
            );

            return NextResponse.json({
                success: true,
                message: `${organization.name} has been approved as ${organization.role}`,
                txHash,
            });
        } else if (body.action === "reject") {
            if (!body.reason) {
                return NextResponse.json(
                    { success: false, error: "Reason is required for rejection" },
                    { status: 400 }
                );
            }

            await rejectOrganization(organization.id, adminUserId, body.reason);

            // Log activity
            await logActivity(
                "APPLICATION_REJECTED",
                adminUserId,
                "admin",
                organization.id,
                { organizationName: organization.name, reason: body.reason }
            );

            return NextResponse.json({
                success: true,
                message: `${organization.name} application has been rejected`,
            });
        } else {
            return NextResponse.json(
                { success: false, error: "Invalid action. Use 'approve' or 'reject'" },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error("[Admin Review] Error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to process application" },
            { status: 500 }
        );
    }
}
