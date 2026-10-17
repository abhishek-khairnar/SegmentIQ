import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading = false, children, disabled, ...props }, ref) => {
    const variants = {
      primary: "bg-[#6366F1] hover:bg-[#818CF8] text-white shadow-sm font-medium",
      secondary: "bg-[var(--surface-raised)] hover:bg-[var(--border)] text-[var(--foreground)] border border-[var(--border)] font-medium",
      outline: "border border-[var(--border)] hover:bg-[var(--surface-raised)] text-[var(--foreground)] font-medium",
      ghost: "hover:bg-[var(--surface-raised)] text-[var(--foreground)]",
      danger: "bg-[#EF4444] hover:bg-red-600 text-white font-medium shadow-sm",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs rounded-md",
      md: "h-10 px-4 text-sm rounded-[var(--control-radius)]",
      lg: "h-12 px-6 text-base rounded-lg",
      icon: "h-10 w-10 p-0 flex items-center justify-center rounded-[var(--control-radius)]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
