import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          ref={ref}
          className={cn(
            "flex h-10 w-full rounded-[var(--control-radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
            error && "border-[#EF4444] focus:ring-[#EF4444]",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-[#EF4444] font-medium">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
