"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Target, Layers, Sliders, Users, GitCompare, Download,
  ArrowRight, CheckCircle2, TrendingUp, Sparkles, BarChart2
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell
} from "recharts";

export default function FeaturesPage() {
  // Sample data for feature illustrations
  const rfmBarData = [
    { name: "Champions", size: 380, color: "#4F8DF7" },
    { name: "Loyal", size: 420, color: "#F5A524" },
    { name: "Potential", size: 310, color: "#2DD4BF" },
    { name: "Promising", size: 250, color: "#F0568C" },
    { name: "At Risk", size: 190, color: "#A78BFA" },
    { name: "Hibernating", size: 140, color: "#84CC16" },
  ];

  const suggestKData = [
    { k: 2, inertia: 1420, silhouette: 0.38 },
    { k: 3, inertia: 980, silhouette: 0.49 },
    { k: 4, inertia: 650, silhouette: 0.62 }, // Best
    { k: 5, inertia: 510, silhouette: 0.54 },
    { k: 6, inertia: 430, silhouette: 0.48 },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Navbar />

      {/* Hero */}
      <section className="py-16 md:py-24 border-b border-[var(--border)] text-center bg-[var(--surface-raised)]/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <Badge variant="default" className="text-xs">Feature Deep Dive</Badge>
          <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-[var(--foreground)] tracking-tight">
            Comprehensive Customer Segmentation Toolkit
          </h1>
          <p className="text-base sm:text-lg text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
            Every analytical technique in SegmentIQ is designed for transparent execution, statistical rigor, and direct business applicability.
          </p>
        </div>
      </section>

      {/* Alternating Feature Sections */}
      <div className="divide-y divide-[var(--border)]">
        {/* 1. RFM Scoring */}
        <section id="rfm" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-5">
              <div className="h-10 w-10 rounded-lg bg-[#4F8DF7]/10 text-[#4F8DF7] flex items-center justify-center">
                <Target className="h-5 w-5" />
              </div>
              <h2 className="font-heading text-3xl font-bold text-[var(--foreground)]">
                11-Segment RFM Rule Engine
              </h2>
              <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
                Transform standard transaction rows (order date, customer ID, spend amount) into a comprehensive behavioral matrix. We divide recency, frequency, and monetary metrics into 5 monotonic quantile bins using first-rank tie resolution.
              </p>
              <ul className="space-y-2.5 text-sm text-[var(--foreground)]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                  Guaranteed exhaustive coverage across all 25 (R, F) pairs
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                  Calculates tenure days and average order value (AOV)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                  Identifies revenue concentration and customer lifetime value
                </li>
              </ul>
            </div>
            <div className="lg:col-span-6">
              <Card className="p-6">
                <h4 className="text-sm font-semibold text-[var(--foreground)] mb-1">RFM Segment Size Distribution</h4>
                <p className="text-xs text-[var(--text-muted)] mb-4">Sample active customer cohort</p>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rfmBarData} layout="vertical" margin={{ left: 20 }}>
                      <XAxis type="number" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                      <YAxis type="category" dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="size" radius={[0, 4, 4, 0]}>
                        {rfmBarData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* 2. ML Clustering */}
        <section id="clustering" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-[var(--surface-raised)]/30">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 order-2 lg:order-1">
              <Card className="p-6 space-y-4">
                <h4 className="text-sm font-semibold text-[var(--foreground)]">Preprocessing & Standardization Pipeline</h4>
                <div className="space-y-3 text-xs text-[var(--foreground)]">
                  <div className="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-between">
                    <span className="font-mono font-medium">1. Feature Selection & Filtering</span>
                    <Badge variant="secondary">Zero missing values</Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-between">
                    <span className="font-mono font-medium">2. Winsorization (1% / 99% Capping)</span>
                    <Badge variant="secondary">Reduces outlier skew</Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-between">
                    <span className="font-mono font-medium">3. Log1p Transform (Skew &gt; 1.0)</span>
                    <Badge variant="secondary">Normalizes long tails</Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-between">
                    <span className="font-mono font-medium">4. StandardScaler (µ = 0, σ = 1)</span>
                    <Badge variant="secondary">Equal distance weighting</Badge>
                  </div>
                </div>
              </Card>
            </div>
            <div className="lg:col-span-6 space-y-5 order-1 lg:order-2">
              <div className="h-10 w-10 rounded-lg bg-[#A78BFA]/10 text-[#A78BFA] flex items-center justify-center">
                <Layers className="h-5 w-5" />
              </div>
              <h2 className="font-heading text-3xl font-bold text-[var(--foreground)]">
                Unsupervised Machine Learning
              </h2>
              <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
                Go beyond manual rules. Cluster any arbitrary customer attribute table using scikit-learn. SegmentIQ supports K-Means with deterministic random states, Hierarchical clustering with linkage options, and DBSCAN density clustering with outlier isolation.
              </p>
              <ul className="space-y-2.5 text-sm text-[var(--foreground)]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                  K-Means with n_init=10 and inertia convergence
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                  Hierarchical agglomeration with Ward, Complete, and Average linkage
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                  DBSCAN with automatic noise flag separation
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3. Suggest-K Heuristics */}
        <section id="suggest-k" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-5">
              <div className="h-10 w-10 rounded-lg bg-[#2DD4BF]/10 text-[#2DD4BF] flex items-center justify-center">
                <Sliders className="h-5 w-5" />
              </div>
              <h2 className="font-heading text-3xl font-bold text-[var(--foreground)]">
                Mathematical Cluster Heuristics
              </h2>
              <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
                Never guess how many customer groups exist. With one click, our engine computes the Silhouette Coefficient and Inertia curve across k = 2 to 10 to suggest the mathematical optimum.
              </p>
              <ul className="space-y-2.5 text-sm text-[var(--foreground)]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                  Silhouette Coefficient highlights separation clarity (-1 to +1)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                  Elbow chart tracks diminishing marginal variance reduction
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                  Auto-suggests eps for DBSCAN via maximum-curvature k-distance knees
                </li>
              </ul>
            </div>
            <div className="lg:col-span-6">
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-semibold text-[var(--foreground)]">Silhouette Score vs Number of Clusters (k)</h4>
                  <Badge variant="success">Recommended k = 4</Badge>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={suggestKData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="k" stroke="var(--text-muted)" fontSize={11} />
                      <YAxis stroke="var(--text-muted)" fontSize={11} domain={[0.2, 0.7]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="silhouette" stroke="#6366F1" strokeWidth={3} dot={{ r: 5, fill: "#6366F1" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* 4. Segment Profiles */}
        <section id="profiles" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-[var(--surface-raised)]/30">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 order-2 lg:order-1">
              <Card className="p-6 border-l-4 border-l-[#F5A524] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="h-8 w-8 rounded-lg bg-[#F5A524] text-white font-mono font-bold flex items-center justify-center text-xs">
                      A
                    </span>
                    <div>
                      <h4 className="font-bold text-[var(--foreground)]">High Spend / Low Recency</h4>
                      <p className="text-xs text-[var(--text-muted)]">312 Customers (26.0% share)</p>
                    </div>
                  </div>
                  <Badge variant="warning">Top Spenders</Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Spends 2.8x more than average with order frequency 1.9x above base. Recency is in the top 15th percentile.
                </p>
                <div className="pt-2 border-t border-[var(--border)] space-y-1.5 text-xs">
                  <p className="font-semibold text-[var(--foreground)]">Suggested Actions:</p>
                  <p className="flex items-center gap-2 text-[var(--foreground)]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E]" />
                    Introduce VIP tier and invite into premium loyalty club
                  </p>
                  <p className="flex items-center gap-2 text-[var(--foreground)]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E]" />
                    Incentivize cross-category product discovery
                  </p>
                </div>
              </Card>
            </div>
            <div className="lg:col-span-6 space-y-5 order-1 lg:order-2">
              <div className="h-10 w-10 rounded-lg bg-[#F5A524]/10 text-[#F5A524] flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
              <h2 className="font-heading text-3xl font-bold text-[var(--foreground)]">
                Auto-Named Personas & Recommendations
              </h2>
              <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
                Raw cluster centroids are hard to communicate. SegmentIQ inspects standardized z-scores for each feature, automatically generates descriptive persona names, and prescribes 3 targeted marketing actions.
              </p>
              <ul className="space-y-2.5 text-sm text-[var(--foreground)]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                  Z-score heatmaps comparing segment mean vs overall baseline
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                  Custom editable segment names that persist permanently
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                  Multi-dimensional radar charts for individual personas
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 5. Run Comparison */}
        <section id="compare" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-5">
              <div className="h-10 w-10 rounded-lg bg-[#F0568C]/10 text-[#F0568C] flex items-center justify-center">
                <GitCompare className="h-5 w-5" />
              </div>
              <h2 className="font-heading text-3xl font-bold text-[var(--foreground)]">
                Run Comparison & Movement Matrix
              </h2>
              <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
                Wondering whether K-Means with k=4 or RFM rules yields a better partition? Select any two runs of the same dataset to inspect the Adjusted Rand Index (ARI) and visual customer transition matrix.
              </p>
              <ul className="space-y-2.5 text-sm text-[var(--foreground)]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                  Adjusted Rand Index from 0.0 (random) to 1.0 (identical)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                  Contingency heat matrix showing customer overlap percentages
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                  Highlights top 5 migration flows between segmentations
                </li>
              </ul>
            </div>
            <div className="lg:col-span-6">
              <Card className="p-6 text-center space-y-4">
                <div className="inline-block p-3 rounded-full bg-[#6366F1]/10 text-[#6366F1] font-mono text-2xl font-bold">
                  ARI = 0.742
                </div>
                <h4 className="text-base font-semibold text-[var(--foreground)]">Strong Structural Agreement</h4>
                <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
                  Majority of customers in Run A (K-Means) map predictably into equivalent behavioral segments in Run B (RFM Rules), with only 14% boundary shifts.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* 6. Multi-format Exports */}
        <section id="export" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-[var(--surface-raised)]/30">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 order-2 lg:order-1">
              <Card className="p-6 space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                  <span className="text-xs font-mono font-medium">customers_with_labels.csv</span>
                  <Badge variant="secondary">Excel UTF-8 BOM</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                  <span className="text-xs font-mono font-medium">segments_summary.csv</span>
                  <Badge variant="secondary">Action playbook</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                  <span className="text-xs font-mono font-medium">audience_champions.csv</span>
                  <Badge variant="secondary">Per-segment cohort</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                  <span className="text-xs font-mono font-medium">run_manifest.json</span>
                  <Badge variant="secondary">API & Webhook Payload</Badge>
                </div>
              </Card>
            </div>
            <div className="lg:col-span-6 space-y-5 order-1 lg:order-2">
              <div className="h-10 w-10 rounded-lg bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center">
                <Download className="h-5 w-5" />
              </div>
              <h2 className="font-heading text-3xl font-bold text-[var(--foreground)]">
                Instant Audience Lists & Exports
              </h2>
              <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
                Connect your findings directly to marketing operations. Export clean CSVs encoded with UTF-8 BOM so Microsoft Excel opens special characters and currencies flawlessly without formatting corruptions.
              </p>
              <ul className="space-y-2.5 text-sm text-[var(--foreground)]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                  Download isolated audience CSVs per individual segment
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                  Full run metadata in standardized JSON for API pipelines
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                  Includes PCA coordinates for downstream visualization
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom CTA */}
      <section className="py-20 text-center border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <h2 className="font-heading text-3xl font-bold text-[var(--foreground)]">
            Explore All Features With Live Data
          </h2>
          <p className="text-sm text-[var(--text-muted)] max-w-lg mx-auto">
            Test RFM scoring, K-Means clustering, and segment exports in under two minutes with our built-in datasets.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Start Free Now
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
