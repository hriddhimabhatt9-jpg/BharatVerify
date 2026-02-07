import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Label Component
 * 
 * A styled label component for form elements.
 */
export interface LabelProps
    extends React.LabelHTMLAttributes<HTMLLabelElement> {
    required?: boolean;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
    ({ className, children, required, ...props }, ref) => {
        return (
            <label
                ref={ref}
                className={cn("form-label", className)}
                {...props}
            >
                {children}
                {required && <span className="text-destructive ml-1">*</span>}
            </label>
        );
    }
);
Label.displayName = "Label";

export { Label };
