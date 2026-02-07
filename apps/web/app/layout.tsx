import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

export const metadata: Metadata = {
    title: "BharatVerify - Decentralized Identity for India's Workforce",
    description:
        "Privacy-preserving credential verification powered by Zero-Knowledge Proofs and Blockchain technology. Verify degrees, skills, and employment history without exposing personal data.",
    keywords: [
        "BharatVerify",
        "Decentralized Identity",
        "ZK Proofs",
        "Verifiable Credentials",
        "India Workforce",
        "Privado ID",
        "Polygon",
        "Blockchain Verification",
    ],
    authors: [{ name: "BharatVerify Team" }],
    openGraph: {
        title: "BharatVerify - Decentralized Identity Platform",
        description: "Privacy-preserving credential verification for India's workforce",
        type: "website",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={inter.variable}>
            <head>
                <link rel="icon" href="/favicon.ico" sizes="any" />
            </head>
            <body className={`${inter.className} antialiased`}>{children}</body>
        </html>
    );
}
