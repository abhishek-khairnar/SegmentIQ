"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Menu, Plus, ChevronRight, Settings, LogOut,
  ChevronDown, Database, PlaySquare
} from "lucide-react";

interface TopbarProps {
  onOpenMobileSidebar: () => void;
}

export function Topbar({ onOpenMobileSidebar }: TopbarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Generate dynamic breadcrumb segments
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbItems = segments.map((seg, idx) => {
    const url = "/" + segments.slice(0, idx + 1).join("/");
    const label = seg.charAt(0).toUpperCase() + seg.slice(1).replace("-", " ");
    const isLast = idx === segments.length - 1;
    return { url, label, isLast };
  });

  return (
    <header className="h-16 border-b border-[var(--border)] bg-[var(--surface)] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open sidebar menu"
          className="lg:hidden p-2 rounded-lg text-[var(--foreground)] hover:bg-[var(--surface-raised)] border border-[var(--border)] transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-medium">
          <Link href="/dashboard" className="hover:text-[var(--foreground)] transition-colors">
            Dashboard
          </Link>
          {breadcrumbItems.length > 1 &&
            breadcrumbItems.slice(1).map((item, idx) => (
              <React.Fragment key={item.url}>
                <ChevronRight className="h-3 w-3 text-[var(--border)] shrink-0" />
                {item.isLast ? (
                  <span className="text-[var(--foreground)] font-semibold truncate max-w-[160px]">
                    {item.label}
                  </span>
                ) : (
                  <Link href={item.url} className="hover:text-[var(--foreground)] transition-colors truncate max-w-[120px]">
                    {item.label}
                  </Link>
                )}
              </React.Fragment>
            ))}
        </nav>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/datasets/new">
          <Button variant="primary" size="sm" className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New dataset</span>
          </Button>
        </Link>

        <ThemeToggle />

        {/* User Menu */}
        {user && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] hover:bg-[var(--border)] transition-colors text-sm"
            >
              <div className="h-7 w-7 rounded-full bg-[#6366F1]/20 text-[#6366F1] font-bold flex items-center justify-center text-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden md:inline font-medium text-xs text-[var(--foreground)] truncate max-w-[100px]">
                {user.name}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)]" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-xl z-50 animate-fade-in">
                <div className="px-3 py-2 border-b border-[var(--border)] mb-1">
                  <p className="text-sm font-semibold text-[var(--foreground)] truncate">{user.name}</p>
                  <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
                </div>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--surface-raised)] transition-colors"
                >
                  <Settings className="h-4 w-4 text-[var(--text-muted)]" />
                  Settings
                </Link>
                <div className="my-1 border-t border-[var(--border)]" />
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#EF4444] hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
