"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UploadCloud, GitPullRequest, Sliders, PlayCircle,
  TrendingUp, Download, FileText, ArrowRight, CheckCircle2
} from "lucide-react";

export default function HowItWorksPage() {
  const steps = [
    {
      step: "01",
      title: "Upload Your Customer CSV",
      description: "Drag and drop your raw file. SegmentIQ detects encoding (UTF-8, Latin-1, ASCII) and delimiters (comma, semicolon, tab, pipe). We enforce strict size caps (up to 20 MB, 200,000 rows) and convert to snappy Parquet format.",
      icon: UploadCloud,
    },
    {
      step: "02",
      title: "Verify Column Mappings & Quality Audit",
      description: "Our heuristics automatically detect Customer ID, Order Dates, and Spend Amounts. Our ingestion audit cleans zero or negative returns, flags duplicate rows, and reports transparent metrics.",
      icon: GitPullRequest,
    },
    {
      step: "03",
      title: "Configure Segmentation Parameters",
      description: "Select RFM rule-based scoring or machine learning clustering (K-Means, Hierarchical, DBSCAN). Use our Suggest-k tool to inspect Elbow inertia and Silhouette curves, or enable Log1p transforms for skewed monetary tails.",
      icon: Sliders,
    },
    {
      step: "04",
      title: "Execute Segmentation Asynchronously",
      description: "FastAPI runs background clustering without locking your browser. We standardize features, calculate PCA 2D coordinates for visual mapping, and compute Davies-Bouldin and Calinski-Harabasz metrics.",
      icon: PlayCircle,
    },
    {
      step: "05",
      title: "Act on Plain-Language Personas & Export",
      description: "Examine auto-generated persona profiles with 3 actionable marketing directives each. Inspect customer scatter maps, rename segments inline, and download audience lists encoded with Excel-safe UTF-8 BOM.",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Navbar />

      {/* Hero */}
      <section className="py-16 md:py-24 border-b border-[var(--border)] text-center bg-[var(--surface-raised)]/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <Badge variant="default" className="text-xs">End-to-End Workflow</Badge>
          <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-[var(--foreground)] tracking-tight">
            From Raw CSV to Targeted Audiences
          </h1>
          <p className="text-base sm:text-lg text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
            Follow our 5-stage pipeline designed for mathematical reproducibility and immediate marketing action.
          </p>
        </div>
      </section>

      {/* 5-Step Vertical Timeline */}
      <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative border-l-2 border-[var(--border)] ml-6 md:ml-12 pl-6 md:pl-10 space-y-12">
          {steps.map((st, idx) => {
            const Icon = st.icon;
            return (
              <div key={idx} className="relative group">
                {/* Timeline node icon */}
                <div className="absolute -left-[35px] md:-left-[51px] top-0 h-10 w-10 md:h-12 md:w-12 rounded-full border-4 border-[var(--background)] bg-[#6366F1] text-white flex items-center justify-center font-mono font-bold text-xs shadow-md">
                  {st.step}
                </div>

                <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-3 transition-all hover:border-[#6366F1]/50">
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-5 w-5 text-[#6366F1]" />
                    <h3 className="text-lg font-bold text-[var(--foreground)]">{st.title}</h3>
                  </div>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    {st.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Data Formats Section */}
      <section className="py-20 border-t border-b border-[var(--border)] bg-[var(--surface-raised)]/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="font-heading text-3xl font-bold text-[var(--foreground)]">
              Supported CSV Data Formats
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              SegmentIQ supports two primary data structures: multi-row transaction logs and pre-aggregated customer feature tables.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Format 1: Transactions */}
            <Card className="p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[var(--foreground)]">Format A: Transaction Logs</h3>
                  <Badge variant="default">Multiple rows / customer</Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Best for e-commerce stores, POS systems, and subscriptions. We aggregate orders into Recency, Frequency, and Monetary metrics.
                </p>
                <div className="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] font-mono text-xs overflow-x-auto text-[var(--foreground)]">
                  <pre>{`order_id,customer_id,order_date,amount,category
ORD-1001,CUST-201,2026-04-12,145.50,Electronics
ORD-1002,CUST-201,2026-05-01,89.00,Apparel
ORD-1003,CUST-202,2026-01-15,45.20,Books
ORD-1004,CUST-203,2026-06-18,320.00,Home`}</pre>
                </div>
              </div>

              <div className="pt-6 mt-4 border-t border-[var(--border)]">
                <a
                  href="/samples/online_store_transactions.csv"
                  download="online_store_transactions.csv"
                  className="w-full inline-block"
                >
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <Download className="h-4 w-4" />
                    Download Sample Transactions CSV (1.1 MB)
                  </Button>
                </a>
              </div>
            </Card>

            {/* Format B: Customer Features */}
            <Card className="p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[var(--foreground)]">Format B: Customer Features</h3>
                  <Badge variant="secondary">One row / customer</Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Best for demographic analysis, app engagement profiles, loyalty metrics, and B2B client scoring.
                </p>
                <div className="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] font-mono text-xs overflow-x-auto text-[var(--foreground)]">
                  <pre>{`customer_id,age,annual_income_k,spending_score,visits_per_month
MALL-1001,28,92,84,8
MALL-1002,24,26,78,6
MALL-1003,49,94,22,3
MALL-1004,54,28,18,2`}</pre>
                </div>
              </div>

              <div className="pt-6 mt-4 border-t border-[var(--border)]">
                <a
                  href="/samples/mall_customers.csv"
                  download="mall_customers.csv"
                  className="w-full inline-block"
                >
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <Download className="h-4 w-4" />
                    Download Sample Mall Customers CSV (11 KB)
                  </Button>
                </a>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center bg-[var(--surface)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <h2 className="font-heading text-3xl font-bold text-[var(--foreground)]">
            Ready to Run Your First Segmentation?
          </h2>
          <p className="text-sm text-[var(--text-muted)] max-w-lg mx-auto">
            Try SegmentIQ in seconds with one of our downloadable sample files or upload your live customer data.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Create Free Account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
