"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { GlassButton } from "@/components/ui";

interface UserData {
    id: string;
    email: string;
    role: string;
    organization: {
        name: string;
        type: string;
    };
}

export default function PendingPage() {
    const [user, setUser] = useState<UserData | null>(null);

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    return (
        <div className="min-h-screen animated-bg flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card-strong max-w-md w-full p-8 text-center"
            >
                {/* Pending Icon */}
                <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30"
                >
                    <svg
                        className="w-10 h-10 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                </motion.div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Application Pending
                </h1>

                {user && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg text-left">
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">Organization:</span> {user.organization.name}
                        </p>
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">Email:</span> {user.email}
                        </p>
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">Status:</span>{" "}
                            <span className="text-amber-600 font-medium">Awaiting Review</span>
                        </p>
                    </div>
                )}

                <p className="text-gray-600 mb-6">
                    Your application is being reviewed by our admin team. You will receive
                    an email notification once your organization is approved.
                </p>

                <div className="space-y-3">
                    <p className="text-sm text-gray-500">What happens next?</p>
                    <ol className="text-left text-sm text-gray-600 space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                1
                            </span>
                            Admin reviews your organization details
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                2
                            </span>
                            Your organization is authorized on-chain
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                3
                            </span>
                            You can start issuing/verifying credentials
                        </li>
                    </ol>
                </div>

                <div className="mt-8 flex flex-col gap-3">
                    <Link href="/login">
                        <GlassButton variant="primary" className="w-full">
                            Back to Login
                        </GlassButton>
                    </Link>
                    <Link href="/">
                        <GlassButton variant="glass" className="w-full">
                            Go to Home
                        </GlassButton>
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
