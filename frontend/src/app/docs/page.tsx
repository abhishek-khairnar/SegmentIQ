"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, ChevronRight, CheckCircle2, AlertCircle,
  HelpCircle, Code2, Layers, Target, Info
} from "lucide-react";

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("what-is-segmentation");

  const sections = [
    { id: "what-is-segmentation", title: "1. What is Segmentation?" },
    { id: "data-formats", title: "2. Data Formats & Schemas" },
    { id: "rfm", title: "3. RFM Scoring & Full Rule Table" },
    { id: "kmeans", title: "4. K-Means Clustering" },
    { id: "hierarchical", title: "5. Hierarchical (Agglomerative)" },
    { id: "dbscan", title: "6. DBSCAN Density Clustering" },
    { id: "choosing-k", title: "7. Choosing k (Elbow & Silhouette)" },
    { id: "metrics", title: "8. Reading Cluster Metrics" },
    { id: "limits-and-tips", title: "9. System Limits & Best Practices" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sticky Left Table of Contents */}
          <aside className="lg:col-span-3 lg:sticky lg:top-24 space-y-4">
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
                <BookOpen className="h-4 w-4 text-[#6366F1]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] font-mono">
                  Table of Contents
                </h3>
              </div>
              <nav className="space-y-1">
                {sections.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    onClick={() => setActiveSection(sec.id)}
                    className={`block px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeSection === sec.id
                        ? "bg-[#6366F1]/10 text-[#6366F1] font-semibold"
                        : "text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-raised)]"
                    }`}
                  >
                    {sec.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-9 space-y-16">
            {/* 1. What is Segmentation? */}
            <section id="what-is-segmentation" className="space-y-4 scroll-mt-28">
              <Badge variant="default">Overview</Badge>
              <h1 className="font-heading text-3xl font-extrabold text-[var(--foreground)]">
                What is Customer Segmentation?
              </h1>
              <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
                Customer segmentation is the systematic practice of partitioning an organization's customer base into distinct, internally homogenous cohorts based on observed behavior, transactional history, or demographic indicators.
              </p>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Rather than broadcasting generic messages to all customers, segmentation allows businesses to identify high-value spenders, prevent churn among slipping regulars, and tailor marketing incentives to drive sustainable lifetime value.
              </p>
            </section>

            {/* 2. Data Formats & Schemas */}
            <section id="data-formats" className="space-y-4 scroll-mt-28 border-t border-[var(--border)] pt-12">
              <Badge variant="secondary">Ingestion</Badge>
              <h2 className="font-heading text-2xl font-bold text-[var(--foreground)]">
                Supported Data Formats
              </h2>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                SegmentIQ is built to ingest two standard CSV file formats:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <Card className="p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">1. Transaction Logs</h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Multiple purchase records per customer. Requires: <code className="text-[#6366F1]">customer_id</code>, <code className="text-[#6366F1]">date</code>, and <code className="text-[#6366F1]">amount</code>. Optional: <code className="text-[#6366F1]">order_id</code> and <code className="text-[#6366F1]">category</code>.
                  </p>
                </Card>
                <Card className="p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">2. Customer Features</h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Exactly one row per customer. Requires: a unique identifier column plus 1 or more numeric columns (e.g. age, income, login count, satisfaction score).
                  </p>
                </Card>
              </div>
            </section>

            {/* 3. RFM Explained & Full Rule Table */}
            <section id="rfm" className="space-y-4 scroll-mt-28 border-t border-[var(--border)] pt-12">
              <Badge variant="default">Rule Engine</Badge>
              <h2 className="font-heading text-2xl font-bold text-[var(--foreground)]">
                RFM Scoring & The 11-Segment Matrix
              </h2>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                RFM calculates three metrics per customer:
              </p>
              <ul className="list-disc list-inside text-sm text-[var(--text-muted)] space-y-1 pl-2">
                <li><strong>Recency (R):</strong> Days since most recent purchase relative to reference date. Lower days = higher score (1 to 5).</li>
                <li><strong>Frequency (F):</strong> Total count of distinct orders or transactions. Higher count = higher score (1 to 5).</li>
                <li><strong>Monetary (M):</strong> Sum of all transaction spend. Higher spend = higher score (1 to 5).</li>
              </ul>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Scores 1 to 5 are assigned using quantile bins (<code className="text-[#6366F1]">pd.qcut</code> with <code className="text-[#6366F1]">rank(method=&apos;first&apos;)</code>) so ties never break bins. Every single (R, F) pair is assigned to exactly one of the 11 segments based on the ordered evaluation rules below:
              </p>

              {/* Full Rule Table */}
              <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--surface)] mt-4">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[var(--surface-raised)] border-b border-[var(--border)] text-[var(--foreground)] font-mono">
                    <tr>
                      <th className="p-3">Order</th>
                      <th className="p-3">Segment Name</th>
                      <th className="p-3">Score Rule</th>
                      <th className="p-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] text-[var(--foreground)]">
                    <tr>
                      <td className="p-3 font-mono">1</td>
                      <td className="p-3 font-bold text-[#4F8DF7]">Champions</td>
                      <td className="p-3 font-mono">R &gt;= 4 and F &gt;= 4</td>
                      <td className="p-3 text-[var(--text-muted)]">Bought recently, often, and spend well.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono">2</td>
                      <td className="p-3 font-bold text-[#F5A524]">Can&apos;t Lose Them</td>
                      <td className="p-3 font-mono">R == 1 and F &gt;= 4</td>
                      <td className="p-3 text-[var(--text-muted)]">Top spenders who have gone quiet.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono">3</td>
                      <td className="p-3 font-bold text-[#F0568C]">At Risk</td>
                      <td className="p-3 font-mono">R &lt;= 2 and F &gt;= 3</td>
                      <td className="p-3 text-[var(--text-muted)]">Used to buy often but not lately.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono">4</td>
                      <td className="p-3 font-bold text-[#A78BFA]">Need Attention</td>
                      <td className="p-3 font-mono">R == 3 and F == 3</td>
                      <td className="p-3 text-[var(--text-muted)]">Average on all measures and slipping.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono">5</td>
                      <td className="p-3 font-bold text-[#2DD4BF]">Loyal Customers</td>
                      <td className="p-3 font-mono">R &gt;= 3 and F &gt;= 3</td>
                      <td className="p-3 text-[var(--text-muted)]">Buy regularly and respond to offers.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono">6</td>
                      <td className="p-3 font-bold text-[#84CC16]">New Customers</td>
                      <td className="p-3 font-mono">R &gt;= 4 and F == 1</td>
                      <td className="p-3 text-[var(--text-muted)]">First purchase very recently.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono">7</td>
                      <td className="p-3 font-bold text-[#F97316]">Promising</td>
                      <td className="p-3 font-mono">R == 3 and F == 1</td>
                      <td className="p-3 text-[var(--text-muted)]">Recent but low frequency.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono">8</td>
                      <td className="p-3 font-bold text-[#38BDF8]">Potential Loyalists</td>
                      <td className="p-3 font-mono">R &gt;= 3 and F == 2</td>
                      <td className="p-3 text-[var(--text-muted)]">Recent customers with a few purchases.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono">9</td>
                      <td className="p-3 font-bold text-[#E879F9]">About to Sleep</td>
                      <td className="p-3 font-mono">R == 2 and F &lt;= 2</td>
                      <td className="p-3 text-[var(--text-muted)]">Below-average recency and frequency.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono">10</td>
                      <td className="p-3 font-bold text-[#94A3B8]">Hibernating</td>
                      <td className="p-3 font-mono">R == 1 and F == 2</td>
                      <td className="p-3 text-[var(--text-muted)]">Low activity and long inactive.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono">11</td>
                      <td className="p-3 font-bold text-[#64748B]">Lost</td>
                      <td className="p-3 font-mono">R == 1 and F == 1</td>
                      <td className="p-3 text-[var(--text-muted)]">Lowest recency and frequency.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 4. K-Means */}
            <section id="kmeans" className="space-y-4 scroll-mt-28 border-t border-[var(--border)] pt-12">
              <Badge variant="secondary">Clustering</Badge>
              <h2 className="font-heading text-2xl font-bold text-[var(--foreground)]">
                K-Means Clustering
              </h2>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                K-Means partitions n observations into k clusters where each customer belongs to the cluster with the nearest mean (centroid).
              </p>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                In SegmentIQ, K-Means is initialized with <code className="text-[#6366F1]">n_init=10</code> runs using the k-means++ algorithm and a deterministic random seed (<code className="text-[#6366F1]">random_state=42</code>) to ensure consistent results across re-runs.
              </p>
            </section>

            {/* 5. Hierarchical */}
            <section id="hierarchical" className="space-y-4 scroll-mt-28 border-t border-[var(--border)] pt-12">
              <Badge variant="secondary">Clustering</Badge>
              <h2 className="font-heading text-2xl font-bold text-[var(--foreground)]">
                Hierarchical (Agglomerative) Clustering
              </h2>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Agglomerative clustering begins with each customer as a singleton cluster and iteratively merges the pairs of clusters that minimize linkage variance.
              </p>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Supported linkages: <strong>Ward</strong> (minimizes sum of squared differences within merged clusters), <strong>Complete</strong> (maximum pairwise distance), and <strong>Average</strong> (mean pairwise distance). For datasets exceeding 20,000 rows, SegmentIQ fits hierarchical trees on a stratified sample of 20,000 points and assigns the remainder to nearest centroids.
              </p>
            </section>

            {/* 6. DBSCAN */}
            <section id="dbscan" className="space-y-4 scroll-mt-28 border-t border-[var(--border)] pt-12">
              <Badge variant="secondary">Clustering</Badge>
              <h2 className="font-heading text-2xl font-bold text-[var(--foreground)]">
                DBSCAN Density-Based Clustering
              </h2>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                DBSCAN identifies clusters as continuous regions of high customer density separated by areas of low density. It does not assume spherical clusters and does not require pre-specifying k.
              </p>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Parameters: <code className="text-[#6366F1]">eps</code> (maximum radius neighborhood) and <code className="text-[#6366F1]">min_samples</code> (minimum points to form a dense core). Points with label <code className="text-[#6366F1]">-1</code> are explicitly isolated as &quot;Noise / Outliers&quot; and color-coded grey.
              </p>
            </section>

            {/* 7. Choosing k */}
            <section id="choosing-k" className="space-y-4 scroll-mt-28 border-t border-[var(--border)] pt-12">
              <Badge variant="default">Heuristics</Badge>
              <h2 className="font-heading text-2xl font-bold text-[var(--foreground)]">
                Choosing the Optimal Number of Clusters (k)
              </h2>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                SegmentIQ provides two complementary heuristics via the &quot;Suggest k&quot; wizard button:
              </p>
              <ul className="list-disc list-inside text-sm text-[var(--text-muted)] space-y-1.5 pl-2">
                <li>
                  <strong>Elbow Method (Inertia):</strong> Measures the within-cluster sum of squared distances. As k increases, inertia naturally decreases. The &quot;elbow&quot; is the inflection point where additional clusters yield diminishing returns.
                </li>
                <li>
                  <strong>Silhouette Coefficient:</strong> Measures how similar an object is to its own cluster compared to other clusters. Values range from -1 to +1. SegmentIQ automatically highlights the k with the highest silhouette coefficient.
                </li>
              </ul>
            </section>

            {/* 8. Reading Metrics */}
            <section id="metrics" className="space-y-4 scroll-mt-28 border-t border-[var(--border)] pt-12">
              <Badge variant="secondary">Diagnostics</Badge>
              <h2 className="font-heading text-2xl font-bold text-[var(--foreground)]">
                Reading Clustering Metrics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <Card className="p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">Silhouette Score</h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Higher is better (&gt; 0.5 is good). Measures cluster separation vs cohesion.
                  </p>
                </Card>
                <Card className="p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">Davies-Bouldin Index</h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Lower is better (0 is ideal). Measures similarity between clusters compared to cluster size.
                  </p>
                </Card>
                <Card className="p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">Calinski-Harabasz</h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Higher is better. Variance ratio of between-cluster to within-cluster dispersion.
                  </p>
                </Card>
              </div>
            </section>

            {/* 9. Limits and Tips */}
            <section id="limits-and-tips" className="space-y-4 scroll-mt-28 border-t border-[var(--border)] pt-12 pb-12">
              <Badge variant="secondary">Guidelines</Badge>
              <h2 className="font-heading text-2xl font-bold text-[var(--foreground)]">
                System Limits & Practical Tips
              </h2>
              <ul className="space-y-2.5 text-sm text-[var(--text-muted)]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#22C55E] shrink-0 mt-0.5" />
                  <span><strong>File limits:</strong> Maximum file size 20 MB, up to 200,000 rows, and 100 columns.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#22C55E] shrink-0 mt-0.5" />
                  <span><strong>Feature Scaling:</strong> StandardScaler is applied to all feature inputs before running distance-based algorithms.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#22C55E] shrink-0 mt-0.5" />
                  <span><strong>Log Transform:</strong> Leave &quot;Log-transform skewed features&quot; checked if monetary or frequency distributions have heavy right tails.</span>
                </li>
              </ul>
            </section>
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
