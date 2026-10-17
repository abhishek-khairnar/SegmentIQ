"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  PieChart, Menu, X, LogOut, Settings, LayoutDashboard,
  ChevronDown, User as UserIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [pathname]);

  // Lock body scroll and listen for Escape key when mobile menu is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        setUserDropdownOpen(false);
      }
    };
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: "Features", href: "/features" },
    { label: "How it works", href: "/how-it-works" },
    { label: "Methods", href: "/docs" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-lg bg-[#6366F1] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <PieChart className="h-5 w-5" />
          </div>
          <span className="font-heading text-xl font-bold tracking-tight text-[var(--foreground)]">
            Segment<span className="text-[#6366F1]">IQ</span>
          </span>
        </Link>

        {/* Center: Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-7">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-[#6366F1] relative py-1",
                  isActive
                    ? "text-[#6366F1] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#6366F1] after:rounded-full"
                    : "text-[var(--text-muted)]"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Auth Controls & Theme Toggle */}
        <div className="hidden lg:flex items-center gap-3">
          <ThemeToggle />

          {user ? (
            <div className="relative">
              <div className="flex items-center gap-2">
                <Link href="/dashboard">
                  <Button variant="primary" size="sm" className="gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Open dashboard
                  </Button>
                </Link>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  aria-expanded={userDropdownOpen}
                  className="flex items-center gap-2 p-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] hover:bg-[var(--border)] transition-colors text-sm"
                >
                  <div className="h-7 w-7 rounded-full bg-[#6366F1]/20 text-[#6366F1] font-bold flex items-center justify-center text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                </button>
              </div>

              {/* User Dropdown */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-xl z-50 animate-fade-in">
                  <div className="px-3 py-2 border-b border-[var(--border)] mb-1">
                    <p className="text-sm font-semibold text-[var(--foreground)] truncate">{user.name}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--surface-raised)] transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4 text-[var(--text-muted)]" />
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--surface-raised)] transition-colors"
                  >
                    <Settings className="h-4 w-4 text-[var(--text-muted)]" />
                    Settings
                  </Link>
                  <div className="my-1 border-t border-[var(--border)]" />
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
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
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  Get started
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="p-2 rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-raised)] transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </header>

    {/* Mobile Slide-down Sheet */}
    {mobileMenuOpen && (
      <div className="fixed inset-x-0 top-16 bottom-0 z-50 bg-white dark:bg-[#121829] border-b border-[var(--border)] p-6 lg:hidden flex flex-col justify-between overflow-y-auto shadow-2xl animate-fade-in">
        <div className="space-y-4">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "text-base font-medium py-2 px-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-[#6366F1]/10 text-[#6366F1] font-semibold"
                      : "text-[var(--foreground)] hover:bg-[var(--surface-raised)]"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-[var(--border)] space-y-3">
          {user ? (
            <div className="space-y-2">
              <div className="px-3 py-2 mb-2 bg-[var(--surface-raised)] rounded-lg">
                <p className="text-sm font-semibold text-[var(--foreground)]">{user.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{user.email}</p>
              </div>
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="w-full block">
                <Button variant="primary" className="w-full gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Open dashboard
                </Button>
              </Link>
              <Link href="/dashboard/settings" onClick={() => setMobileMenuOpen(false)} className="w-full block">
                <Button variant="outline" className="w-full gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </Link>
              <Button
                variant="ghost"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full text-[#EF4444] hover:bg-red-500/10 gap-2"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full">
                  Log in
                </Button>
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" className="w-full">
                  Get started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    )}
  </>
  );
}
