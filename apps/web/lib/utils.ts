import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { createHash } from "crypto";

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * maskAadhaar - Privacy-preserving Aadhaar hashing
 * 
 * This function takes an Aadhaar number and returns a salted SHA-256 hash.
 * The original Aadhaar number is NEVER stored or transmitted—only the hash
 * is used in credentials.
 * 
 * --- Privacy Context ---
 * India's Aadhaar is a sensitive 12-digit ID. By hashing it before 
 * including in Verifiable Credentials, we ensure:
 * 1. The actual Aadhaar cannot be reverse-engineered from the hash
 * 2. The hash can still be used to verify identity claims
 * 3. Compliance with data minimization principles
 * 
 * @param aadhaarNumber - The raw 12-digit Aadhaar number (string)
 * @param salt - Optional salt for additional security (defaults to env variable)
 * @returns SHA-256 hash of the salted Aadhaar number
 */
export function maskAadhaar(
    aadhaarNumber: string,
    salt: string = process.env.AADHAAR_HASH_SALT || "bharat-verify-default-salt"
): string {
    // Validate Aadhaar format (12 digits)
    const cleanAadhaar = aadhaarNumber.replace(/\s/g, "");
    if (!/^\d{12}$/.test(cleanAadhaar)) {
        throw new Error("Invalid Aadhaar format. Must be 12 digits.");
    }

    // Create salted hash
    const hash = createHash("sha256");
    hash.update(salt + cleanAadhaar);
    return hash.digest("hex");
}

/**
 * maskAadhaarDisplay - Format Aadhaar for partial display
 * 
 * Shows only the last 4 digits: XXXX XXXX 1234
 * Used for UI display purposes only.
 * 
 * @param aadhaarNumber - The raw 12-digit Aadhaar number
 * @returns Masked display string
 */
export function maskAadhaarDisplay(aadhaarNumber: string): string {
    const cleanAadhaar = aadhaarNumber.replace(/\s/g, "");
    if (!/^\d{12}$/.test(cleanAadhaar)) {
        throw new Error("Invalid Aadhaar format. Must be 12 digits.");
    }

    const lastFour = cleanAadhaar.slice(-4);
    return `XXXX XXXX ${lastFour}`;
}

/**
 * generateReferenceId - Generate a unique reference ID for credentials
 * 
 * Format: BV-{TIMESTAMP}-{RANDOM}
 * Example: BV-1707235200000-A3B2C1
 * 
 * @returns Unique reference ID string
 */
export function generateReferenceId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `BV-${timestamp}-${random}`;
}

/**
 * formatDate - Format date for display in Indian format
 * @param date - Date object or ISO string
 * @returns Formatted date string (DD/MM/YYYY)
 */
export function formatDate(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

/**
 * truncateAddress - Truncate Ethereum address for display
 * @param address - Full Ethereum address
 * @returns Truncated address (0x1234...5678)
 */
export function truncateAddress(address: string): string {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * sleep - Promise-based delay utility
 * @param ms - Milliseconds to wait
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
