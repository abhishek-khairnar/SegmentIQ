"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, Database, PlaySquare, GitCompare,
  Settings, Mail, BookOpen, PieChart, ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  onNavigate?: () => void;
  className?: string;
}

export function Sidebar({ onNavigate, className }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const links = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Datasets", href: "/dashboard/datasets", icon: Database },
    { label: "Runs", href: "/dashboard/runs", icon: PlaySquare },
    { label: "Compare", href: "/dashboard/compare", icon: GitCompare },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  // Admin link
  const isAdmin = user?.role === "admin";

  return (
    <aside
      className={cn(
        "w-64 border-r border-[var(--border)] bg-[var(--surface)] flex flex-col justify-between shrink-0 h-full",
        className
      )}
    >
      <div>
        {/* Header / Logo */}
        <div className="h-16 flex items-center px-6 border-b border-[var(--border)]">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#6366F1] flex items-center justify-center text-white shadow-sm">
              <PieChart className="h-4 w-4" />
            </div>
            <span className="font-heading text-lg font-bold tracking-tight text-[var(--foreground)]">
              Segment<span className="text-[#6366F1]">IQ</span>
            </span>
          </Link>
        </div>

        {/* Navigation list */}
        <nav className="p-4 space-y-1.5">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#6366F1] text-white shadow-sm font-semibold"
                    : "text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-raised)]"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-[var(--text-muted)]")} />
                {link.label}
              </Link>
            );
          })}

          {isAdmin && (
            <Link
              href="/dashboard/admin/messages"
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors mt-3 pt-3 border-t border-[var(--border)]",
                pathname.startsWith("/dashboard/admin/messages")
                  ? "bg-[#6366F1] text-white shadow-sm font-semibold"
                  : "text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-raised)]"
              )}
            >
              <Mail className="h-4 w-4" />
              <span>Admin Inbox</span>
              <span className="ml-auto text-[10px] font-mono bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded font-bold">
                ADMIN
              </span>
            </Link>
          )}
        </nav>
      </div>

      {/* Footer / Methods Guide */}
      <div className="p-4 border-t border-[var(--border)]">
        <Link
          href="/docs"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-raised)] transition-colors"
        >
          <BookOpen className="h-4 w-4 text-[#6366F1]" />
          <span>Methods & Docs</span>
          <span className="ml-auto text-[10px] font-mono text-[var(--text-muted)]">↗</span>
        </Link>
      </div>
    </aside>
  );
}
