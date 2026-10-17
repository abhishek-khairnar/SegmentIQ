import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Navbar />

      <section className="py-12 border-b border-[var(--border)] bg-[var(--surface-raised)]/30 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
          <Badge variant="secondary">Legal Documentation</Badge>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[var(--foreground)]">
            Terms of Service
          </h1>
          <p className="text-xs text-[var(--text-muted)] font-mono">Last updated: October 11, 2026</p>
        </div>
      </section>

      <main className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-sm leading-relaxed text-[var(--text-muted)] space-y-8 flex-1">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[var(--foreground)]">1. Acceptance of Terms</h2>
          <p>
            By accessing, creating an account, or using SegmentIQ, you agree to be bound by these Terms of Service. If you do not agree to these terms, you must not use or access the application.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[var(--foreground)]">2. Acceptable Use and Restrictions</h2>
          <p>
            You agree to use SegmentIQ solely for lawful analytics and customer data analysis. You agree not to:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Upload malicious scripts, corrupt file binaries, or files exceeding system limits (20 MB / 200,000 rows).</li>
            <li>Attempt to bypass API rate limits or access datasets belonging to other registered users.</li>
            <li>Reverse engineer or disrupt backend execution servers.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[var(--foreground)]">3. Data Ownership and License</h2>
          <p>
            You retain all right, title, and ownership in and to your uploaded customer files and exported audience segmentation reports. SegmentIQ claims no proprietary rights over your data.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[var(--foreground)]">4. Disclaimers and Limitation of Liability</h2>
          <p>
            SegmentIQ provides statistical clustering algorithms and rule heuristics on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. While algorithms execute with verified statistical methodologies, SegmentIQ does not warrant that marketing decisions made from generated customer clusters will guarantee specific business revenue outcomes.
          </p>
          <p>
            To the maximum extent permitted by applicable law, SegmentIQ shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from the use of the service.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
