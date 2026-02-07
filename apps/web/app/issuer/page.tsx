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
    RegistryStatus,
} from "@/components/ui";

// Icons
const AcademicCapIcon = () => (
    <svg className="w-6 h-6 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path d="M12 14l9-5-9-5-9 5 9 5z" />
        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
    </svg>
);

const ClipboardCheckIcon = () => (
    <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
);

const ClockIcon = () => (
    <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ShieldCheckIcon = () => (
    <svg className="w-6 h-6 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
);

// Form state interface
interface CredentialForm {
    holderDid: string;
    fullName: string;
    aadhaarNumber: string;
    dateOfBirth: string;
    skillSet: string;
    isGraduated: string;
    cibilScore: string;
    institutionName: string;
    degreeTitle: string;
    completionYear: string;
    grade: string;
}

const initialFormState: CredentialForm = {
    holderDid: "",
    fullName: "",
    aadhaarNumber: "",
    dateOfBirth: "",
    skillSet: "",
    isGraduated: "true",
    cibilScore: "",
    institutionName: "",
    degreeTitle: "",
    completionYear: "",
    grade: "",
};

// Skill options
const skillOptions = [
    { value: "", label: "Select a skill..." },
    { value: "Software Engineering", label: "Software Engineering" },
    { value: "Data Science", label: "Data Science" },
    { value: "Web Development", label: "Web Development" },
    { value: "Mobile Development", label: "Mobile Development" },
    { value: "Cloud Computing", label: "Cloud Computing" },
    { value: "Cybersecurity", label: "Cybersecurity" },
    { value: "Machine Learning", label: "Machine Learning" },
    { value: "Electrical Engineering", label: "Electrical Engineering" },
    { value: "Mechanical Engineering", label: "Mechanical Engineering" },
    { value: "Civil Engineering", label: "Civil Engineering" },
    { value: "Healthcare", label: "Healthcare" },
    { value: "Financial Services", label: "Financial Services" },
    { value: "Other", label: "Other" },
];

const graduationOptions = [
    { value: "true", label: "Yes - Graduated" },
    { value: "false", label: "No - Not Graduated" },
];

interface OrgData {
    id: string;
    name: string;
    type: string;
    isAuthorizedOnChain: boolean;
}

export default function IssuerDashboard() {
    const router = useRouter();
    const [formData, setFormData] = useState<CredentialForm>(initialFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [qrData, setQrData] = useState<string>("");
    const [deepLink, setDeepLink] = useState<string>("");
    const [universalLink, setUniversalLink] = useState<string>("");
    const [claimId, setClaimId] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [successMessage, setSuccessMessage] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [organization, setOrganization] = useState<OrgData | null>(null);

    // Stats from API
    const [stats, setStats] = useState({
        total: 0,
        issued: 0,
        pending: 0,
        isAuthorized: false,
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
                if (user.role !== "issuer" && user.role !== "admin") {
                    router.push("/pending");
                    return;
                }

                setOrganization(user.organization);
                setStats({
                    total: 0,
                    issued: 0,
                    pending: 0,
                    isAuthorized: user.organization?.isAuthorizedOnChain || false,
                });
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
        setSuccessMessage("");

        try {
            const response = await fetch("/api/issuer/create-claim", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    holderDid: formData.holderDid,
                    fullName: formData.fullName,
                    aadhaarNumber: formData.aadhaarNumber.replace(/\s/g, ""),
                    dateOfBirth: formData.dateOfBirth,
                    skillSet: formData.skillSet,
                    isGraduated: formData.isGraduated === "true",
                    cibilScore: formData.cibilScore ? parseInt(formData.cibilScore) : undefined,
                    institutionName: formData.institutionName || undefined,
                    degreeTitle: formData.degreeTitle || undefined,
                    completionYear: formData.completionYear ? parseInt(formData.completionYear) : undefined,
                    grade: formData.grade || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Failed to create credential");
            }

            setQrData(data.qrCodeData);
            setDeepLink(data.deepLink);
            setUniversalLink(data.universalLink || "");
            setClaimId(data.claimId);
            setSuccessMessage(`Credential created! Reference: ${data.referenceId}`);

        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    }, [formData]);

    const handleReset = () => {
        setFormData(initialFormState);
        setQrData("");
        setDeepLink("");
        setUniversalLink("");
        setClaimId("");
        setError("");
        setSuccessMessage("");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen animated-bg flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full"
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
                            className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/30 cursor-pointer"
                        >
                            <span className="text-white font-bold text-lg">B</span>
                        </motion.div>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">
                            {organization?.name || "BharatVerify"}
                        </h1>
                        <p className="text-xs text-gray-500">Issuer Dashboard</p>
                    </div>
                </div>

                <nav className="flex items-center gap-2">
                    <GlassButton variant="glass" size="sm" onClick={handleLogout}>
                        Logout
                    </GlassButton>
                    <GlassButton variant="primary" size="sm">
                        + New Credential
                    </GlassButton>
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
                            value={stats.total.toLocaleString()}
                            label="Total Credentials"
                            variant="primary"
                            icon={<AcademicCapIcon />}
                            trend={{ value: 12, positive: true }}
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bento-span-4"
                    >
                        <StatCard
                            value={stats.issued.toLocaleString()}
                            label="Issued & Claimed"
                            variant="success"
                            icon={<ClipboardCheckIcon />}
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bento-span-4"
                    >
                        <StatCard
                            value={stats.pending}
                            label="Pending Claims"
                            variant="warning"
                            icon={<ClockIcon />}
                        />
                    </motion.div>

                    {/* Main Form Card */}
                    <BentoCard
                        title="Issue New Credential"
                        subtitle="Create a verifiable credential for a graduate or professional"
                        span={8}
                        variant="strong"
                        icon={<AcademicCapIcon />}
                        animationDelay={0.4}
                    >
                        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                            {/* Error/Success Messages */}
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
                                {successMessage && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm"
                                    >
                                        ✓ {successMessage}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Personal Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <GlassInput
                                    label="Full Name"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    placeholder="Enter full legal name"
                                    required
                                />
                                <GlassInput
                                    label="Aadhaar Number"
                                    name="aadhaarNumber"
                                    value={formData.aadhaarNumber}
                                    onChange={handleInputChange}
                                    placeholder="XXXX XXXX XXXX"
                                    maxLength={14}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <GlassInput
                                    label="Date of Birth"
                                    name="dateOfBirth"
                                    type="date"
                                    value={formData.dateOfBirth}
                                    onChange={handleInputChange}
                                    required
                                />
                                <GlassInput
                                    label="Holder DID (Required)"
                                    name="holderDid"
                                    value={formData.holderDid}
                                    onChange={handleInputChange}
                                    placeholder="From App Settings -> My DID"
                                    required
                                />
                            </div>

                            {/* Academic Information */}
                            <div className="pt-2 border-t border-gray-100/50">
                                <h4 className="text-sm font-medium text-gray-600 mb-4">Academic & Professional Details</h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <GlassSelect
                                        label="Primary Skill"
                                        name="skillSet"
                                        value={formData.skillSet}
                                        onChange={handleInputChange}
                                        options={skillOptions}
                                    />
                                    <GlassSelect
                                        label="Graduation Status"
                                        name="isGraduated"
                                        value={formData.isGraduated}
                                        onChange={handleInputChange}
                                        options={graduationOptions}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <GlassInput
                                        label="Institution Name"
                                        name="institutionName"
                                        value={formData.institutionName}
                                        onChange={handleInputChange}
                                        placeholder="e.g., IIT Delhi"
                                    />
                                    <GlassInput
                                        label="Degree Title"
                                        name="degreeTitle"
                                        value={formData.degreeTitle}
                                        onChange={handleInputChange}
                                        placeholder="e.g., B.Tech Computer Science"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                    <GlassInput
                                        label="Completion Year"
                                        name="completionYear"
                                        type="number"
                                        value={formData.completionYear}
                                        onChange={handleInputChange}
                                        placeholder="2024"
                                        min="1950"
                                        max="2030"
                                    />
                                    <GlassInput
                                        label="Grade / CGPA"
                                        name="grade"
                                        value={formData.grade}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 8.5 CGPA"
                                    />
                                    <GlassInput
                                        label="CIBIL Score (Optional)"
                                        name="cibilScore"
                                        type="number"
                                        value={formData.cibilScore}
                                        onChange={handleInputChange}
                                        placeholder="300-900"
                                        min="300"
                                        max="900"
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <GlassButton
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    isLoading={isSubmitting}
                                    className="flex-1"
                                >
                                    Generate Credential
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

                    {/* QR Code Display */}
                    <BentoCard
                        title="Scan to Claim"
                        subtitle="User scans with Privado ID wallet"
                        span={4}
                        variant="liquid"
                        animationDelay={0.5}
                    >
                        <div className="flex flex-col items-center justify-center min-h-[400px]">
                            <QRCodeDisplay
                                data={qrData}
                                size={220}
                                deepLink={deepLink}
                                universalLink={universalLink}
                            />
                            {claimId && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mt-4 text-xs text-gray-400 font-mono"
                                >
                                    Claim ID: {claimId}
                                </motion.p>
                            )}
                        </div>
                    </BentoCard>

                    {/* Registry Status */}
                    <BentoCard
                        title="Registry Status"
                        subtitle="On-chain authorization verification"
                        span={4}
                        variant="default"
                        icon={<ShieldCheckIcon />}
                        animationDelay={0.6}
                    >
                        <div className="py-6">
                            <RegistryStatus
                                isAuthorized={stats.isAuthorized}
                                issuerName={organization?.name || "Loading..."}
                                issuerType={organization?.type || "Organization"}
                                contractAddress={process.env.NEXT_PUBLIC_ISSUER_REGISTRY_ADDRESS || "Not deployed"}
                                network="Polygon Amoy"
                            />
                        </div>
                    </BentoCard>

                    {/* Recent Activity */}
                    <BentoCard
                        title="Recent Activity"
                        subtitle="Latest credential operations"
                        span={8}
                        variant="default"
                        animationDelay={0.7}
                    >
                        <div className="mt-4 space-y-3">
                            {[
                                { action: "Credential issued", name: "Rahul Sharma", skill: "Software Engineering", time: "2 min ago", status: "issued" },
                                { action: "Credential claimed", name: "Priya Patel", skill: "Data Science", time: "15 min ago", status: "claimed" },
                                { action: "Credential issued", name: "Amit Kumar", skill: "Cloud Computing", time: "1 hour ago", status: "pending" },
                                { action: "Credential issued", name: "Sneha Singh", skill: "Cybersecurity", time: "2 hours ago", status: "claimed" },
                            ].map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.7 + idx * 0.1 }}
                                    className="flex items-center justify-between p-4 bg-white/40 rounded-xl hover:bg-white/60 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-100 to-sky-200 flex items-center justify-center text-sky-600 font-semibold">
                                            {item.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{item.name}</p>
                                            <p className="text-sm text-gray-500">{item.skill}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`
                      inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                      ${item.status === "claimed" ? "bg-emerald-100 text-emerald-700" :
                                                item.status === "pending" ? "bg-amber-100 text-amber-700" :
                                                    "bg-sky-100 text-sky-700"}
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
                <p>BharatVerify © 2024 • Powered by Privado ID & Polygon</p>
            </footer>
        </div>
    );
}
