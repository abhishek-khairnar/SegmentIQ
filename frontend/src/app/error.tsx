"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home, LayoutDashboard } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application runtime error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[var(--background)] text-center">
      <div className="h-14 w-14 rounded-2xl bg-red-500/10 text-[#EF4444] flex items-center justify-center mb-6">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h1 className="font-heading text-4xl font-extrabold text-[var(--foreground)] tracking-tight">Something went wrong</h1>
      <p className="text-sm text-[var(--text-muted)] max-w-md mt-2 mb-8 leading-relaxed">
        {error.message || "An unexpected error occurred while processing this request."}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="primary" onClick={() => reset()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
        <Link href="/dashboard">
          <Button variant="outline" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Button>
        </Link>
        <Link href="/">
          <Button variant="ghost" className="gap-2">
            <Home className="h-4 w-4" />
            Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
