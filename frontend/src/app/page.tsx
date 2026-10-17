"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowRight, CheckCircle2, ChevronRight, UploadCloud, Sliders,
  Layers, Users, Sparkles, Download, GitCompare, HelpCircle,
  BarChart3, Target, ShieldCheck, Zap, Database
} from "lucide-react";
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip,
  ResponsiveContainer, Cell
} from "recharts";
import { RFM_SEGMENTS_MAP, SEGMENT_PALETTE, SEGMENT_LETTERS } from "@/lib/constants";

// Generate deterministic clustered points for the hero chart
function generateHeroClusterPoints() {
  const points: Array<{ x: number; y: number; cluster: string; color: string; letter: string }> = [];
  const centroids = [
    { x: 30, y: 75, cluster: "Champions", color: "#4F8DF7", letter: "A" },
    { x: 75, y: 80, cluster: "High Spend / High Freq", color: "#F5A524", letter: "B" },
    { x: 25, y: 25, cluster: "Occasional Buyers", color: "#2DD4BF", letter: "C" },
    { x: 80, y: 30, cluster: "Lapsed / Slipping", color: "#F0568C", letter: "D" },
  ];

  let seed = 42;
  const pseudoRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  centroids.forEach((c) => {
    for (let i = 0; i < 50; i++) {
      const u = pseudoRandom();
      const v = pseudoRandom();
      const radius = Math.sqrt(-2.0 * Math.log(u || 0.0001)) * 9.0;
      const angle = 2.0 * Math.PI * v;
      points.push({
        x: Math.round(c.x + radius * Math.cos(angle)),
        y: Math.round(c.y + radius * Math.sin(angle)),
        cluster: c.cluster,
        color: c.color,
        letter: c.letter,
      });
    }
  });

  return points;
}

export default function LandingPage() {
  const heroPoints = useMemo(() => generateHeroClusterPoints(), []);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const rfmKeys = Object.keys(RFM_SEGMENTS_MAP);
  const [selectedRfmTab, setSelectedRfmTab] = useState(rfmKeys[0]);

  const faqs = [
    {
      q: "What file formats does SegmentIQ accept?",
      a: "SegmentIQ accepts standard UTF-8 CSV files up to 20 MB, 200,000 rows, and 100 columns. Delimiters (comma, semicolon, tab, pipe) are automatically detected on ingestion."
    },
    {
      q: "How is my customer dataset stored and processed?",
      a: "Uploaded CSVs are validated, cleaned, and converted to high-performance Parquet format on your local/isolated instance. Datasets are strictly scoped to your private user account."
    },
    {
      q: "What is RFM segmentation and when should I use it?",
      a: "RFM segments customers by Recency (how recently they bought), Frequency (how often they buy), and Monetary value (total spend). It is the gold standard for e-commerce transaction logs."
    },
    {
      q: "How does SegmentIQ suggest the optimal number of clusters (k)?",
      a: "We run automated Inertia (Elbow method) and Silhouette score evaluations across k = 2 to 10, highlighting the exact k with the highest silhouette coefficient."
    },
    {
      q: "Can I permanently delete my uploaded datasets and account?",
      a: "Yes. From your Settings dashboard you can delete specific datasets, remove all stored data, or permanently delete your account with complete cascading cleanup."
    },
    {
      q: "What is the difference between Transaction data and Customer Feature tables?",
      a: "Transaction logs contain multiple purchase rows per customer and are aggregated into behavioral RFM metrics. Customer feature tables contain exactly one pre-computed row per customer."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Navbar />

      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#6366F1]/10 text-[#6366F1] border border-[#6366F1]/30">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Next-Generation Unsupervised Customer Intelligence</span>
              </div>

              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--foreground)] leading-[1.15]">
                Know your customers by{" "}
                <span className="text-[#6366F1] underline decoration-[#6366F1]/30 underline-offset-8">
                  behaviour
                </span>
                , not guesses.
              </h1>

              <p className="text-base sm:text-lg text-[var(--text-muted)] max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Upload your transaction logs or customer features. Run automated RFM rule scoring or machine learning clustering (K-Means, Hierarchical, DBSCAN), and export targeted audience lists.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link href="/register" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto gap-2 text-base shadow-lg shadow-[#6366F1]/20">
                    Get started free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/dashboard/datasets/new?sample=1" className="w-full sm:w-auto">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto gap-2 text-base">
                    <Database className="h-4 w-4 text-[#6366F1]" />
                    Try sample data
                  </Button>
                </Link>
              </div>

              {/* Trust traits */}
              <div className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                  11 Automatic RFM Segments
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                  Zero Black-Box Guesswork
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                  Excel-Ready UTF-8 BOM Exports
                </span>
              </div>
            </div>

            {/* Right Live Interactive Scatter Chart */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">Live 2D Customer Map</h3>
                    <p className="text-xs text-[var(--text-muted)]">Real-time PCA Projection (200 Customers)</p>
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px]">k = 4 Clusters</Badge>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -20 }}>
                      <XAxis type="number" dataKey="x" name="Recency / Variance" unit="%" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                      <YAxis type="number" dataKey="y" name="Spend / Frequency" unit="%" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                      <ZAxis range={[35, 35]} />
                      <Tooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        content={({ payload }) => {
                          if (!payload || !payload.length) return null;
                          const data = payload[0].payload;
                          return (
                            <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg text-xs space-y-1">
                              <div className="flex items-center gap-1.5 font-semibold text-[var(--foreground)]">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: data.color }} />
                                {data.cluster}
                              </div>
                              <p className="text-[var(--text-muted)] font-mono text-[11px]">
                                PCA X: {data.x} | PCA Y: {data.y}
                              </p>
                            </div>
                          );
                        }}
                      />
                      <Scatter data={heroPoints}>
                        {heroPoints.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>

                <div className="pt-3 border-t border-[var(--border)] grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#4F8DF7]" />
                    <span className="text-[var(--text-muted)] text-[11px] truncate">Champions (Cluster A)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#F5A524]" />
                    <span className="text-[var(--text-muted)] text-[11px] truncate">High Value (Cluster B)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#2DD4BF]" />
                    <span className="text-[var(--text-muted)] text-[11px] truncate">Occasionals (Cluster C)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#F0568C]" />
                    <span className="text-[var(--text-muted)] text-[11px] truncate">At Risk (Cluster D)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. How it works (3 Steps) */}
      <section className="py-16 md:py-24 border-b border-[var(--border)] bg-[var(--surface-raised)]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-[var(--foreground)]">
              How SegmentIQ Works
            </h2>
            <p className="text-base text-[var(--text-muted)]">
              From raw CSV transaction logs to plain-language customer personas in three transparent steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-4 relative">
              <div className="h-10 w-10 rounded-lg bg-[#6366F1]/10 text-[#6366F1] flex items-center justify-center font-mono font-bold">
                01
              </div>
              <h3 className="text-lg font-semibold text-[var(--foreground)]">1. Upload Customer CSV</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Drop your raw purchase orders or customer feature table. We auto-detect column mappings, sniff delimiters, clean returns, and inspect data quality.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-4 relative">
              <div className="h-10 w-10 rounded-lg bg-[#6366F1]/10 text-[#6366F1] flex items-center justify-center font-mono font-bold">
                02
              </div>
              <h3 className="text-lg font-semibold text-[var(--foreground)]">2. Choose Method & Parameters</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Select 11-segment RFM rules, or run K-Means, Hierarchical, or DBSCAN. Use our built-in Elbow and Silhouette heuristic tools to auto-suggest optimal cluster counts.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-4 relative">
              <div className="h-10 w-10 rounded-lg bg-[#6366F1]/10 text-[#6366F1] flex items-center justify-center font-mono font-bold">
                03
              </div>
              <h3 className="text-lg font-semibold text-[var(--foreground)]">3. Understand & Export Audiences</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Review persona cards with 3 tailored marketing recommendations per segment. Explore PCA maps and export Excel-friendly CSVs with one click.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link href="/how-it-works">
              <Button variant="outline" className="gap-2">
                View full step-by-step workflow
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Feature Grid (6 Cards) */}
      <section className="py-16 md:py-24 border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-[var(--foreground)]">
              Core Capabilities Built for Action
            </h2>
            <p className="text-base text-[var(--text-muted)]">
              Designed for marketers, e-commerce teams, and data analysts who need actionable segments without code complexity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <Link href="/features#rfm" className="group">
              <Card className="h-full transition-all group-hover:border-[#6366F1]/50 group-hover:shadow-md">
                <div className="h-10 w-10 rounded-lg bg-[#4F8DF7]/10 text-[#4F8DF7] flex items-center justify-center mb-4">
                  <Target className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-[var(--foreground)] group-hover:text-[#6366F1] transition-colors mb-2">
                  RFM Rule Scoring
                </h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  Quantile-based scoring covering 11 established behavioral segments with zero ambiguous edge cases or ties.
                </p>
              </Card>
            </Link>

            {/* Card 2 */}
            <Link href="/features#clustering" className="group">
              <Card className="h-full transition-all group-hover:border-[#6366F1]/50 group-hover:shadow-md">
                <div className="h-10 w-10 rounded-lg bg-[#A78BFA]/10 text-[#A78BFA] flex items-center justify-center mb-4">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-[var(--foreground)] group-hover:text-[#6366F1] transition-colors mb-2">
                  Machine Learning Clustering
                </h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  Run K-Means, Agglomerative Hierarchical, and DBSCAN density clustering with outlier capping and log transformations.
                </p>
              </Card>
            </Link>

            {/* Card 3 */}
            <Link href="/features#suggest-k" className="group">
              <Card className="h-full transition-all group-hover:border-[#6366F1]/50 group-hover:shadow-md">
                <div className="h-10 w-10 rounded-lg bg-[#2DD4BF]/10 text-[#2DD4BF] flex items-center justify-center mb-4">
                  <Sliders className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-[var(--foreground)] group-hover:text-[#6366F1] transition-colors mb-2">
                  Auto-Suggest Cluster Counts
                </h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  Interactive Elbow (Inertia) and Silhouette score plots that dynamically recommend the mathematically optimal k.
                </p>
              </Card>
            </Link>

            {/* Card 4 */}
            <Link href="/features#profiles" className="group">
              <Card className="h-full transition-all group-hover:border-[#6366F1]/50 group-hover:shadow-md">
                <div className="h-10 w-10 rounded-lg bg-[#F5A524]/10 text-[#F5A524] flex items-center justify-center mb-4">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-[var(--foreground)] group-hover:text-[#6366F1] transition-colors mb-2">
                  Segment Profiles & Trait Summaries
                </h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  Humanized persona names derived from z-scores, with 3 tailored next-step marketing recommendations per group.
                </p>
              </Card>
            </Link>

            {/* Card 5 */}
            <Link href="/features#compare" className="group">
              <Card className="h-full transition-all group-hover:border-[#6366F1]/50 group-hover:shadow-md">
                <div className="h-10 w-10 rounded-lg bg-[#F0568C]/10 text-[#F0568C] flex items-center justify-center mb-4">
                  <GitCompare className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-[var(--foreground)] group-hover:text-[#6366F1] transition-colors mb-2">
                  Run Comparison & ARI
                </h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  Compare two clustering algorithms head-to-head using Adjusted Rand Index and customer movement heatmaps.
                </p>
              </Card>
            </Link>

            {/* Card 6 */}
            <Link href="/features#export" className="group">
              <Card className="h-full transition-all group-hover:border-[#6366F1]/50 group-hover:shadow-md">
                <div className="h-10 w-10 rounded-lg bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center mb-4">
                  <Download className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-[var(--foreground)] group-hover:text-[#6366F1] transition-colors mb-2">
                  Multi-Format Exports
                </h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  Download Excel-ready UTF-8 BOM CSVs of labelled customers, segment summary profiles, or isolated audience lists.
                </p>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Methods Strip */}
      <section className="py-12 border-b border-[var(--border)] bg-[var(--surface-raised)]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-base font-semibold text-[var(--foreground)]">Supported Segmentation Methods</h3>
              <p className="text-xs text-[var(--text-muted)]">Read our in-depth mathematical documentation and rules</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/docs#rfm">
                <Badge variant="outline" className="px-3 py-1.5 hover:bg-[var(--surface)] cursor-pointer text-sm">
                  RFM Rules
                </Badge>
              </Link>
              <Link href="/docs#kmeans">
                <Badge variant="outline" className="px-3 py-1.5 hover:bg-[var(--surface)] cursor-pointer text-sm">
                  K-Means
                </Badge>
              </Link>
              <Link href="/docs#hierarchical">
                <Badge variant="outline" className="px-3 py-1.5 hover:bg-[var(--surface)] cursor-pointer text-sm">
                  Hierarchical
                </Badge>
              </Link>
              <Link href="/docs#dbscan">
                <Badge variant="outline" className="px-3 py-1.5 hover:bg-[var(--surface)] cursor-pointer text-sm">
                  DBSCAN
                </Badge>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. 11 Segment Interactive Preview Tabs */}
      <section className="py-16 md:py-24 border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-[var(--foreground)]">
              The 11 Proven RFM Segments
            </h2>
            <p className="text-base text-[var(--text-muted)]">
              Every customer falls into exactly one actionable behavioral bracket. Click a persona below to see its business meaning and marketing playbook.
            </p>
          </div>

          <Tabs value={selectedRfmTab} onValueChange={setSelectedRfmTab}>
            <TabsList className="justify-center flex-wrap h-auto p-1.5 mb-8">
              {rfmKeys.map((key, idx) => (
                <TabsTrigger key={key} value={key} className="text-xs sm:text-sm">
                  {key}
                </TabsTrigger>
              ))}
            </TabsList>

            {rfmKeys.map((key, idx) => {
              const seg = RFM_SEGMENTS_MAP[key];
              const color = SEGMENT_PALETTE[idx % SEGMENT_PALETTE.length];
              const letter = SEGMENT_LETTERS[idx % SEGMENT_LETTERS.length];

              return (
                <TabsContent key={key} value={key}>
                  <Card className="max-w-3xl mx-auto border-2" style={{ borderColor: `${color}40` }}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)] mb-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-9 w-9 rounded-lg flex items-center justify-center font-mono font-bold text-white text-sm"
                          style={{ backgroundColor: color }}
                        >
                          {letter}
                        </span>
                        <div>
                          <h3 className="text-xl font-bold text-[var(--foreground)]">{seg.name}</h3>
                          <p className="text-xs text-[var(--text-muted)] font-mono">Segment Archetype #{idx + 1}</p>
                        </div>
                      </div>
                      <Badge variant="segment" color={color} letter={letter}>
                        {seg.name}
                      </Badge>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] font-mono mb-1">
                          Plain-Language Meaning
                        </h4>
                        <p className="text-base text-[var(--foreground)] font-medium leading-relaxed">
                          {seg.meaning}
                        </p>
                      </div>

                      <div className="pt-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] font-mono mb-2">
                          3 Recommended Marketing Actions
                        </h4>
                        <ul className="space-y-2">
                          {seg.actions.map((act, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-[var(--foreground)]">
                              <CheckCircle2 className="h-4 w-4 text-[#22C55E] shrink-0 mt-0.5" />
                              <span>{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </section>

      {/* 6. FAQ Accordion (6 Real Questions) */}
      <section className="py-16 md:py-24 border-b border-[var(--border)] bg-[var(--surface-raised)]/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-12">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-[var(--foreground)]">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Everything you need to know about SegmentIQ algorithms, limits, and privacy.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between p-5 text-left font-medium text-[var(--foreground)] hover:text-[#6366F1] transition-colors"
                  >
                    <span className="text-base pr-4">{faq.q}</span>
                    <ChevronRight
                      className={cn("h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform duration-200", isOpen && "rotate-90 text-[#6366F1]")}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-sm text-[var(--text-muted)] leading-relaxed border-t border-[var(--border)]/50">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. Final Call to Action Band */}
      <section className="py-20 bg-gradient-to-b from-[var(--surface)] to-[var(--surface-raised)] text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[var(--foreground)]">
            Ready to discover who your customers really are?
          </h2>
          <p className="text-base text-[var(--text-muted)] max-w-xl mx-auto leading-relaxed">
            Get started right now with our seeded sample transaction dataset or upload your own CSV. No external integrations required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/register">
              <Button size="lg" className="gap-2 text-base shadow-lg shadow-[#6366F1]/20">
                Create free account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard/datasets/new?sample=1">
              <Button variant="secondary" size="lg" className="text-base">
                Try mall customer sample
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
