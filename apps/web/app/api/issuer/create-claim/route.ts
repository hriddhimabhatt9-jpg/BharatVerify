/**
 * POST /api/issuer/create-claim
 * 
 * Creates a new credential claim for a holder.
 * Returns QR code data that the user scans with their Privado ID wallet.
 * 
 * --- Request Body ---
 * {
 *   holderDid: string,        // User's DID from Privado ID wallet
 *   fullName: string,         // Full legal name
 *   aadhaarNumber: string,    // 12-digit Aadhaar (will be hashed)
 *   dateOfBirth: string,      // ISO date (YYYY-MM-DD)
 *   skillSet: string,         // Primary skill/qualification
 *   isGraduated: boolean,     // Has completed graduation
 *   cibilScore?: number,      // 300-900 or -1 (optional)
 *   institutionName?: string,
 *   degreeTitle?: string,
 *   completionYear?: number,
 *   grade?: string
 * }
 * 
 * --- Response ---
 * {
 *   success: boolean,
 *   claimId: string,
 *   referenceId: string,
 *   qrCodeData: string,       // JSON for QR generation
 *   deepLink: string,         // iden3comm:// deep link
 *   universalLink: string,    // Web wallet link
 *   error?: string
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { getCredentialService } from "@/lib/services/CredentialService";
import { CreateClaimRequest } from "@/lib/types/credentials";

export async function POST(request: NextRequest) {
    try {
        // Parse and validate content type
        const contentType = request.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
            return NextResponse.json(
                { success: false, error: "Content-Type must be application/json" },
                { status: 415 }
            );
        }

        // Parse request body
        let body: CreateClaimRequest;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { success: false, error: "Invalid JSON body" },
                { status: 400 }
            );
        }

        // Basic validation (detailed validation in service)
        if (!body.holderDid) {
            return NextResponse.json(
                { success: false, error: "holderDid is required" },
                { status: 400 }
            );
        }

        if (!body.fullName) {
            return NextResponse.json(
                { success: false, error: "fullName is required" },
                { status: 400 }
            );
        }

        if (!body.aadhaarNumber) {
            return NextResponse.json(
                { success: false, error: "aadhaarNumber is required" },
                { status: 400 }
            );
        }

        // Create the credential claim
        const credentialService = getCredentialService();
        const result = await credentialService.createClaim(body);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        // Return success response with all linking options
        return NextResponse.json({
            success: true,
            claimId: result.claimId,
            referenceId: result.referenceId,
            qrCodeData: result.qrCodeData,
            deepLink: result.deepLink,
            universalLink: result.universalLink,
            // Instructions for frontend
            instructions: {
                qrCode: "Display this JSON as a QR code for the user to scan with Privado ID wallet",
                deepLink: "Use for 'Open in Wallet' button on mobile devices",
                universalLink: "Use for web wallet access",
            },
        });

    } catch (error) {
        console.error("[Create Claim] Error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Internal server error",
            },
            { status: 500 }
        );
    }
}

/**
 * GET - Returns service status and statistics
 */
export async function GET() {
    const credentialService = getCredentialService();
    const stats = credentialService.getClaimStats();

    return NextResponse.json({
        status: "ok",
        endpoint: "/api/issuer/create-claim",
        stats,
        supportedFields: {
            required: ["holderDid", "fullName", "aadhaarNumber", "dateOfBirth", "skillSet", "isGraduated"],
            optional: ["cibilScore", "institutionName", "degreeTitle", "completionYear", "grade"],
        },
    });
}
