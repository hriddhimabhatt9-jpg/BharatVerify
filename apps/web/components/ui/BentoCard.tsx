"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface BentoCardProps {
    title?: string;
    subtitle?: string;
    children: ReactNode;
    className?: string;
    span?: 4 | 6 | 8 | 12;
    rowSpan?: number;
    variant?: "default" | "strong" | "liquid" | "accent";
    icon?: ReactNode;
    animationDelay?: number;
    onClick?: () => void;
}

/**
 * BentoCard Component
 * 
 * A glassmorphic card component for Bento Grid layouts.
 * Supports multiple variants and animation effects.
 */
export function BentoCard({
    title,
    subtitle,
    children,
    className = "",
    span = 4,
    rowSpan,
    variant = "default",
    icon,
    animationDelay = 0,
    onClick,
}: BentoCardProps) {
    const getVariantClasses = () => {
        switch (variant) {
            case "strong":
                return "glass-card-strong";
            case "liquid":
                return "liquid-glass";
            case "accent":
                return "glass-card bg-gradient-to-br from-primary-50/80 to-accent-50/80";
            default:
                return "glass-card";
        }
    };

    const spanClass = `bento-span-${span}`;
    const rowSpanClass = rowSpan ? `bento-row-${rowSpan}` : "";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.5,
                delay: animationDelay,
                ease: [0.16, 1, 0.3, 1],
            }}
            className={`${getVariantClasses()} ${spanClass} ${rowSpanClass} p-6 ${className} ${onClick ? "cursor-pointer" : ""
                }`}
            onClick={onClick}
            whileHover={onClick ? { scale: 1.02 } : undefined}
            whileTap={onClick ? { scale: 0.98 } : undefined}
        >
            {(title || icon) && (
                <div className="flex items-start justify-between mb-4">
                    <div>
                        {title && (
                            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                        )}
                        {subtitle && (
                            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
                        )}
                    </div>
                    {icon && (
                        <div className="p-2 rounded-xl bg-white/60 backdrop-blur-sm shadow-sm">
                            {icon}
                        </div>
                    )}
                </div>
            )}
            {children}
        </motion.div>
    );
}

/**
 * BentoGrid Container
 */
interface BentoGridProps {
    children: ReactNode;
    className?: string;
}

export function BentoGrid({ children, className = "" }: BentoGridProps) {
    return (
        <div className={`bento-grid bento-grid-dashboard ${className}`}>
            {children}
        </div>
    );
}
