import React from "react";
import Link from "next/link";
import { PieChart } from "lucide-react";
import { ThemeToggle } from "@/components/common/ThemeToggle";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-[#6366F1] flex items-center justify-center text-white shadow-sm">
                <PieChart className="h-4 w-4" />
              </div>
              <span className="font-heading text-lg font-bold tracking-tight">
                Segment<span className="text-[#6366F1]">IQ</span>
              </span>
            </Link>
            <p className="text-sm text-[var(--text-muted)] max-w-sm leading-relaxed">
              Upload your customers. Discover who they really are. Production-ready behavioral clustering and actionable RFM intelligence.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                FastAPI + Next.js Engine Online
              </span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] font-mono">
              Product
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/features" className="text-[var(--text-muted)] hover:text-[#6366F1] transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-[var(--text-muted)] hover:text-[#6366F1] transition-colors">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/dashboard/datasets/new?sample=1" className="text-[var(--text-muted)] hover:text-[#6366F1] transition-colors">
                  Try sample data
                </Link>
              </li>
            </ul>
          </div>

          {/* Learn Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] font-mono">
              Learn
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/docs" className="text-[var(--text-muted)] hover:text-[#6366F1] transition-colors">
                  Methods guide
                </Link>
              </li>
              <li>
                <Link href="/docs#rfm" className="text-[var(--text-muted)] hover:text-[#6366F1] transition-colors">
                  RFM explained
                </Link>
              </li>
              <li>
                <Link href="/docs#choosing-k" className="text-[var(--text-muted)] hover:text-[#6366F1] transition-colors">
                  Choosing k
                </Link>
              </li>
              <li>
                <Link href="/api-docs" target="_blank" className="text-[var(--text-muted)] hover:text-[#6366F1] transition-colors">
                  API reference (Swagger)
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Legal Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] font-mono">
              Company & Legal
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/about" className="text-[var(--text-muted)] hover:text-[#6366F1] transition-colors">
                  About SegmentIQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-[var(--text-muted)] hover:text-[#6366F1] transition-colors">
                  Contact us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-[var(--text-muted)] hover:text-[#6366F1] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-[var(--text-muted)] hover:text-[#6366F1] transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
          <p>© {currentYear} SegmentIQ. All algorithms and customer privacy reserved.</p>
          <div className="flex items-center gap-4">
            <span>Theme:</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
