"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import QRCodeLib from "qrcode";

interface QRCodeDisplayProps {
    data: string;
    size?: number;
    title?: string;
    subtitle?: string;
    deepLink?: string;
    universalLink?: string;
    onScan?: () => void;
}

/**
 * QRCodeDisplay Component
 * 
 * Displays a QR code with optional deep link button and animated container.
 */
export function QRCodeDisplay({
    data,
    size = 200,
    title,
    subtitle,
    deepLink,
    universalLink,
}: QRCodeDisplayProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current && data) {
            QRCodeLib.toCanvas(canvasRef.current, data, {
                width: size,
                margin: 2,
                color: {
                    dark: "#1e293b",
                    light: "#ffffff",
                },
                errorCorrectionLevel: "M",
            });
        }
    }, [data, size]);

    if (!data) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center p-8 text-center"
            >
                <div className="w-48 h-48 rounded-2xl bg-gray-100/50 flex items-center justify-center">
                    <svg
                        className="w-16 h-16 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                        />
                    </svg>
                </div>
                <p className="mt-4 text-sm text-gray-500">
                    QR code will appear here after form submission
                </p>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
        >
            {title && (
                <h4 className="text-lg font-semibold text-gray-900 mb-1">{title}</h4>
            )}
            {subtitle && (
                <p className="text-sm text-gray-500 mb-4">{subtitle}</p>
            )}

            {/* QR Code Container */}
            <motion.div
                whileHover={{ scale: 1.02 }}
                className="relative p-4 bg-white rounded-2xl shadow-lg shadow-black/5"
            >
                {/* Decorative corners */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-sky-400 rounded-tl-lg" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-sky-400 rounded-tr-lg" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-sky-400 rounded-bl-lg" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-sky-400 rounded-br-lg" />

                <canvas ref={canvasRef} className="rounded-lg" />

                {/* Animated scan line */}
                <motion.div
                    animate={{ y: [0, size - 4, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent opacity-50"
                    style={{ top: 16 }}
                />
            </motion.div>

            {/* Instructions */}
            <p className="mt-4 text-sm text-gray-500 text-center">
                Scan with <span className="font-medium text-sky-600">Privado ID</span> wallet
            </p>

            {/* Deep Link Button (Mobile) */}
            {deepLink && (
                <motion.a
                    href={deepLink}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-medium rounded-xl shadow-lg shadow-sky-500/30"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Open in Mobile App
                </motion.a>
            )}

            {/* Web Wallet Button (Desktop Alternative) */}
            {universalLink && (
                <motion.a
                    href={universalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-medium rounded-xl shadow-lg shadow-violet-500/30"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    Open Web Wallet
                </motion.a>
            )}
        </motion.div>
    );
}

/**
 * QRCodeSkeleton Component
 * 
 * Loading placeholder for QR code.
 */
export function QRCodeSkeleton({ size = 200 }: { size?: number }) {
    return (
        <div className="flex flex-col items-center">
            <div
                className="bg-gray-100 rounded-2xl animate-pulse"
                style={{ width: size + 32, height: size + 32 }}
            />
            <div className="mt-4 h-4 w-32 bg-gray-100 rounded animate-pulse" />
        </div>
    );
}
