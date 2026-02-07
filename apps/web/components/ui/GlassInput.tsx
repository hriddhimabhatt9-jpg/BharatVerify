"use client";

import { motion } from "framer-motion";
import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

/**
 * GlassInput Component
 * 
 * A glassmorphic input field with floating label support.
 */
export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
    ({ label, error, icon, className = "", ...props }, ref) => {
        return (
            <div className="relative">
                {label && (
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={`
              input-glass
              ${icon ? "pl-12" : ""}
              ${error ? "border-red-300 focus:border-red-400" : ""}
              ${className}
            `}
                        {...props}
                    />
                </div>
                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-red-500 mt-2"
                    >
                        {error}
                    </motion.p>
                )}
            </div>
        );
    }
);

GlassInput.displayName = "GlassInput";

interface GlassTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export const GlassTextarea = forwardRef<HTMLTextAreaElement, GlassTextareaProps>(
    ({ label, error, className = "", ...props }, ref) => {
        return (
            <div className="relative">
                {label && (
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    className={`
            input-glass resize-none min-h-[100px]
            ${error ? "border-red-300 focus:border-red-400" : ""}
            ${className}
          `}
                    {...props}
                />
                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-red-500 mt-2"
                    >
                        {error}
                    </motion.p>
                )}
            </div>
        );
    }
);

GlassTextarea.displayName = "GlassTextarea";

interface GlassSelectProps extends InputHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
}

export const GlassSelect = forwardRef<HTMLSelectElement, GlassSelectProps>(
    ({ label, error, options, className = "", ...props }, ref) => {
        return (
            <div className="relative">
                {label && (
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {label}
                    </label>
                )}
                <select
                    ref={ref}
                    className={`
            input-glass appearance-none cursor-pointer
            ${error ? "border-red-300 focus:border-red-400" : ""}
            ${className}
          `}
                    {...props}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </div>
                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-red-500 mt-2"
                    >
                        {error}
                    </motion.p>
                )}
            </div>
        );
    }
);

GlassSelect.displayName = "GlassSelect";
