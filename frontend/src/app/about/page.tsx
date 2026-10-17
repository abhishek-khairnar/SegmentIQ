import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Eye, Lock, ArrowRight, HeartHandshake } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Navbar />

      <section className="py-16 md:py-24 border-b border-[var(--border)] text-center bg-[var(--surface-raised)]/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <Badge variant="default" className="text-xs">About SegmentIQ</Badge>
          <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-[var(--foreground)] tracking-tight">
            Democratizing Customer Behavioral Intelligence
          </h1>
          <p className="text-base sm:text-lg text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
            We believe customer segmentation should not be confined to complex Jupyter notebooks or expensive black-box enterprise platforms.
          </p>
        </div>
      </section>

      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Mission */}
        <div className="space-y-4">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
            Our Mission
          </h2>
          <p className="text-base text-[var(--text-muted)] leading-relaxed">
            Most businesses communicate with their customers using generic, one-size-fits-all broadcasts because segmenting transactional logs traditionally required specialized data scientists writing custom Python scripts. SegmentIQ was founded to give every e-commerce entrepreneur, growth marketer, and analyst instant access to transparent, mathematically rigorous clustering.
          </p>
        </div>

        {/* Three Principles */}
        <div className="space-y-6">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
            Our Core Principles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 space-y-3">
              <div className="h-10 w-10 rounded-lg bg-[#6366F1]/10 text-[#6366F1] flex items-center justify-center">
                <Eye className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-[var(--foreground)]">1. Transparent Methods</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                No proprietary mystery algorithms. We strictly implement verified methods: RFM quantiles, K-Means++, Hierarchical Ward linkage, and DBSCAN, with full metric readouts.
              </p>
            </Card>

            <Card className="p-6 space-y-3">
              <div className="h-10 w-10 rounded-lg bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-[var(--foreground)]">2. Uncompromising Privacy</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Your customer datasets are your private intellectual property. We never sell, train external models on, or aggregate your proprietary transaction tables across accounts.
              </p>
            </Card>

            <Card className="p-6 space-y-3">
              <div className="h-10 w-10 rounded-lg bg-[#F5A524]/10 text-[#F5A524] flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-[var(--foreground)]">3. No Black Boxes</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Every cluster is mapped directly to plain-language traits, z-score distributions, and actionable playbook recommendations that you can examine and audit at any time.
              </p>
            </Card>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="p-8 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-lg font-bold text-[var(--foreground)]">Have questions or want to learn more?</h3>
            <p className="text-sm text-[var(--text-muted)]">Our engineering team is always ready to assist.</p>
          </div>
          <Link href="/contact">
            <Button className="gap-2">
              Contact us
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
