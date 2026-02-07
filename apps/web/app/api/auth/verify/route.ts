/**
 * POST /api/auth/verify
 * 
 * Verify a session token.
 * 
 * --- Request ---
 * Header: Authorization: Bearer <session-id>
 * OR
 * Body: { sessionId: string }
 * 
 * --- Response ---
 * { valid: boolean, session?: SessionInfo }
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthService } from "@/lib/services/AuthService";

export async function POST(request: NextRequest) {
    try {
        const authService = getAuthService();

        // Try to get session ID from header
        let sessionId = request.headers.get("authorization")?.replace("Bearer ", "");

        // Fallback to body
        if (!sessionId) {
            try {
                const body = await request.json();
                sessionId = body.sessionId;
            } catch {
                // No body or invalid JSON
            }
        }

        if (!sessionId) {
            return NextResponse.json(
                { valid: false, error: "Session ID required" },
                { status: 400 }
            );
        }

        const session = authService.validateSession(sessionId);

        if (!session) {
            return NextResponse.json({ valid: false });
        }

        return NextResponse.json({
            valid: true,
            session: {
                id: session.id,
                type: session.type,
                did: session.did,
                createdAt: session.createdAt.toISOString(),
                expiresAt: session.expiresAt.toISOString(),
            },
        });

    } catch (error) {
        console.error("[Auth Verify] Error:", error);
        return NextResponse.json(
            { valid: false, error: "Verification failed" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    // Validate session from Authorization header
    const authService = getAuthService();
    const sessionId = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!sessionId) {
        return NextResponse.json({ valid: false }, { status: 401 });
    }

    const session = authService.validateSession(sessionId);

    if (!session) {
        return NextResponse.json({ valid: false }, { status: 401 });
    }

    return NextResponse.json({
        valid: true,
        session: {
            id: session.id,
            type: session.type,
            did: session.did,
            expiresAt: session.expiresAt.toISOString(),
        },
    });
}
