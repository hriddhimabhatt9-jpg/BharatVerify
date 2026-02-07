/**
 * POST /api/auth/register
 * 
 * Registers a new issuer or verifier organization.
 * Creates user and organization in Firestore with "pending" status.
 * Admin must approve before they can operate.
 */

import { NextRequest, NextResponse } from "next/server";
import { hashPassword, generateTokenPair } from "@/lib/auth/jwt";
import {
    createUser,
    createOrganization,
    getUserByEmail,
    logActivity,
} from "@/lib/stores/authStore";
import { RegistrationRequest, AuthResponse } from "@/lib/types/auth";

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as RegistrationRequest;

        // Validate required fields
        const errors: string[] = [];

        if (!body.email || !body.email.includes("@")) {
            errors.push("Valid email is required");
        }

        if (!body.password || body.password.length < 8) {
            errors.push("Password must be at least 8 characters");
        }

        if (!body.organizationName || body.organizationName.trim().length < 2) {
            errors.push("Organization name is required");
        }

        if (!body.organizationType) {
            errors.push("Organization type is required");
        }

        if (!body.registrationNumber) {
            errors.push("Registration number (CIN/AISHE code) is required");
        }

        if (!["issuer", "verifier"].includes(body.requestedRole)) {
            errors.push("Requested role must be 'issuer' or 'verifier'");
        }

        if (errors.length > 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Validation failed: ${errors.join("; ")}`,
                } as AuthResponse,
                { status: 400 }
            );
        }

        // Check if email already exists
        const existingUser = await getUserByEmail(body.email);
        if (existingUser) {
            return NextResponse.json(
                {
                    success: false,
                    error: "An account with this email already exists",
                } as AuthResponse,
                { status: 409 }
            );
        }

        // Hash password
        const passwordHash = await hashPassword(body.password);

        // Create organization first
        const organization = await createOrganization({
            name: body.organizationName.trim(),
            type: body.organizationType,
            registrationNumber: body.registrationNumber,
            email: body.email.toLowerCase(),
            phone: body.phone,
            address: body.address,
            city: body.city,
            state: body.state,
            pincode: body.pincode,
            website: body.website,
            role: body.requestedRole,
            walletAddress: body.walletAddress,
        });

        // Create user
        const user = await createUser(
            body.email,
            passwordHash,
            organization.id,
            "pending" // Role is pending until admin approves
        );

        // Log the registration
        await logActivity(
            "REGISTRATION_SUBMITTED",
            user.id,
            body.requestedRole === "issuer" ? "issuer" : "verifier",
            organization.id,
            {
                organizationName: organization.name,
                organizationType: organization.type,
                requestedRole: body.requestedRole,
            }
        );

        // Generate tokens (limited access until approved)
        const tokens = generateTokenPair({
            userId: user.id,
            email: user.email,
            role: "pending",
            organizationId: organization.id,
            organizationName: organization.name,
            isAuthorizedOnChain: false,
        });

        const response: AuthResponse = {
            success: true,
            message: "Registration successful. Your application is pending admin approval.",
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                organization: {
                    id: organization.id,
                    name: organization.name,
                    type: organization.type,
                    isAuthorizedOnChain: false,
                },
            },
            tokens,
        };

        return NextResponse.json(response, { status: 201 });
    } catch (error) {
        console.error("[Register] Error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Registration failed",
            } as AuthResponse,
            { status: 500 }
        );
    }
}
