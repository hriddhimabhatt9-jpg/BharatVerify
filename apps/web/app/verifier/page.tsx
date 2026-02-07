"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    BentoCard,
    BentoGrid,
    StatCard,
    GlassInput,
    GlassSelect,
    GlassButton,
    QRCodeDisplay,
} from "@/components/ui";

// Icons
const ShieldCheckIcon = () => (
    <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
);

const ClockIcon = () => (
    <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const UserGroupIcon = () => (
    <svg className="w-6 h-6 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

const LockClosedIcon = () => (
    <svg className="w-6 h-6 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

// Verification types
const verificationTypes = [
    { value: "", label: "Select verification type..." },
    { value: "graduated", label: "Graduation Status" },
    { value: "degree", label: "Specific Degree" },
    { value: "age", label: "Minimum Age" },
    { value: "cibil", label: "Credit Score (CIBIL)" },
    { value: "skill", label: "Specific Skill" },
    { value: "custom", label: "Custom Query" },
];

const degreeOptions = [
    { value: "", label: "Select degree..." },
    { value: "B.Tech", label: "B.Tech" },
    { value: "M.Tech", label: "M.Tech" },
    { value: "B.E.", label: "B.E." },
    { value: "MBA", label: "MBA" },
    { value: "B.Sc", label: "B.Sc" },
    { value: "M.Sc", label: "M.Sc" },
    { value: "BCA", label: "BCA" },
    { value: "MCA", label: "MCA" },
    { value: "PhD", label: "PhD" },
];

const skillOptions = [
    { value: "", label: "Select skill..." },
    { value: "Software Engineering", label: "Software Engineering" },
    { value: "Data Science", label: "Data Science" },
    { value: "Web Development", label: "Web Development" },
    { value: "Mobile Development", label: "Mobile Development" },
    { value: "Cloud Computing", label: "Cloud Computing" },
    { value: "Cybersecurity", label: "Cybersecurity" },
    { value: "Machine Learning", label: "Machine Learning" },
    { value: "DevOps", label: "DevOps" },
];

interface VerificationForm {
    verificationType: string;
    degreeType: string;
    minAge: string;
    minCibilScore: string;
    requiredSkill: string;
    reason: string;
}

const initialFormState: VerificationForm = {
    verificationType: "",
    degreeType: "",
    minAge: "",
    minCibilScore: "",
    requiredSkill: "",
    reason: "",
};

interface VerificationResult {
    requestId: string;
    status: "pending" | "verified" | "failed" | "expired";
    holderDid?: string;
    issuerAuthorized?: boolean;
    verifiedAt?: string;
}

interface OrgData {
    id: string;
    name: string;
    type: string;
    isAuthorizedOnChain: boolean;
}

export default function VerifierDashboard() {
    const router = useRouter();
    const [formData, setFormData] = useState<VerificationForm>(initialFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [qrData, setQrData] = useState<string>("");
    const [deepLink, setDeepLink] = useState<string>("");
    const [requestId, setRequestId] = useState<string>("");
    const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
    const [error, setError] = useState<string>("");
    const [isPolling, setIsPolling] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [organization, setOrganization] = useState<OrgData | null>(null);

    // Stats
    const [stats, setStats] = useState({
        totalVerifications: 0,
        successRate: 0,
        pendingRequests: 0,
    });

    // Check auth on mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem("accessToken");
            const userData = localStorage.getItem("user");

            if (!token || !userData) {
                router.push("/login");
                return;
            }

            try {
                const user = JSON.parse(userData);
                if (user.role !== "verifier" && user.role !== "admin") {
                    router.push("/pending");
                    return;
                }

                setOrganization(user.organization);
            } catch {
                router.push("/login");
                return;
            }

            setIsLoading(false);
        };

        checkAuth();
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        router.push("/login");
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");
        setVerificationResult(null);

        try {
            const conditions: Record<string, any> = {};

            switch (formData.verificationType) {
                case "graduated":
                    conditions.isGraduated = true;
                    break;
                case "degree":
                    conditions.degreeType = formData.degreeType;
                    break;
                case "age":
                    conditions.minAge = parseInt(formData.minAge);
                    break;
                case "cibil":
                    conditions.minCibilScore = parseInt(formData.minCibilScore);
                    break;
                case "skill":
                    conditions.requiredSkills = [formData.requiredSkill];
                    break;
            }

            const response = await fetch("/api/verifier/generate-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    verificationType: formData.verificationType,
                    conditions,
                    verifierId: `verifier-${Date.now()}`,
                    reason: formData.reason || `Verification: ${formData.verificationType}`,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Failed to generate verification request");
            }

            setQrData(data.qrData);
            setDeepLink(data.deepLink);
            setRequestId(data.requestId);

            // Start polling for verification result
            startPolling(data.requestId);

        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    }, [formData]);

    const startPolling = async (reqId: string) => {
        setIsPolling(true);
        let attempts = 0;
        const maxAttempts = 60; // Poll for 5 minutes (5s intervals)

        const poll = async () => {
            if (attempts >= maxAttempts) {
                setIsPolling(false);
                setVerificationResult({
                    requestId: reqId,
                    status: "expired",
                });
                return;
            }

            try {
                const response = await fetch(`/api/verifier/status/${reqId}`);
                const data = await response.json();

                if (data.success && data.status !== "pending") {
                    setIsPolling(false);
                    setVerificationResult({
                        requestId: reqId,
                        status: data.status,
                        holderDid: data.result?.holderDid,
                        issuerAuthorized: data.result?.issuerAuthorized,
                        verifiedAt: data.result?.verifiedAt,
                    });
                    return;
                }

                attempts++;
                setTimeout(poll, 5000);
            } catch {
                attempts++;
                setTimeout(poll, 5000);
            }
        };

        poll();
    };

    const handleReset = () => {
        setFormData(initialFormState);
        setQrData("");
        setDeepLink("");
        setRequestId("");
        setVerificationResult(null);
        setError("");
        setIsPolling(false);
    };

    const getVerificationTypeLabel = () => {
        const type = verificationTypes.find((t) => t.value === formData.verificationType);
        return type?.label || "Verification";
    };

    if (isLoading) {
        return (
            <div className="min-h-screen animated-bg flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"
                />
            </div>
        );
    }

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
                            className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 cursor-pointer"
                        >
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </motion.div>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">
                            {organization?.name || "BharatVerify"}
                        </h1>
                        <p className="text-xs text-gray-500">Verifier Dashboard</p>
                    </div>
                </div>

                <nav className="flex items-center gap-2">
                    <GlassButton variant="glass" size="sm" onClick={handleLogout}>
                        Logout
                    </GlassButton>
                    <Link href="/issuer">
                        <GlassButton variant="glass" size="sm">
                            Issuer Portal
                        </GlassButton>
                    </Link>
                </nav>
            </header>

            {/* Main Content */}
            <main className="max-w-[1800px] mx-auto px-4 py-6">
                <BentoGrid className="gap-5">
                    {/* Stats Row */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bento-span-4"
                    >
                        <StatCard
                            value={stats.totalVerifications.toLocaleString()}
                            label="Total Verifications"
                            variant="primary"
                            icon={<UserGroupIcon />}
                            trend={{ value: 18, positive: true }}
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bento-span-4"
                    >
                        <StatCard
                            value={`${stats.successRate}%`}
                            label="Success Rate"
                            variant="success"
                            icon={<ShieldCheckIcon />}
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bento-span-4"
                    >
                        <StatCard
                            value={stats.pendingRequests}
                            label="Pending Requests"
                            variant="warning"
                            icon={<ClockIcon />}
                        />
                    </motion.div>

                    {/* Verification Request Form */}
                    <BentoCard
                        title="Create Verification Request"
                        subtitle="Generate a ZK-proof request for candidate verification"
                        span={8}
                        variant="strong"
                        icon={<LockClosedIcon />}
                        animationDelay={0.4}
                    >
                        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                            {/* Error Message */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
                                    >
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Verification Type Selection */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <GlassSelect
                                    label="Verification Type"
                                    name="verificationType"
                                    value={formData.verificationType}
                                    onChange={handleInputChange}
                                    options={verificationTypes}
                                />

                                {/* Conditional Fields Based on Type */}
                                {formData.verificationType === "degree" && (
                                    <GlassSelect
                                        label="Required Degree"
                                        name="degreeType"
                                        value={formData.degreeType}
                                        onChange={handleInputChange}
                                        options={degreeOptions}
                                    />
                                )}

                                {formData.verificationType === "age" && (
                                    <GlassInput
                                        label="Minimum Age"
                                        name="minAge"
                                        type="number"
                                        value={formData.minAge}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 18"
                                        min="1"
                                        max="120"
                                    />
                                )}

                                {formData.verificationType === "cibil" && (
                                    <GlassInput
                                        label="Minimum CIBIL Score"
                                        name="minCibilScore"
                                        type="number"
                                        value={formData.minCibilScore}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 700"
                                        min="300"
                                        max="900"
                                    />
                                )}

                                {formData.verificationType === "skill" && (
                                    <GlassSelect
                                        label="Required Skill"
                                        name="requiredSkill"
                                        value={formData.requiredSkill}
                                        onChange={handleInputChange}
                                        options={skillOptions}
                                    />
                                )}
                            </div>

                            {/* Reason Field */}
                            <GlassInput
                                label="Verification Reason (Optional)"
                                name="reason"
                                value={formData.reason}
                                onChange={handleInputChange}
                                placeholder="e.g., Job application for Software Engineer position"
                            />

                            {/* Privacy Notice */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-xl"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-violet-100">
                                        <LockClosedIcon />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-violet-900 mb-1">Privacy Guaranteed</h4>
                                        <p className="text-sm text-violet-700">
                                            Zero-Knowledge Proofs ensure you only receive proof of the claim, never the underlying data.
                                            The candidate controls what information is shared.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <GlassButton
                                    type="submit"
                                    variant="success"
                                    size="lg"
                                    isLoading={isSubmitting}
                                    className="flex-1"
                                    disabled={!formData.verificationType}
                                >
                                    Generate Verification Request
                                </GlassButton>
                                <GlassButton
                                    type="button"
                                    variant="glass"
                                    size="lg"
                                    onClick={handleReset}
                                >
                                    Reset
                                </GlassButton>
                            </div>
                        </form>
                    </BentoCard>

                    {/* QR Code / Verification Status */}
                    <BentoCard
                        title="Verification QR"
                        subtitle="Candidate scans to submit proof"
                        span={4}
                        variant="liquid"
                        animationDelay={0.5}
                    >
                        <div className="flex flex-col items-center justify-center min-h-[400px]">
                            {/* Verification Result */}
                            {verificationResult ? (
                                <VerificationResultDisplay result={verificationResult} />
                            ) : (
                                <>
                                    <QRCodeDisplay
                                        data={qrData}
                                        size={200}
                                        title={qrData ? getVerificationTypeLabel() : undefined}
                                        deepLink={deepLink}
                                    />
                                    {isPolling && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="mt-4 flex items-center gap-2 text-sm text-gray-500"
                                        >
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                className="w-4 h-4 border-2 border-sky-200 border-t-sky-500 rounded-full"
                                            />
                                            Waiting for verification...
                                        </motion.div>
                                    )}
                                </>
                            )}
                            {requestId && !verificationResult && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mt-4 text-xs text-gray-400 font-mono"
                                >
                                    Request ID: {requestId.slice(0, 20)}...
                                </motion.p>
                            )}
                        </div>
                    </BentoCard>

                    {/* What Can be Verified */}
                    <BentoCard
                        title="Verification Capabilities"
                        subtitle="ZK-Proof supported queries"
                        span={6}
                        variant="default"
                        animationDelay={0.6}
                    >
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            {[
                                { icon: "🎓", title: "Graduation", desc: "Verify without revealing institution" },
                                { icon: "📊", title: "CIBIL Score", desc: "Check score range, not exact value" },
                                { icon: "📅", title: "Age Proof", desc: "Verify age without revealing DOB" },
                                { icon: "💼", title: "Skills", desc: "Confirm specific qualifications" },
                                { icon: "🏛️", title: "Institution", desc: "Verify specific degree types" },
                                { icon: "✅", title: "Issuer Trust", desc: "On-chain government verification" },
                            ].map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 + idx * 0.05 }}
                                    className="p-4 bg-white/40 rounded-xl hover:bg-white/60 transition-colors"
                                >
                                    <span className="text-2xl mb-2 block">{item.icon}</span>
                                    <h4 className="font-medium text-gray-900 text-sm">{item.title}</h4>
                                    <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </BentoCard>

                    {/* Recent Verifications */}
                    <BentoCard
                        title="Recent Verifications"
                        subtitle="Latest verification requests and results"
                        span={6}
                        variant="default"
                        animationDelay={0.7}
                    >
                        <div className="mt-4 space-y-3">
                            {[
                                { type: "Graduation Status", candidate: "did:***7a3f", status: "verified", time: "5 min ago" },
                                { type: "Age > 21", candidate: "did:***9b2c", status: "verified", time: "12 min ago" },
                                { type: "CIBIL > 700", candidate: "did:***3e1a", status: "pending", time: "18 min ago" },
                                { type: "B.Tech Degree", candidate: "did:***8d4f", status: "verified", time: "1 hour ago" },
                                { type: "Software Engineering", candidate: "did:***2c5b", status: "failed", time: "2 hours ago" },
                            ].map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.7 + idx * 0.1 }}
                                    className="flex items-center justify-between p-3 bg-white/40 rounded-xl"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${item.status === "verified" ? "bg-emerald-500" :
                                            item.status === "pending" ? "bg-amber-500" : "bg-red-500"
                                            }`} />
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm">{item.type}</p>
                                            <p className="text-xs text-gray-400 font-mono">{item.candidate}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`
                      inline-flex px-2 py-1 rounded-full text-xs font-medium
                      ${item.status === "verified" ? "bg-emerald-100 text-emerald-700" :
                                                item.status === "pending" ? "bg-amber-100 text-amber-700" :
                                                    "bg-red-100 text-red-700"}
                    `}>
                                            {item.status}
                                        </span>
                                        <p className="text-xs text-gray-400 mt-1">{item.time}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </BentoCard>
                </BentoGrid>
            </main>

            {/* Footer */}
            <footer className="glass-card mx-4 mb-4 mt-8 px-6 py-4 text-center text-sm text-gray-500">
                <p>BharatVerify © 2024 • Zero-Knowledge Verification powered by Privado ID</p>
            </footer>
        </div>
    );
}

/**
 * Verification Result Display Component
 */
function VerificationResultDisplay({ result }: { result: VerificationResult }) {
    const isSuccess = result.status === "verified";
    const isExpired = result.status === "expired";
    const isFailed = result.status === "failed";

    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center text-center p-6"
        >
            {/* Status Icon */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className={`
          w-24 h-24 rounded-full flex items-center justify-center mb-6
          ${isSuccess ? "bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg shadow-emerald-500/40" :
                        isExpired ? "bg-gradient-to-br from-gray-400 to-gray-500 shadow-lg shadow-gray-500/40" :
                            "bg-gradient-to-br from-red-400 to-rose-500 shadow-lg shadow-red-500/40"}
        `}
            >
                {isSuccess ? (
                    <motion.svg
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="w-12 h-12 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <motion.path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                        />
                    </motion.svg>
                ) : isExpired ? (
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                ) : (
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                )}
            </motion.div>

            {/* Status Text */}
            <h3 className={`text-2xl font-bold mb-2 ${isSuccess ? "text-emerald-600" : isExpired ? "text-gray-600" : "text-red-600"
                }`}>
                {isSuccess ? "Verified!" : isExpired ? "Request Expired" : "Verification Failed"}
            </h3>

            <p className="text-gray-500 text-sm mb-4">
                {isSuccess
                    ? "The candidate's credentials have been verified"
                    : isExpired
                        ? "The verification request has expired"
                        : "The verification could not be completed"}
            </p>

            {/* Details */}
            {isSuccess && result.holderDid && (
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                        <span className="text-gray-400">Holder:</span>
                        <span className="font-mono">{result.holderDid.slice(0, 20)}...</span>
                    </div>
                    {result.issuerAuthorized !== undefined && (
                        <div className="flex items-center gap-2">
                            <span className={result.issuerAuthorized ? "text-emerald-600" : "text-amber-600"}>
                                {result.issuerAuthorized ? "✓ Issuer Authorized" : "⚠ Issuer Not Verified"}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
}
