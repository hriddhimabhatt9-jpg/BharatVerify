/**
 * Auth Middleware
 * 
 * Provides authentication middleware for protected API routes.
 * Validates JWT tokens and extracts user information.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, extractTokenFromHeader } from "@/lib/auth/jwt";
import { getUserById } from "@/lib/stores/authStore";
import { getOrganizationById } from "@/lib/stores/authStore";
import { JWTPayload, UserRole } from "@/lib/types/auth";

// ============================================
// TYPES
// ============================================

export interface AuthenticatedRequest extends NextRequest {
    user?: JWTPayload;
}

export interface AuthResult {
    authenticated: boolean;
    user?: JWTPayload;
    error?: string;
}

// ============================================
// MIDDLEWARE FUNCTIONS
// ============================================

/**
 * Validate auth and extract user from request
 */
export async function validateAuth(request: NextRequest): Promise<AuthResult> {
    const authHeader = request.headers.get("authorization");
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
        return {
            authenticated: false,
            error: "No authorization token provided",
        };
    }

    const payload = verifyAccessToken(token);

    if (!payload) {
        return {
            authenticated: false,
            error: "Invalid or expired token",
        };
    }

    return {
        authenticated: true,
        user: payload,
    };
}

/**
 * Require authentication - returns error response if not authenticated
 */
export async function requireAuth(
    request: NextRequest
): Promise<{ user: JWTPayload } | NextResponse> {
    const result = await validateAuth(request);

    if (!result.authenticated || !result.user) {
        return NextResponse.json(
            { success: false, error: result.error || "Authentication required" },
            { status: 401 }
        );
    }

    return { user: result.user };
}

/**
 * Require specific role(s)
 */
export async function requireRole(
    request: NextRequest,
    allowedRoles: UserRole[]
): Promise<{ user: JWTPayload } | NextResponse> {
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
        return authResult;
    }

    if (!allowedRoles.includes(authResult.user.role)) {
        return NextResponse.json(
            {
                success: false,
                error: `Access denied. Required roles: ${allowedRoles.join(", ")}`,
            },
            { status: 403 }
        );
    }

    return authResult;
}

/**
 * Require admin role
 */
export async function requireAdmin(
    request: NextRequest
): Promise<{ user: JWTPayload } | NextResponse> {
    return requireRole(request, ["admin"]);
}

/**
 * Require issuer role (approved on-chain)
 */
export async function requireIssuer(
    request: NextRequest
): Promise<{ user: JWTPayload } | NextResponse> {
    const authResult = await requireRole(request, ["issuer", "admin"]);

    if (authResult instanceof NextResponse) {
        return authResult;
    }

    // Check if issuer is authorized on-chain
    if (authResult.user.role === "issuer" && !authResult.user.isAuthorizedOnChain) {
        return NextResponse.json(
            {
                success: false,
                error: "Your organization is not yet authorized on-chain. Please wait for admin approval.",
            },
            { status: 403 }
        );
    }

    return authResult;
}

/**
 * Require verifier role (approved on-chain)
 */
export async function requireVerifier(
    request: NextRequest
): Promise<{ user: JWTPayload } | NextResponse> {
    const authResult = await requireRole(request, ["verifier", "admin"]);

    if (authResult instanceof NextResponse) {
        return authResult;
    }

    // Check if verifier is authorized on-chain
    if (authResult.user.role === "verifier" && !authResult.user.isAuthorizedOnChain) {
        return NextResponse.json(
            {
                success: false,
                error: "Your organization is not yet authorized on-chain. Please wait for admin approval.",
            },
            { status: 403 }
        );
    }

    return authResult;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get full user details from token (with fresh data from DB)
 */
export async function getFullUserFromToken(
    token: JWTPayload
): Promise<{
    user: Awaited<ReturnType<typeof getUserById>>;
    organization: Awaited<ReturnType<typeof getOrganizationById>>;
} | null> {
    const user = await getUserById(token.userId);
    if (!user) return null;

    const organization = await getOrganizationById(token.organizationId);
    if (!organization) return null;

    return { user, organization };
}

/**
 * Create unauthorized response
 */
export function unauthorizedResponse(message: string = "Unauthorized"): NextResponse {
    return NextResponse.json(
        { success: false, error: message },
        { status: 401 }
    );
}

/**
 * Create forbidden response
 */
export function forbiddenResponse(message: string = "Forbidden"): NextResponse {
    return NextResponse.json(
        { success: false, error: message },
        { status: 403 }
    );
}
