/**
 * POST /api/verifier/generate-request
 * 
 * Generates a ZK-proof verification request.
 * Returns QR code data that candidates scan with their Privado ID wallet.
 * 
 * --- Request Body ---
 * {
 *   verificationType: "degree" | "age" | "cibil" | "skill" | "graduated" | "custom",
 *   conditions: {
 *     degreeType?: string,
 *     minAge?: number,
 *     minCibilScore?: number,
 *     requiredSkills?: string[],
 *     isGraduated?: boolean,
 *     customQuery?: object
 *   },
 *   verifierId: string,
 *   reason?: string
 * }
 * 
 * --- Response ---
 * {
 *   success: boolean,
 *   requestId: string,
 *   qrData: string,
 *   deepLink: string,
 *   expiresAt: string
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { getProofService } from "@/lib/services/ProofService";
import { VerificationRequest } from "@/lib/types/credentials";

export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body = await request.json() as VerificationRequest;

        // Validate required fields
        if (!body.verificationType) {
            return NextResponse.json(
                { success: false, error: "verificationType is required" },
                { status: 400 }
            );
        }

        if (!body.verifierId) {
            return NextResponse.json(
                { success: false, error: "verifierId is required" },
                { status: 400 }
            );
        }

        // Validate conditions based on verification type
        if (body.verificationType === "degree" && !body.conditions?.degreeType) {
            return NextResponse.json(
                { success: false, error: "degreeType is required for degree verification" },
                { status: 400 }
            );
        }

        if (body.verificationType === "age" && !body.conditions?.minAge) {
            return NextResponse.json(
                { success: false, error: "minAge is required for age verification" },
                { status: 400 }
            );
        }

        if (body.verificationType === "cibil" && !body.conditions?.minCibilScore) {
            return NextResponse.json(
                { success: false, error: "minCibilScore is required for CIBIL verification" },
                { status: 400 }
            );
        }

        // Generate verification request
        const proofService = getProofService();
        const result = await proofService.generateVerificationRequest(body);

        return NextResponse.json({
            success: true,
            requestId: result.requestId,
            qrData: result.qrData,
            deepLink: result.deepLink,
            expiresAt: result.expiresAt,
        });

    } catch (error) {
        console.error("[Generate Verification Request] Error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Internal server error",
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    const proofService = getProofService();
    const stats = await proofService.getStats();

    return NextResponse.json({
        status: "ok",
        endpoint: "/api/verifier/generate-request",
        stats,
        supportedTypes: ["graduated", "degree", "age", "cibil", "skill", "custom"],
    });
}
