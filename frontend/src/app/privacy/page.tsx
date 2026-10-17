import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Navbar />

      <section className="py-12 border-b border-[var(--border)] bg-[var(--surface-raised)]/30 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
          <Badge variant="secondary">Legal Documentation</Badge>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[var(--foreground)]">
            Privacy Policy
          </h1>
          <p className="text-xs text-[var(--text-muted)] font-mono">Last updated: October 11, 2026</p>
        </div>
      </section>

      <main className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-sm leading-relaxed text-[var(--text-muted)] space-y-8 flex-1">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[var(--foreground)]">1. Information We Collect</h2>
          <p>
            When you register for a SegmentIQ account, we collect your name and email address. When you utilize the platform, you may upload CSV datasets containing transaction records or customer features. These files are parsed into local Parquet files specifically associated with your isolated user identifier.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[var(--foreground)]">2. How We Use Uploaded Customer Data</h2>
          <p>
            Customer datasets uploaded to SegmentIQ are used strictly and solely to compute user-requested mathematical transformations, including RFM score quantile calculations, standardization, principal component projections (PCA), and unsupervised clustering models (K-Means, Hierarchical, DBSCAN).
          </p>
          <p>
            We <strong>never sell, lease, or monetize</strong> your uploaded customer records. We do not aggregate customer transactional data across separate accounts, nor do we train third-party machine learning models on your proprietary business figures.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[var(--foreground)]">3. Data Retention and Your Right to Delete</h2>
          <p>
            You maintain full ownership of all uploaded data. Through your dashboard, you can individually delete any dataset, removing the underlying Parquet storage file immediately. You also possess the absolute right to purge all account data or permanently terminate your account from the Settings tab at any time with cascading deletion across all runs and segments.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[var(--foreground)]">4. Security Measures</h2>
          <p>
            All passwords are cryptographically hashed using the memory-hard Argon2 algorithm. Authentication session tokens are transmitted using JSON Web Tokens (JWT) stored exclusively in <code className="text-[#6366F1]">httpOnly</code>, <code className="text-[#6366F1]">SameSite=Lax</code> cookies to prevent Cross-Site Scripting (XSS) retrieval.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[var(--foreground)]">5. Contact Regarding Privacy</h2>
          <p>
            If you have questions or inquiries regarding our data handling procedures, you may reach out directly via our contact form at <a href="/contact" className="text-[#6366F1] underline">segmentiq.com/contact</a>.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
