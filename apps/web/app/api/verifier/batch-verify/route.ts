/**
 * POST /api/verifier/batch-verify
 * 
 * Batch verification endpoint for large-scale recruitment drives.
 * Allows employers to verify multiple credentials in a single request.
 * 
 * --- Request Body ---
 * {
 *   verifications: [
 *     {
 *       claimId: string,          // Reference ID or claim ID
 *       requirements?: {          // Optional specific requirements
 *         isGraduated?: boolean,
 *         minCibilScore?: number,
 *         skillSet?: string
 *       }
 *     }
 *   ]
 * }
 * 
 * --- Response ---
 * {
 *   success: boolean,
 *   total: number,
 *   verified: number,
 *   failed: number,
 *   results: [
 *     {
 *       claimId: string,
 *       verified: boolean,
 *       issuerAuthorized: boolean,
 *       status: string,
 *       error?: string
 *     }
 *   ]
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { getCredentialService } from "@/lib/services/CredentialService";
import { getBlockchainService } from "@/lib/services/BlockchainService";

interface VerificationRequest {
    claimId: string;
    requirements?: {
        isGraduated?: boolean;
        minCibilScore?: number;
        skillSet?: string;
    };
}

interface VerificationResult {
    claimId: string;
    verified: boolean;
    issuerAuthorized: boolean;
    status: string;
    holderName?: string;
    skillSet?: string;
    meetsRequirements: boolean;
    error?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { verifications } = body;

        if (!verifications || !Array.isArray(verifications) || verifications.length === 0) {
            return NextResponse.json(
                { success: false, error: "verifications array is required" },
                { status: 400 }
            );
        }

        // Limit batch size to prevent abuse
        if (verifications.length > 100) {
            return NextResponse.json(
                { success: false, error: "Maximum 100 verifications per batch" },
                { status: 400 }
            );
        }

        const credentialService = getCredentialService();
        const blockchainService = getBlockchainService();
        const results: VerificationResult[] = [];
        let verifiedCount = 0;
        let failedCount = 0;

        // Process each verification request
        for (const req of verifications as VerificationRequest[]) {
            try {
                const claim = await credentialService.getClaim(req.claimId);

                if (!claim) {
                    results.push({
                        claimId: req.claimId,
                        verified: false,
                        issuerAuthorized: false,
                        status: "not_found",
                        meetsRequirements: false,
                        error: "Claim not found",
                    });
                    failedCount++;
                    continue;
                }

                // Check if claim is revoked
                if (claim.status === "revoked") {
                    results.push({
                        claimId: req.claimId,
                        verified: false,
                        issuerAuthorized: false,
                        status: "revoked",
                        meetsRequirements: false,
                        error: "Credential has been revoked",
                    });
                    failedCount++;
                    continue;
                }

                // Check issuer authorization on-chain (if blockchain service is configured)
                let issuerAuthorized = true;
                if (blockchainService.isConfigured()) {
                    try {
                        // Extract issuer address from credential
                        // For now, assume all credentials from our system are authorized
                        issuerAuthorized = true; // TODO: implement proper check
                    } catch (bcError) {
                        console.warn("Blockchain check failed:", bcError);
                    }
                }

                // Check specific requirements if provided
                let meetsRequirements = true;
                if (req.requirements) {
                    const subject = claim.credentialSubject;

                    if (req.requirements.isGraduated !== undefined) {
                        meetsRequirements = meetsRequirements &&
                            subject.isGraduated === req.requirements.isGraduated;
                    }

                    if (req.requirements.minCibilScore !== undefined && subject.cibilScore) {
                        meetsRequirements = meetsRequirements &&
                            subject.cibilScore >= req.requirements.minCibilScore;
                    }

                    if (req.requirements.skillSet) {
                        meetsRequirements = meetsRequirements &&
                            subject.skillSet.toLowerCase().includes(req.requirements.skillSet.toLowerCase());
                    }
                }

                const verified = claim.status === "issued" && issuerAuthorized && meetsRequirements;

                results.push({
                    claimId: req.claimId,
                    verified,
                    issuerAuthorized,
                    status: claim.status,
                    holderName: claim.credentialSubject.fullName,
                    skillSet: claim.credentialSubject.skillSet,
                    meetsRequirements,
                });

                if (verified) verifiedCount++;
                else failedCount++;

            } catch (error) {
                results.push({
                    claimId: req.claimId,
                    verified: false,
                    issuerAuthorized: false,
                    status: "error",
                    meetsRequirements: false,
                    error: error instanceof Error ? error.message : "Processing failed",
                });
                failedCount++;
            }
        }

        return NextResponse.json({
            success: true,
            total: verifications.length,
            verified: verifiedCount,
            failed: failedCount,
            results,
        });

    } catch (error) {
        console.error("[Batch Verify] Error:", error);
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
 * GET - Returns batch verification info
 */
export async function GET() {
    return NextResponse.json({
        endpoint: "/api/verifier/batch-verify",
        method: "POST",
        description: "Batch verification for multiple credentials",
        maxBatchSize: 100,
        requestFormat: {
            verifications: [
                {
                    claimId: "string (required)",
                    requirements: {
                        isGraduated: "boolean (optional)",
                        minCibilScore: "number (optional)",
                        skillSet: "string (optional)",
                    },
                },
            ],
        },
    });
}
