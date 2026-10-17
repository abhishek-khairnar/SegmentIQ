import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorCardProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorCard({
  title = "Something went wrong",
  message,
  onRetry,
  className,
}: ErrorCardProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-6 rounded-xl border border-red-500/30 bg-red-500/5 text-center ${
        className || ""
      }`}
    >
      <AlertCircle className="h-8 w-8 text-[#EF4444] mb-3" />
      <h4 className="text-base font-semibold text-[var(--foreground)] mb-1">{title}</h4>
      <p className="text-sm text-[var(--text-muted)] max-w-md mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </Button>
      )}
    </div>
  );
}
