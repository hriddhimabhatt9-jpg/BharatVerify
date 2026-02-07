"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { GlassButton } from "@/components/ui";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen animated-bg flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card-strong max-w-md w-full p-8 text-center"
            >
                {/* Error Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shadow-lg shadow-red-500/30"
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
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                </motion.div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Something Went Wrong
                </h1>
                <p className="text-gray-600 mb-6">
                    We encountered an unexpected error. Please try again.
                </p>

                <div className="flex flex-col gap-3">
                    <GlassButton variant="primary" size="lg" onClick={() => reset()}>
                        Try Again
                    </GlassButton>
                    <Link href="/">
                        <GlassButton variant="glass" size="lg" className="w-full">
                            Go Home
                        </GlassButton>
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
