"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    GlassInput,
    GlassSelect,
    GlassButton,
} from "@/components/ui";

type AuthMode = "login" | "register";
type RoleType = "issuer" | "verifier";

const ORG_TYPES = [
    { value: "university", label: "University" },
    { value: "iti", label: "ITI (Industrial Training Institute)" },
    { value: "polytechnic", label: "Polytechnic" },
    { value: "training_center", label: "Training Center" },
    { value: "employer", label: "Employer / Company" },
    { value: "government", label: "Government Body" },
    { value: "other", label: "Other" },
];

export default function LoginPage() {
    const router = useRouter();
    const [mode, setMode] = useState<AuthMode>("login");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Login form
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Register form
    const [registerData, setRegisterData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        organizationName: "",
        organizationType: "university",
        registrationNumber: "",
        phone: "",
        city: "",
        state: "",
        website: "",
        requestedRole: "issuer" as RoleType,
    });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!data.success) {
                setError(data.error || "Login failed");
                return;
            }

            // Store tokens
            localStorage.setItem("accessToken", data.tokens.accessToken);
            localStorage.setItem("refreshToken", data.tokens.refreshToken);
            localStorage.setItem("user", JSON.stringify(data.user));

            // Redirect based on role
            switch (data.user.role) {
                case "admin":
                    router.push("/admin");
                    break;
                case "issuer":
                    router.push("/issuer");
                    break;
                case "verifier":
                    router.push("/verifier");
                    break;
                default:
                    router.push("/pending");
            }
        } catch {
            setError("Failed to connect to server");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsLoading(true);

        // Validation
        if (registerData.password !== registerData.confirmPassword) {
            setError("Passwords do not match");
            setIsLoading(false);
            return;
        }

        if (registerData.password.length < 8) {
            setError("Password must be at least 8 characters");
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: registerData.email,
                    password: registerData.password,
                    organizationName: registerData.organizationName,
                    organizationType: registerData.organizationType,
                    registrationNumber: registerData.registrationNumber,
                    phone: registerData.phone,
                    city: registerData.city,
                    state: registerData.state,
                    website: registerData.website,
                    requestedRole: registerData.requestedRole,
                }),
            });

            const data = await response.json();

            if (!data.success) {
                setError(data.error || "Registration failed");
                return;
            }

            setSuccess(
                "Registration successful! Your application is pending admin approval. You will receive an email once approved."
            );

            // Store tokens for pending status
            localStorage.setItem("accessToken", data.tokens.accessToken);
            localStorage.setItem("refreshToken", data.tokens.refreshToken);
            localStorage.setItem("user", JSON.stringify(data.user));
        } catch {
            setError("Failed to connect to server");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen animated-bg flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg"
            >
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30 mb-4"
                    >
                        <span className="text-2xl font-bold text-white">B</span>
                    </motion.div>
                    <h1 className="text-2xl font-bold text-gray-900">BharatVerify</h1>
                    <p className="text-gray-600">Decentralized Credential Verification</p>
                </div>

                {/* Auth Card */}
                <div className="glass-card-strong p-8">
                    {/* Mode Toggle */}
                    <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
                        <button
                            onClick={() => {
                                setMode("login");
                                setError(null);
                                setSuccess(null);
                            }}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${mode === "login"
                                    ? "bg-white text-gray-900 shadow-md"
                                    : "text-gray-600 hover:text-gray-900"
                                }`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => {
                                setMode("register");
                                setError(null);
                                setSuccess(null);
                            }}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${mode === "register"
                                    ? "bg-white text-gray-900 shadow-md"
                                    : "text-gray-600 hover:text-gray-900"
                                }`}
                        >
                            Register
                        </button>
                    </div>

                    {/* Error/Success Messages */}
                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
                            >
                                {error}
                            </motion.div>
                        )}
                        {success && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm"
                            >
                                {success}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Login Form */}
                    <AnimatePresence mode="wait">
                        {mode === "login" ? (
                            <motion.form
                                key="login"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={handleLogin}
                                className="space-y-4"
                            >
                                <GlassInput
                                    label="Email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@organization.com"
                                    required
                                />
                                <GlassInput
                                    label="Password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                                <GlassButton
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    className="w-full"
                                    isLoading={isLoading}
                                >
                                    Login
                                </GlassButton>
                            </motion.form>
                        ) : (
                            <motion.form
                                key="register"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleRegister}
                                className="space-y-4"
                            >
                                {/* Role Selection */}
                                <div className="flex gap-2 p-1 bg-gray-50 rounded-lg mb-4">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setRegisterData({ ...registerData, requestedRole: "issuer" })
                                        }
                                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${registerData.requestedRole === "issuer"
                                                ? "bg-violet-500 text-white"
                                                : "text-gray-600 hover:bg-gray-100"
                                            }`}
                                    >
                                        🎓 Issuer
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setRegisterData({ ...registerData, requestedRole: "verifier" })
                                        }
                                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${registerData.requestedRole === "verifier"
                                                ? "bg-sky-500 text-white"
                                                : "text-gray-600 hover:bg-gray-100"
                                            }`}
                                    >
                                        🔍 Verifier
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <GlassInput
                                        label="Email"
                                        type="email"
                                        value={registerData.email}
                                        onChange={(e) =>
                                            setRegisterData({ ...registerData, email: e.target.value })
                                        }
                                        placeholder="you@org.com"
                                        required
                                        className="col-span-2"
                                    />
                                    <GlassInput
                                        label="Password"
                                        type="password"
                                        value={registerData.password}
                                        onChange={(e) =>
                                            setRegisterData({ ...registerData, password: e.target.value })
                                        }
                                        placeholder="••••••••"
                                        required
                                    />
                                    <GlassInput
                                        label="Confirm Password"
                                        type="password"
                                        value={registerData.confirmPassword}
                                        onChange={(e) =>
                                            setRegisterData({
                                                ...registerData,
                                                confirmPassword: e.target.value,
                                            })
                                        }
                                        placeholder="••••••••"
                                        required
                                    />
                                    <GlassInput
                                        label="Organization Name"
                                        value={registerData.organizationName}
                                        onChange={(e) =>
                                            setRegisterData({
                                                ...registerData,
                                                organizationName: e.target.value,
                                            })
                                        }
                                        placeholder="IIT Delhi"
                                        required
                                        className="col-span-2"
                                    />
                                    <GlassSelect
                                        label="Organization Type"
                                        value={registerData.organizationType}
                                        onChange={(e) =>
                                            setRegisterData({
                                                ...registerData,
                                                organizationType: e.target.value,
                                            })
                                        }
                                        options={ORG_TYPES}
                                        required
                                    />
                                    <GlassInput
                                        label="Registration No. (CIN/AISHE)"
                                        value={registerData.registrationNumber}
                                        onChange={(e) =>
                                            setRegisterData({
                                                ...registerData,
                                                registrationNumber: e.target.value,
                                            })
                                        }
                                        placeholder="U12345MH2020PTC123456"
                                        required
                                    />
                                    <GlassInput
                                        label="City"
                                        value={registerData.city}
                                        onChange={(e) =>
                                            setRegisterData({ ...registerData, city: e.target.value })
                                        }
                                        placeholder="Mumbai"
                                    />
                                    <GlassInput
                                        label="State"
                                        value={registerData.state}
                                        onChange={(e) =>
                                            setRegisterData({ ...registerData, state: e.target.value })
                                        }
                                        placeholder="Maharashtra"
                                    />
                                </div>

                                <GlassButton
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    className="w-full"
                                    isLoading={isLoading}
                                >
                                    Submit Application
                                </GlassButton>

                                <p className="text-xs text-gray-500 text-center">
                                    Your application will be reviewed by an admin. You&apos;ll be notified once approved.
                                </p>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>

                {/* Back to Home */}
                <div className="text-center mt-6">
                    <Link href="/" className="text-sm text-gray-600 hover:text-violet-600 transition-colors">
                        ← Back to Home
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
