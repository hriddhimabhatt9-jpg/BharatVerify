"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface StatCardProps {
    value: string | number;
    label: string;
    icon?: ReactNode;
    trend?: {
        value: number;
        positive: boolean;
    };
    variant?: "default" | "primary" | "success" | "warning";
    animationDelay?: number;
}

/**
 * StatCard Component
 * 
 * Displays a statistic with animated number and optional trend indicator.
 */
export function StatCard({
    value,
    label,
    icon,
    trend,
    variant = "default",
    animationDelay = 0,
}: StatCardProps) {
    const getGradient = () => {
        switch (variant) {
            case "primary":
                return "from-sky-500 to-blue-600";
            case "success":
                return "from-emerald-500 to-green-600";
            case "warning":
                return "from-amber-500 to-orange-600";
            default:
                return "from-slate-600 to-slate-800";
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
                duration: 0.5,
                delay: animationDelay,
                ease: [0.16, 1, 0.3, 1],
            }}
            className="glass-card p-6 flex flex-col"
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: animationDelay + 0.2 }}
                        className={`text-4xl font-bold bg-gradient-to-r ${getGradient()} bg-clip-text text-transparent`}
                    >
                        {value}
                    </motion.p>
                    <p className="text-sm font-medium text-gray-500 mt-2">{label}</p>
                </div>
                {icon && (
                    <div className="p-3 rounded-2xl bg-white/70 backdrop-blur-sm shadow-sm">
                        {icon}
                    </div>
                )}
            </div>

            {trend && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: animationDelay + 0.3 }}
                    className={`mt-4 flex items-center gap-1 text-sm font-medium ${trend.positive ? "text-emerald-600" : "text-red-500"
                        }`}
                >
                    <span>{trend.positive ? "↑" : "↓"}</span>
                    <span>{Math.abs(trend.value)}%</span>
                    <span className="text-gray-400 font-normal">vs last week</span>
                </motion.div>
            )}
        </motion.div>
    );
}
