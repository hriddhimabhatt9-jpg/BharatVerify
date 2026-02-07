"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// Types
interface CredentialInfo {
    id: string;
    referenceId: string;
    fullName: string;
    skillSet: string;
    isGraduated: boolean;
    institutionName?: string;
    degreeTitle?: string;
    status: "pending" | "issued" | "revoked";
    createdAt: string;
    issuedAt?: string;
}

// Icons
const CredentialIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
);

const SearchIcon = () => (
    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

export default function HolderCredentialsPage() {
    const [did, setDid] = useState<string>("");
    const [credentials, setCredentials] = useState<CredentialInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const [searched, setSearched] = useState(false);

    const handleSearch = async () => {
        if (!did.trim()) {
            setError("Please enter your DID");
            return;
        }

        setIsLoading(true);
        setError("");
        setSearched(true);

        try {
            const response = await fetch(`/api/holder/credentials?did=${encodeURIComponent(did)}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch credentials");
            }

            setCredentials(data.credentials || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
            setCredentials([]);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "issued": return "bg-emerald-100 text-emerald-700";
            case "pending": return "bg-amber-100 text-amber-700";
            case "revoked": return "bg-red-100 text-red-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    return (
        <div className="min-h-screen animated-bg">
            {/* Header */}
            <header className="glass-card-strong sticky top-0 z-50 mx-4 mt-4 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            whileHover={{ scale: 1.05 }}
                            className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/30 cursor-pointer"
                        >
                            <span className="text-white font-bold text-lg">B</span>
                        </motion.div>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">My Credentials</h1>
                        <p className="text-xs text-gray-500">View your issued credentials</p>
                    </div>
                </div>

                <nav className="flex items-center gap-2">
                    <Link href="/">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200 hover:bg-white/80 transition-colors"
                        >
                            Home
                        </motion.button>
                    </Link>
                </nav>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                {/* Search Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card-strong rounded-2xl p-6 mb-8"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center">
                            <CredentialIcon />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Find Your Credentials</h2>
                            <p className="text-sm text-gray-500">Enter your DID to view issued credentials</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={did}
                                onChange={(e) => setDid(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                placeholder="did:polygonid:polygon:amoy:..."
                                className="w-full px-4 py-3 pl-12 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all text-sm font-mono"
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                <SearchIcon />
                            </div>
                        </div>
                        <motion.button
                            onClick={handleSearch}
                            disabled={isLoading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-medium rounded-xl shadow-lg shadow-sky-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Searching..." : "Search"}
                        </motion.button>
                    </div>

                    {error && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-3 text-sm text-red-600"
                        >
                            {error}
                        </motion.p>
                    )}

                    {/* Help Text */}
                    <p className="mt-4 text-xs text-gray-400">
                        💡 Find your DID in the Privado ID app under Settings → My DID
                    </p>
                </motion.div>

                {/* Credentials List */}
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex justify-center py-12"
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full"
                            />
                        </motion.div>
                    ) : searched && credentials.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-center py-12"
                        >
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No credentials found</h3>
                            <p className="text-sm text-gray-500">Make sure you entered the correct DID</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="credentials"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            {credentials.map((cred, index) => (
                                <motion.div
                                    key={cred.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="glass-card rounded-2xl p-6 hover:shadow-lg transition-shadow"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-100 to-sky-200 flex items-center justify-center">
                                                <CredentialIcon />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{cred.fullName}</h3>
                                                <p className="text-sm text-gray-500">{cred.skillSet}</p>
                                                {cred.institutionName && (
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {cred.degreeTitle} • {cred.institutionName}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(cred.status)}`}>
                                            {cred.status}
                                        </span>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                                        <span>Ref: {cred.referenceId}</span>
                                        <span>
                                            {cred.status === "issued" && cred.issuedAt
                                                ? `Issued: ${new Date(cred.issuedAt).toLocaleDateString()}`
                                                : `Created: ${new Date(cred.createdAt).toLocaleDateString()}`
                                            }
                                        </span>
                                    </div>

                                    {/* Graduation Badge */}
                                    {cred.isGraduated && (
                                        <div className="mt-3 inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-lg">
                                            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="text-xs text-emerald-700 font-medium">Graduated</span>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Info Box */}
                {!searched && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-8 p-6 bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border border-violet-100"
                    >
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">How it works</h3>
                        <ol className="space-y-3 text-sm text-gray-600">
                            <li className="flex items-start gap-2">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold">1</span>
                                <span>An issuer (university/employer) creates a credential for you</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold">2</span>
                                <span>Scan the QR code with Privado ID app to claim it</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold">3</span>
                                <span>Use this page to view your credential status anytime</span>
                            </li>
                        </ol>
                    </motion.div>
                )}
            </main>

            {/* Footer */}
            <footer className="glass-card mx-4 mb-4 mt-8 px-6 py-4 text-center text-sm text-gray-500">
                <p>BharatVerify © 2024 • Powered by Privado ID & Polygon</p>
            </footer>
        </div>
    );
}
