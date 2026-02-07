/**
 * POST /api/auth/refresh
 * 
 * Refreshes access token using refresh token.
 * 
 * GET /api/auth/refresh
 * 
 * Validates current session and returns user info.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyRefreshToken, generateAccessToken } from "@/lib/auth/jwt";
import { validateAuth } from "@/lib/auth/middleware";
import { getUserById, getOrganizationById } from "@/lib/stores/authStore";
import { SessionResponse } from "@/lib/types/auth";

interface RefreshRequest {
    refreshToken: string;
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as RefreshRequest;

        if (!body.refreshToken) {
            return NextResponse.json(
                { success: false, error: "Refresh token is required" },
                { status: 400 }
            );
        }

        // Verify refresh token
        const payload = verifyRefreshToken(body.refreshToken);
        if (!payload) {
            return NextResponse.json(
                { success: false, error: "Invalid or expired refresh token" },
                { status: 401 }
            );
        }

        // Get fresh user data
        const user = await getUserById(payload.userId);
        if (!user || !user.isActive) {
            return NextResponse.json(
                { success: false, error: "User not found or inactive" },
                { status: 401 }
            );
        }

        // Get organization
        const organization = await getOrganizationById(user.organizationId);
        if (!organization) {
            return NextResponse.json(
                { success: false, error: "Organization not found" },
                { status: 500 }
            );
        }

        // Generate new access token
        const accessToken = generateAccessToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            organizationId: organization.id,
            organizationName: organization.name,
            isAuthorizedOnChain: organization.isAuthorizedOnChain,
        });

        return NextResponse.json({
            success: true,
            accessToken,
            expiresIn: 15 * 60, // 15 minutes
        });
    } catch (error) {
        console.error("[Refresh Token] Error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to refresh token" },
            { status: 500 }
        );
    }
}

/**
 * GET - Validate current session
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await validateAuth(request);

        if (!authResult.authenticated || !authResult.user) {
            return NextResponse.json(
                { valid: false } as SessionResponse,
                { status: 401 }
            );
        }

        // Get fresh organization data
        const organization = await getOrganizationById(authResult.user.organizationId);

        const response: SessionResponse = {
            valid: true,
            user: {
                id: authResult.user.userId,
                email: authResult.user.email,
                role: authResult.user.role,
                organizationId: authResult.user.organizationId,
                organizationName: organization?.name || authResult.user.organizationName,
                isAuthorizedOnChain: organization?.isAuthorizedOnChain ?? authResult.user.isAuthorizedOnChain,
            },
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("[Session Validation] Error:", error);
        return NextResponse.json(
            { valid: false } as SessionResponse,
            { status: 500 }
        );
    }
}
