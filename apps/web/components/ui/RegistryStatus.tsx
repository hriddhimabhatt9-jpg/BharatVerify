"use client";

import { motion } from "framer-motion";

interface RegistryStatusProps {
    isAuthorized: boolean;
    issuerName?: string;
    issuerType?: string;
    contractAddress?: string;
    network?: string;
    isLoading?: boolean;
}

/**
 * RegistryStatus Component
 * 
 * Displays the on-chain authorization status of an issuer.
 * Shows live data from the IssuerRegistry smart contract.
 */
export function RegistryStatus({
    isAuthorized,
    issuerName,
    issuerType,
    contractAddress,
    network = "Polygon Amoy",
    isLoading = false,
}: RegistryStatusProps) {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-6">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-3 border-sky-200 border-t-sky-500 rounded-full"
                />
                <p className="mt-4 text-sm text-gray-500">Checking registry...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center text-center">
            {/* Status Icon */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className={`
          w-20 h-20 rounded-full flex items-center justify-center
          ${isAuthorized
                        ? "bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg shadow-emerald-500/40"
                        : "bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/40"
                    }
        `}
            >
                {isAuthorized ? (
                    <motion.svg
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="w-10 h-10 text-white"
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
                ) : (
                    <svg
                        className="w-10 h-10 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                )}
            </motion.div>

            {/* Status Text */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-4"
            >
                <span
                    className={`
            inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold
            ${isAuthorized
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }
          `}
                >
                    <span className={`w-2 h-2 rounded-full ${isAuthorized ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                    {isAuthorized ? "Authorized by Government" : "Pending Authorization"}
                </span>
            </motion.div>

            {/* Issuer Details */}
            {isAuthorized && issuerName && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-4 space-y-1"
                >
                    <p className="text-lg font-semibold text-gray-900">{issuerName}</p>
                    {issuerType && (
                        <p className="text-sm text-gray-500">{issuerType}</p>
                    )}
                </motion.div>
            )}

            {/* Network Badge */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-4 flex items-center gap-2 text-xs text-gray-400"
            >
                <span className="w-2 h-2 rounded-full bg-violet-400" />
                <span>{network}</span>
                {contractAddress && (
                    <>
                        <span>•</span>
                        <span className="font-mono">
                            {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
                        </span>
                    </>
                )}
            </motion.div>
        </div>
    );
}
