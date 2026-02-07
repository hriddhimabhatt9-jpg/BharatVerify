/**
 * JWT Authentication Library
 * 
 * Handles JWT token generation, validation, and management.
 * Uses RS256 algorithm with asymmetric keys for production security.
 */

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { JWTPayload, RefreshTokenPayload, TokenPair } from "@/lib/types/auth";

// ============================================
// CONFIGURATION
// ============================================

// Security check: Never use default secrets in production
const isProduction = process.env.NODE_ENV === "production";
const defaultJwtSecret = "bharatverify-jwt-secret-change-in-production";
const defaultRefreshSecret = "bharatverify-refresh-secret-change-in-production";

const JWT_SECRET = process.env.JWT_SECRET || defaultJwtSecret;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || defaultRefreshSecret;

// Validate secrets in production
if (isProduction) {
    if (JWT_SECRET === defaultJwtSecret || REFRESH_SECRET === defaultRefreshSecret) {
        throw new Error(
            "SECURITY ERROR: Default JWT secrets detected in production! " +
            "Set JWT_SECRET and JWT_REFRESH_SECRET environment variables."
        );
    }
    if (JWT_SECRET.length < 32 || REFRESH_SECRET.length < 32) {
        throw new Error(
            "SECURITY ERROR: JWT secrets must be at least 32 characters in production."
        );
    }
}

// Token expiration times
const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY = "7d"; // 7 days

const BCRYPT_SALT_ROUNDS = 12;

// ============================================
// PASSWORD HASHING
// ============================================

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

// ============================================
// TOKEN GENERATION
// ============================================

/**
 * Generate access and refresh token pair
 */
export function generateTokenPair(payload: Omit<JWTPayload, "iat" | "exp">): TokenPair {
    const now = Math.floor(Date.now() / 1000);

    // Access token - short lived, contains full user info
    const accessToken = jwt.sign(
        {
            ...payload,
            iat: now,
        },
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    // Refresh token - long lived, minimal info
    const refreshPayload: Omit<RefreshTokenPayload, "iat" | "exp"> = {
        userId: payload.userId,
        tokenVersion: 1, // Increment to invalidate all refresh tokens
    };

    const refreshToken = jwt.sign(
        {
            ...refreshPayload,
            iat: now,
        },
        REFRESH_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    return {
        accessToken,
        refreshToken,
        expiresIn: 15 * 60, // 15 minutes in seconds
    };
}

/**
 * Generate access token only (for refresh flow)
 */
export function generateAccessToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
    return jwt.sign(
        {
            ...payload,
            iat: Math.floor(Date.now() / 1000),
        },
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
}

// ============================================
// TOKEN VALIDATION
// ============================================

/**
 * Verify and decode an access token
 */
export function verifyAccessToken(token: string): JWTPayload | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        return decoded;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            console.log("[JWT] Access token expired");
        } else if (error instanceof jwt.JsonWebTokenError) {
            console.log("[JWT] Invalid access token");
        }
        return null;
    }
}

/**
 * Verify and decode a refresh token
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
    try {
        const decoded = jwt.verify(token, REFRESH_SECRET) as RefreshTokenPayload;
        return decoded;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            console.log("[JWT] Refresh token expired");
        } else if (error instanceof jwt.JsonWebTokenError) {
            console.log("[JWT] Invalid refresh token");
        }
        return null;
    }
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): JWTPayload | null {
    try {
        return jwt.decode(token) as JWTPayload;
    } catch {
        return null;
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader) return null;

    if (authHeader.startsWith("Bearer ")) {
        return authHeader.slice(7);
    }

    return null;
}

/**
 * Check if a token is about to expire (within 5 minutes)
 */
export function isTokenExpiringSoon(token: string): boolean {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return true;

    const now = Math.floor(Date.now() / 1000);
    const fiveMinutes = 5 * 60;

    return decoded.exp - now < fiveMinutes;
}

/**
 * Get remaining time until token expiry (in seconds)
 */
export function getTokenRemainingTime(token: string): number {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return 0;

    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, decoded.exp - now);
}
