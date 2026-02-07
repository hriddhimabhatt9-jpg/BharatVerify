"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { GlassButton } from "@/components/ui";

export default function HomePage() {
    return (
        <div className="min-h-screen animated-bg overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute -top-40 -right-40 w-96 h-96 bg-sky-200 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{ duration: 10, repeat: Infinity, delay: 1 }}
                    className="absolute top-1/2 -left-40 w-80 h-80 bg-violet-200 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.2, 0.3, 0.2],
                    }}
                    transition={{ duration: 6, repeat: Infinity, delay: 2 }}
                    className="absolute -bottom-20 right-1/4 w-72 h-72 bg-emerald-200 rounded-full blur-3xl"
                />
            </div>

            {/* Navigation */}
            <nav className="relative z-50">
                <motion.header
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    className="glass-card-strong mx-4 mt-4 px-6 py-4 flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/30">
                            <span className="text-white font-bold text-lg">B</span>
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-sky-600 to-blue-700 bg-clip-text text-transparent">
                            BharatVerify
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
                            Features
                        </Link>
                        <Link href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
                            How It Works
                        </Link>
                        <Link href="#security" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
                            Security
                        </Link>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href="/issuer">
                            <GlassButton variant="glass" size="sm">
                                Issuer Portal
                            </GlassButton>
                        </Link>
                        <Link href="/verifier">
                            <GlassButton variant="primary" size="sm">
                                Verify Now
                            </GlassButton>
                        </Link>
                    </div>
                </motion.header>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 px-4 pt-20 pb-32">
                <div className="max-w-6xl mx-auto text-center">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-xl border border-white/80 rounded-full text-sm font-medium text-gray-700 shadow-lg mb-8"
                    >
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Powered by Privado ID & Polygon Blockchain
                    </motion.div>

                    {/* Main Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight mb-6"
                    >
                        Decentralized Identity
                        <br />
                        <span className="bg-gradient-to-r from-sky-500 via-blue-600 to-violet-600 bg-clip-text text-transparent">
                            for India's Workforce
                        </span>
                    </motion.h1>

                    {/* Subheadline */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="text-xl text-gray-600 max-w-2xl mx-auto mb-10"
                    >
                        Privacy-preserving credential verification using Zero-Knowledge Proofs.
                        Prove your qualifications without exposing personal data.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="flex flex-wrap items-center justify-center gap-4"
                    >
                        <Link href="/issuer">
                            <GlassButton variant="primary" size="lg">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Issue Credentials
                            </GlassButton>
                        </Link>
                        <Link href="/verifier">
                            <GlassButton variant="glass" size="lg">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                Verify Credentials
                            </GlassButton>
                        </Link>
                    </motion.div>

                    {/* Trust Indicators */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="mt-16 flex flex-wrap items-center justify-center gap-8 text-gray-400 text-sm"
                    >
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            Privacy First
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Government Verified
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Instant Verification
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="relative z-10 px-4 py-20">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Why Choose BharatVerify?
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Built on cutting-edge blockchain technology with privacy at its core
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                icon: (
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                ),
                                title: "Zero-Knowledge Proofs",
                                description: "Prove your qualifications without revealing sensitive data. Only the verification result is shared.",
                                gradient: "from-sky-400 to-blue-500",
                            },
                            {
                                icon: (
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                ),
                                title: "Government Trust Layer",
                                description: "Only authorized institutions can issue credentials. Verified on-chain through IssuerRegistry.",
                                gradient: "from-emerald-400 to-green-500",
                            },
                            {
                                icon: (
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                ),
                                title: "Mobile-First Experience",
                                description: "Credentials stored in your Privado ID wallet. Scan QR codes to instantly verify.",
                                gradient: "from-violet-400 to-purple-500",
                            },
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="glass-card p-8"
                            >
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-6 shadow-lg`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="relative z-10 px-4 py-20">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            How It Works
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Simple three-step process for credential issuance and verification
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                step: "01",
                                title: "Issue Credential",
                                description: "Universities and ITIs issue verifiable credentials to graduates with their Aadhaar-linked data.",
                            },
                            {
                                step: "02",
                                title: "Store in Wallet",
                                description: "Graduates scan QR code with Privado ID wallet and securely store their credentials.",
                            },
                            {
                                step: "03",
                                title: "Verify Instantly",
                                description: "Employers generate proof requests. Candidates prove qualifications without exposing data.",
                            },
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.15 }}
                                className="relative"
                            >
                                <div className="liquid-glass p-8 h-full">
                                    <span className="text-6xl font-bold bg-gradient-to-r from-sky-200 to-blue-200 bg-clip-text text-transparent">
                                        {item.step}
                                    </span>
                                    <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-3">
                                        {item.title}
                                    </h3>
                                    <p className="text-gray-600">
                                        {item.description}
                                    </p>
                                </div>
                                {idx < 2 && (
                                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-sky-300 to-transparent" />
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative z-10 px-4 py-20">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto liquid-glass p-12 text-center"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Ready to Get Started?
                    </h2>
                    <p className="text-gray-600 mb-8 max-w-xl mx-auto">
                        Join the future of credential verification in India.
                        Issue your first credential or verify a candidate today.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Link href="/issuer">
                            <GlassButton variant="primary" size="lg">
                                Get Started as Issuer
                            </GlassButton>
                        </Link>
                        <Link href="/verifier">
                            <GlassButton variant="secondary" size="lg">
                                Start Verifying
                            </GlassButton>
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 glass-card mx-4 mb-4 px-8 py-8">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/30">
                            <span className="text-white font-bold text-sm">B</span>
                        </div>
                        <span className="font-semibold text-gray-700">BharatVerify</span>
                    </div>

                    <p className="text-sm text-gray-500">
                        © 2024 BharatVerify. Powered by Privado ID & Polygon.
                    </p>

                    <div className="flex items-center gap-6 text-sm text-gray-500">
                        <Link href="#" className="hover:text-gray-700 transition-colors">
                            Privacy
                        </Link>
                        <Link href="#" className="hover:text-gray-700 transition-colors">
                            Terms
                        </Link>
                        <Link href="#" className="hover:text-gray-700 transition-colors">
                            GitHub
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
