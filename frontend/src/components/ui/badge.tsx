import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "danger" | "segment";
  letter?: string;
  color?: string;
}

export function Badge({ className, variant = "default", letter, color, children, ...props }: BadgeProps) {
  const variants = {
    default: "bg-[#6366F1]/10 text-[#6366F1] border-[#6366F1]/30",
    secondary: "bg-[var(--surface-raised)] text-[var(--text-muted)] border-[var(--border)]",
    outline: "bg-transparent text-[var(--foreground)] border-[var(--border)]",
    success: "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30",
    warning: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30",
    danger: "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30",
    segment: "text-white border-transparent",
  };

  const dynamicStyle = variant === "segment" && color ? { backgroundColor: color } : undefined;

  return (
    <span
      style={dynamicStyle}
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors select-none",
        variants[variant],
        className
      )}
      {...props}
    >
      {letter && (
        <span className="font-mono font-bold bg-white/20 text-current px-1 rounded text-[10px] uppercase">
          {letter}
        </span>
      )}
      {children}
    </span>
  );
}
