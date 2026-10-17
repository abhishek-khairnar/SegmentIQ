import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PieChart, Home, LayoutDashboard } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[var(--background)] text-center">
      <div className="h-14 w-14 rounded-2xl bg-[#6366F1]/10 text-[#6366F1] flex items-center justify-center mb-6">
        <PieChart className="h-8 w-8" />
      </div>
      <h1 className="font-heading text-6xl font-extrabold text-[var(--foreground)] tracking-tight">404</h1>
      <h2 className="text-xl font-bold text-[var(--foreground)] mt-2 mb-3">Page Not Found</h2>
      <p className="text-sm text-[var(--text-muted)] max-w-md mb-8 leading-relaxed">
        The page you requested could not be located. It might have been moved, renamed, or is currently unavailable.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <Home className="h-4 w-4" />
            Return Home
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="primary" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Open Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
