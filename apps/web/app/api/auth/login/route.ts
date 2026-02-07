/**
 * POST /api/auth/login
 * 
 * Authenticates a user and returns JWT tokens.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, generateTokenPair } from "@/lib/auth/jwt";
import {
    getUserByEmail,
    getOrganizationById,
    updateUserLastLogin,
} from "@/lib/stores/authStore";
import { AuthResponse } from "@/lib/types/auth";

interface LoginRequest {
    email: string;
    password: string;
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as LoginRequest;

        // Validate input
        if (!body.email || !body.password) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Email and password are required",
                } as AuthResponse,
                { status: 400 }
            );
        }

        // Sanitize email input
        const email = body.email.toLowerCase().trim();

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid email format",
                } as AuthResponse,
                { status: 400 }
            );
        }

        // Password length check (to prevent DoS with very long passwords)
        if (body.password.length > 128) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Password too long",
                } as AuthResponse,
                { status: 400 }
            );
        }

        // Find user (using sanitized email)
        const user = await getUserByEmail(email);
        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid email or password",
                } as AuthResponse,
                { status: 401 }
            );
        }

        // Verify password
        const isValidPassword = await verifyPassword(body.password, user.passwordHash);
        if (!isValidPassword) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid email or password",
                } as AuthResponse,
                { status: 401 }
            );
        }

        // Check if user is active
        if (!user.isActive) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Your account has been deactivated. Please contact support.",
                } as AuthResponse,
                { status: 403 }
            );
        }

        // Get organization
        const organization = await getOrganizationById(user.organizationId);
        if (!organization) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Organization not found",
                } as AuthResponse,
                { status: 500 }
            );
        }

        // Update last login
        await updateUserLastLogin(user.id);

        // Generate tokens
        const tokens = generateTokenPair({
            userId: user.id,
            email: user.email,
            role: user.role,
            organizationId: organization.id,
            organizationName: organization.name,
            isAuthorizedOnChain: organization.isAuthorizedOnChain,
        });

        const response: AuthResponse = {
            success: true,
            message: "Login successful",
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                organization: {
                    id: organization.id,
                    name: organization.name,
                    type: organization.type,
                    isAuthorizedOnChain: organization.isAuthorizedOnChain,
                },
            },
            tokens,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("[Login] Error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Login failed",
            } as AuthResponse,
            { status: 500 }
        );
    }
}
