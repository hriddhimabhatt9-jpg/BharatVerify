import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Input Component
 * 
 * A styled input component following the BharatVerify design system.
 */
export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, error, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "form-input",
                    error && "border-destructive focus:ring-destructive/20 focus:border-destructive",
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Input.displayName = "Input";

export { Input };
