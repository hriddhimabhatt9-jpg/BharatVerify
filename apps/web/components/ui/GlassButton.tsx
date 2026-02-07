"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { forwardRef, ButtonHTMLAttributes, ReactNode } from "react";

interface GlassButtonProps {
    variant?: "primary" | "secondary" | "glass" | "success" | "danger";
    size?: "sm" | "md" | "lg";
    isLoading?: boolean;
    icon?: ReactNode;
    iconPosition?: "left" | "right";
    children?: ReactNode;
    className?: string;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
    onClick?: () => void;
}

/**
 * GlassButton Component
 * 
 * A beautiful glassmorphic button with multiple variants and loading state.
 */
export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
    (
        {
            children,
            variant = "primary",
            size = "md",
            isLoading = false,
            icon,
            iconPosition = "left",
            className = "",
            disabled,
            type = "button",
            onClick,
        },
        ref
    ) => {
        const getVariantClasses = () => {
            switch (variant) {
                case "primary":
                    return `
            bg-gradient-to-r from-sky-500 to-blue-600
            text-white
            shadow-lg shadow-sky-500/30
            hover:shadow-xl hover:shadow-sky-500/40
            hover:from-sky-400 hover:to-blue-500
          `;
                case "secondary":
                    return `
            bg-gradient-to-r from-violet-500 to-purple-600
            text-white
            shadow-lg shadow-violet-500/30
            hover:shadow-xl hover:shadow-violet-500/40
          `;
                case "glass":
                    return `
            bg-white/60 backdrop-blur-xl
            border border-white/80
            text-gray-700
            shadow-lg shadow-black/5
            hover:bg-white/80
            hover:shadow-xl
          `;
                case "success":
                    return `
            bg-gradient-to-r from-emerald-500 to-green-600
            text-white
            shadow-lg shadow-emerald-500/30
            hover:shadow-xl hover:shadow-emerald-500/40
          `;
                case "danger":
                    return `
            bg-gradient-to-r from-red-500 to-rose-600
            text-white
            shadow-lg shadow-red-500/30
            hover:shadow-xl hover:shadow-red-500/40
          `;
                default:
                    return "";
            }
        };

        const getSizeClasses = () => {
            switch (size) {
                case "sm":
                    return "px-4 py-2 text-sm rounded-lg";
                case "md":
                    return "px-6 py-3 text-sm rounded-xl";
                case "lg":
                    return "px-8 py-4 text-base rounded-2xl";
                default:
                    return "";
            }
        };

        const isDisabledOrLoading = disabled || isLoading;

        return (
            <motion.button
                ref={ref}
                type={type}
                disabled={isDisabledOrLoading}
                onClick={onClick}
                whileHover={isDisabledOrLoading ? undefined : { scale: 1.02, y: -2 }}
                whileTap={isDisabledOrLoading ? undefined : { scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className={`
          relative
          font-semibold
          inline-flex items-center justify-center gap-2
          transition-all duration-300
          disabled:opacity-50 disabled:cursor-not-allowed
          ${getVariantClasses()}
          ${getSizeClasses()}
          ${className}
        `}
            >
                {isLoading && (
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                )}
                {!isLoading && icon && iconPosition === "left" && icon}
                {children}
                {!isLoading && icon && iconPosition === "right" && icon}
            </motion.button>
        );
    }
);

GlassButton.displayName = "GlassButton";
