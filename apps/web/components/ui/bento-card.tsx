"use client";

import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * BentoCard Component
 * 
 * A modular card component following the "Bento Grid" design philosophy.
 * Used for creating Apple-style summary layouts with clean, professional aesthetics.
 * 
 * Features:
 * - Multiple size variants (default, wide, tall, large)
 * - Optional header with title and icon
 * - Subtle hover animation
 * - Accessible and semantic
 */
interface BentoCardProps extends HTMLMotionProps<"div"> {
    /** Card title displayed in header */
    title?: string;
    /** Optional icon component to display alongside title */
    icon?: React.ReactNode;
    /** Additional actions for header (e.g., buttons) */
    headerAction?: React.ReactNode;
    /** Size variant */
    variant?: "default" | "wide" | "tall" | "large";
    /** Optional accent color for top border */
    accent?: "primary" | "success" | "warning" | "destructive" | "accent";
    /** Disable hover animations */
    static?: boolean;
    /** Additional class names */
    className?: string;
    /** Child content */
    children: React.ReactNode;
}

const variantClasses = {
    default: "",
    wide: "md:col-span-2",
    tall: "md:row-span-2",
    large: "md:col-span-2 md:row-span-2",
};

const accentClasses = {
    primary: "border-t-4 border-t-primary",
    success: "border-t-4 border-t-success",
    warning: "border-t-4 border-t-warning",
    destructive: "border-t-4 border-t-destructive",
    accent: "border-t-4 border-t-accent",
};

export function BentoCard({
    title,
    icon,
    headerAction,
    variant = "default",
    accent,
    static: isStatic = false,
    className,
    children,
    ...props
}: BentoCardProps) {
    const cardContent = (
        <>
            {/* Header */}
            {(title || headerAction) && (
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {icon && (
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-muted-foreground">
                                {icon}
                            </div>
                        )}
                        {title && (
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                {title}
                            </h3>
                        )}
                    </div>
                    {headerAction && <div>{headerAction}</div>}
                </div>
            )}
            {/* Content */}
            <div className="flex-1">{children}</div>
        </>
    );

    const baseClasses = cn(
        "bento-card flex flex-col",
        variantClasses[variant],
        accent && accentClasses[accent],
        className
    );

    // Animation variants for hover effect
    const hoverAnimation = isStatic
        ? {}
        : {
            whileHover: { y: -2, transition: { duration: 0.2 } },
        };

    return (
        <motion.div
            className={baseClasses}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            {...hoverAnimation}
            {...props}
        >
            {cardContent}
        </motion.div>
    );
}

/**
 * BentoGrid Component
 * 
 * Container for BentoCards with responsive grid layout.
 */
interface BentoGridProps {
    children: React.ReactNode;
    className?: string;
    /** Number of columns on desktop */
    columns?: 2 | 3 | 4;
}

const columnClasses = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
};

export function BentoGrid({ children, className, columns = 3 }: BentoGridProps) {
    return (
        <div
            className={cn(
                "grid grid-cols-1 gap-4 md:gap-6",
                columnClasses[columns],
                className
            )}
        >
            {children}
        </div>
    );
}

/**
 * StatCard Component
 * 
 * A specialized BentoCard for displaying large statistics.
 */
interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: React.ReactNode;
    trend?: "up" | "down" | "neutral";
    trendValue?: string;
    className?: string;
}

export function StatCard({
    title,
    value,
    subtitle,
    icon,
    trend,
    trendValue,
    className,
}: StatCardProps) {
    const trendColors = {
        up: "text-success",
        down: "text-destructive",
        neutral: "text-muted-foreground",
    };

    return (
        <BentoCard title={title} icon={icon} className={className}>
            <div className="mt-2">
                <div className="stats-value">{value}</div>
                {subtitle && (
                    <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
                )}
                {trend && trendValue && (
                    <div className={cn("text-sm font-medium mt-2", trendColors[trend])}>
                        {trend === "up" && "↑ "}
                        {trend === "down" && "↓ "}
                        {trendValue}
                    </div>
                )}
            </div>
        </BentoCard>
    );
}
