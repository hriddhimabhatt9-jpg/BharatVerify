import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * GET /api/schemas/[filename]
 * Serves credential schema files for the Privado ID Issuer Node
 */
export async function GET(
    request: Request,
    { params }: { params: { filename: string } }
) {
    try {
        const filename = params.filename;

        // Security: Only allow specific schema files
        const allowedFiles = [
            "IndianWorkforceCredential.json",
            "IndianWorkforceCredential.jsonld",
            "KYCAgeCredential-v4.json",
            "kyc-v4.jsonld"
        ];

        if (!allowedFiles.includes(filename)) {
            return NextResponse.json(
                { error: "Schema not found" },
                { status: 404 }
            );
        }

        // Read the schema file from public/schemas
        const schemaPath = path.join(process.cwd(), "public", "schemas", filename);

        if (!fs.existsSync(schemaPath)) {
            return NextResponse.json(
                { error: "Schema file not found" },
                { status: 404 }
            );
        }

        const schemaContent = fs.readFileSync(schemaPath, "utf-8");
        const schema = JSON.parse(schemaContent);

        // Return the schema with proper Content-Type
        return NextResponse.json(schema, {
            headers: {
                "Content-Type": filename.endsWith(".jsonld")
                    ? "application/ld+json"
                    : "application/json",
                "Access-Control-Allow-Origin": "*", // Allow Issuer Node to access
            },
        });
    } catch (error) {
        console.error("Error serving schema:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
