/**
 * GET /api/issuer/claim-qr/[id]
 * 
 * API endpoint to retrieve QR code data for a specific claim.
 * Users scan this QR with their Privado ID wallet to receive the credential.
 * 
 * --- URL Parameters ---
 * id: The claim ID returned from create-claim
 * 
 * --- Response ---
 * {
 *   success: boolean,
 *   qrData?: string,      // JSON payload for QR generation
 *   status?: string,      // "pending" | "issued" | "revoked"
 *   error?: string
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { getCredentialService } from "@/lib/services/CredentialService";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const claimId = params.id;

        if (!claimId) {
            return NextResponse.json(
                { success: false, error: "Claim ID is required" },
                { status: 400 }
            );
        }

        const credentialService = getCredentialService();
        const claim = await credentialService.getClaim(claimId);

        if (!claim) {
            return NextResponse.json(
                { success: false, error: "Claim not found" },
                { status: 404 }
            );
        }

        // Generate fresh QR payload
        const qrPayload = {
            id: claimId,
            typ: "application/iden3comm-plain-json",
            type: "https://iden3-communication.io/credentials/1.0/offer",
            thid: claimId,
            body: {
                url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/issuer/claim/${claimId}`,
                credentials: [
                    {
                        id: claim.credential.id,
                        description: `IndianWorkforceCredential - ${claim.credential.credentialSubject.skillSet}`,
                    },
                ],
            },
            from: claim.credential.issuer,
            to: claim.credential.credentialSubject.id,
        };

        return NextResponse.json({
            success: true,
            qrData: JSON.stringify(qrPayload),
            status: claim.status,
            referenceId: claim.credential.credentialSubject.referenceId,
            createdAt: claim.createdAt.toISOString(),
        });

    } catch (error) {
        console.error("Error fetching claim QR:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Internal server error"
            },
            { status: 500 }
        );
    }
}
