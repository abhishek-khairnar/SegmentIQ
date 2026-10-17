"use client";

import React, { useState, useMemo, useEffect, use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog } from "@/components/ui/dialog";
import { CardSkeleton, TableSkeleton } from "@/components/common/Skeletons";
import { ErrorCard } from "@/components/common/ErrorCard";
import { SEGMENT_LETTERS, SEGMENT_PALETTE } from "@/lib/constants";
import { formatNumber, formatPercent } from "@/lib/utils";
import {
  BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, ZAxis,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Tooltip, ResponsiveContainer, Cell, CartesianGrid, Legend
} from "recharts";
import {
  Download, GitCompare, Edit3, Save, Search, ChevronRight,
  TrendingUp, TrendingDown, ArrowRight, CheckCircle2,
  Users, Layers, Sparkles, Filter, X, HelpCircle, FileText
} from "lucide-react";

function RunResultsContent({ runId }: { runId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const urlTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(urlTab);

  // Sync active tab with URL query
  const handleTabChange = (val: string) => {
    setActiveTab(val);
    router.replace(`/dashboard/runs/${runId}?tab=${val}`);
  };

  // Run rename modal
  const [renameOpen, setRenameOpen] = useState(false);
  const [runNameValue, setRunNameValue] = useState("");

  // Segment editing state
  const [editingSegment, setEditingSegment] = useState<any | null>(null);
  const [segNameInput, setSegNameInput] = useState("");
  const [segDescInput, setSegDescInput] = useState("");

  // Customers table server pagination state
  const [custPage, setCustPage] = useState(1);
  const [custSearch, setCustSearch] = useState("");
  const [custSegmentFilter, setCustSegmentFilter] = useState("");
  const [custSortBy, setCustSortBy] = useState("customer_id");
  const [custSortDesc, setCustSortDesc] = useState(false);
  const [selectedCustomerDrawer, setSelectedCustomerDrawer] = useState<any | null>(null);

  // Map state
  const [hiddenSegments, setHiddenSegments] = useState<Record<string, boolean>>({});
  const [radarSegmentIdx, setRadarSegmentIdx] = useState<number>(0);

  // Expanded segment details
  const [expandedSegs, setExpandedSegs] = useState<Record<string, boolean>>({});

  // 1. Fetch Run details
  const { data: run, isLoading: runLoading, isError: runIsError, error: runError } = useQuery({
    queryKey: ["run", runId],
    queryFn: () => api.getRun(runId),
  });

  // 2. Fetch Segments list
  const { data: segments, isLoading: segsLoading } = useQuery({
    queryKey: ["run-segments", runId],
    queryFn: () => api.getSegments(runId),
    enabled: Boolean(run && run.status === "done"),
  });

  // 3. Fetch Map data (PCA points)
  const { data: mapData } = useQuery({
    queryKey: ["run-map", runId],
    queryFn: () => api.getMap(runId),
    enabled: Boolean(run && run.status === "done" && activeTab === "map"),
  });

  // 4. Fetch Customers page
  const { data: customersPage, isLoading: custLoading } = useQuery({
    queryKey: ["run-customers", runId, custPage, custSearch, custSegmentFilter, custSortBy, custSortDesc],
    queryFn: () =>
      api.getCustomers(runId, {
        page: custPage,
        page_size: 25,
        search: custSearch.trim() || undefined,
        segment_id: custSegmentFilter || undefined,
        sort_by: custSortBy,
        sort_desc: custSortDesc,
      }),
    enabled: Boolean(run && run.status === "done" && activeTab === "customers"),
  });

  useEffect(() => {
    if (run) setRunNameValue(run.name);
  }, [run]);

  // Rename Run Mutation
  const renameRunMutation = useMutation({
    mutationFn: (name: string) => api.renameRun(runId, { name }),
    onSuccess: (updated) => {
      toast.success(`Run renamed to "${updated.name}".`);
      queryClient.invalidateQueries({ queryKey: ["run", runId] });
      setRenameOpen(false);
    },
    onError: (err: any) => toast.error(err.message || "Failed to rename run."),
  });

  // Patch Segment Mutation
  const patchSegmentMutation = useMutation({
    mutationFn: ({ id, name, description }: { id: string; name?: string; description?: string }) =>
      api.patchSegment(id, { name, description }),
    onSuccess: (updated) => {
      toast.success(`Segment "${updated.name}" updated successfully.`);
      queryClient.invalidateQueries({ queryKey: ["run-segments", runId] });
      setEditingSegment(null);
    },
    onError: (err: any) => toast.error(err.message || "Failed to update segment."),
  });

  if (runLoading || segsLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-10 w-64 bg-[var(--surface-raised)] rounded-md animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (runIsError || !run) {
    return <ErrorCard message={(runError as Error)?.message || "Segmentation run not found."} />;
  }

  // Segment Summary Calculations for Overview Tab
  const sortedSegments = [...(segments || [])].sort((a, b) => a.index - b.index);
  const largestSeg = sortedSegments.length ? [...sortedSegments].sort((a, b) => b.size - a.size)[0] : null;
  const smallestSeg = sortedSegments.length ? [...sortedSegments].sort((a, b) => a.size - b.size)[0] : null;

  // Find monetary trait if present
  const monetarySeg = sortedSegments.length
    ? [...sortedSegments].sort((a, b) => {
        const aVal = a.centroid_json?.monetary || a.centroid_json?.amount || a.centroid_json?.annual_income_k || 0;
        const bVal = b.centroid_json?.monetary || b.centroid_json?.amount || b.centroid_json?.annual_income_k || 0;
        return bVal - aVal;
      })[0]
    : null;

  // Bar Chart Data for Segment Sizes
  const sizeBarData = sortedSegments.map((s, idx) => ({
    name: s.name,
    size: s.size,
    share: s.share_pct,
    color: s.color || SEGMENT_PALETTE[idx % SEGMENT_PALETTE.length],
    letter: SEGMENT_LETTERS[idx % SEGMENT_LETTERS.length],
  }));

  // Map Filtered Points
  const filteredMapPoints = (mapData?.points || []).filter(
    (p) => !hiddenSegments[p.segment_id]
  );

  // Radar Chart Data for Selected Segment
  const currentRadarSeg = sortedSegments[radarSegmentIdx] || sortedSegments[0];
  const radarData = currentRadarSeg?.profile_json?.z_scores
    ? Object.entries(currentRadarSeg.profile_json.z_scores).map(([feat, z]) => ({
        feature: feat.replace(/_/g, " "),
        zScore: Number(z),
      }))
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
              {run.name}
            </h1>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[var(--text-muted)] hover:text-[var(--foreground)]"
              onClick={() => setRenameOpen(true)}
              title="Rename run"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <Badge variant="secondary" className="uppercase font-mono text-[10px]">
              {run.method}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono mt-1">
            <span>Dataset:</span>
            <Link href={`/dashboard/datasets/${run.dataset_id}`} className="hover:underline text-[var(--foreground)] font-semibold">
              {run.dataset_name || "View Dataset"}
            </Link>
            <span>•</span>
            <span>{formatNumber(run.n_customers)} customers</span>
            <span>•</span>
            <span>{run.n_segments} segments</span>
            <span>•</span>
            <span>{run.duration_ms} ms</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/dashboard/compare?a=${run.id}`}>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <GitCompare className="h-3.5 w-3.5" />
              Compare
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            className="gap-1.5 text-xs shadow-sm"
            onClick={() => handleTabChange("export")}
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-5 max-w-2xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="segments">Segments ({run.n_segments})</TabsTrigger>
          <TabsTrigger value="map">Visual Map</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="export">Exports</TabsTrigger>
        </TabsList>

        {/* ----------------- TAB 1: OVERVIEW ----------------- */}
        <TabsContent value="overview" className="space-y-6 pt-2">
          {/* Diagnostic KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <Card className="p-4 space-y-1">
              <p className="text-[10px] font-mono font-bold uppercase text-[var(--text-muted)]">Customers</p>
              <h3 className="text-xl font-extrabold text-[var(--foreground)]">{formatNumber(run.n_customers)}</h3>
              <p className="text-[11px] text-[var(--text-muted)]">Total segmented cohort</p>
            </Card>

            <Card className="p-4 space-y-1">
              <p className="text-[10px] font-mono font-bold uppercase text-[var(--text-muted)]">Clusters</p>
              <h3 className="text-xl font-extrabold text-[var(--foreground)]">{run.n_segments}</h3>
              <p className="text-[11px] text-[var(--text-muted)]">Identified cohorts</p>
            </Card>

            <Card className="p-4 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-mono font-bold uppercase text-[var(--text-muted)]">Silhouette</p>
                <span title="Measures cohesion vs separation (-1 to 1). Higher is better." className="cursor-help">
                  <HelpCircle className="h-3 w-3 text-[var(--text-muted)]" />
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-[#6366F1]">
                {run.metrics_json?.silhouette !== undefined ? run.metrics_json.silhouette.toFixed(3) : "—"}
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">Cluster cohesion index</p>
            </Card>

            <Card className="p-4 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-mono font-bold uppercase text-[var(--text-muted)]">Davies-Bouldin</p>
                <span title="Measures cluster similarity. Lower is better (0 is ideal)." className="cursor-help">
                  <HelpCircle className="h-3 w-3 text-[var(--text-muted)]" />
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-[var(--foreground)]">
                {run.metrics_json?.davies_bouldin !== undefined ? run.metrics_json.davies_bouldin.toFixed(3) : "—"}
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">Separation ratio (lower=better)</p>
            </Card>

            <Card className="p-4 space-y-1 col-span-2 md:col-span-1">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-mono font-bold uppercase text-[var(--text-muted)]">Calinski-Harabasz</p>
                <span title="Variance ratio criterion. Higher indicates denser, distinct clusters." className="cursor-help">
                  <HelpCircle className="h-3 w-3 text-[var(--text-muted)]" />
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-[var(--foreground)]">
                {run.metrics_json?.calinski_harabasz !== undefined ? run.metrics_json.calinski_harabasz.toFixed(1) : "—"}
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">Variance dispersion score</p>
            </Card>
          </div>

          {/* Rule-Based Findings Banner */}
          <Card className="p-5 border-l-4 border-l-[#6366F1] bg-[var(--surface)] space-y-2">
            <h4 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#6366F1]" />
              Automated Synthesis Findings
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[var(--foreground)] pt-1">
              {largestSeg && (
                <div className="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)]">
                  <p className="font-semibold text-[var(--text-muted)]">Dominant Audience Cohort</p>
                  <p className="font-bold text-sm mt-0.5" style={{ color: largestSeg.color }}>{largestSeg.name}</p>
                  <p className="text-[var(--text-muted)] mt-0.5">{largestSeg.size} customers ({largestSeg.share_pct}%)</p>
                </div>
              )}
              {monetarySeg && (
                <div className="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)]">
                  <p className="font-semibold text-[var(--text-muted)]">Highest-Value Segment</p>
                  <p className="font-bold text-sm mt-0.5" style={{ color: monetarySeg.color }}>{monetarySeg.name}</p>
                  <p className="text-[var(--text-muted)] mt-0.5">Generates top revenue per customer</p>
                </div>
              )}
              {smallestSeg && (
                <div className="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)]">
                  <p className="font-semibold text-[var(--text-muted)]">Niche / Specialized Cohort</p>
                  <p className="font-bold text-sm mt-0.5" style={{ color: smallestSeg.color }}>{smallestSeg.name}</p>
                  <p className="text-[var(--text-muted)] mt-0.5">{smallestSeg.size} customers ({smallestSeg.share_pct}%)</p>
                </div>
              )}
            </div>
          </Card>

          {/* Segment Size Bar Chart */}
          <Card className="p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-[var(--foreground)]">Customer Segment Population Sizes</h3>
              <p className="text-xs text-[var(--text-muted)]">Audience breakdown across generated cohorts</p>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sizeBarData} margin={{ top: 10, right: 10, bottom: 25, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <Tooltip
                    content={({ payload }) => {
                      if (!payload || !payload.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs space-y-1 shadow-lg">
                          <p className="font-bold text-[var(--foreground)]">{d.name}</p>
                          <p className="text-[var(--text-muted)]">Population: {formatNumber(d.size)} customers</p>
                          <p className="text-[#6366F1] font-semibold">Share: {d.share}%</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="size" radius={[4, 4, 0, 0]}>
                    {sizeBarData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        {/* ----------------- TAB 2: SEGMENTS ----------------- */}
        <TabsContent value="segments" className="space-y-6 pt-2">
          <div className="space-y-6">
            {sortedSegments.map((seg, idx) => {
              const letter = SEGMENT_LETTERS[idx % SEGMENT_LETTERS.length];
              const isExpanded = expandedSegs[seg.id];
              const actions = seg.actions_json || [];
              const rawMeans = seg.profile_json?.raw_means || {};
              const overallMeans = seg.profile_json?.overall_means || {};
              const indexRatios = seg.profile_json?.index_ratios || {};
              const zScores = seg.profile_json?.z_scores || {};

              // Top 3 key traits by z-score
              const topTraits = Object.entries(zScores)
                .sort((a, b) => Math.abs(b[1] as number) - Math.abs(a[1] as number))
                .slice(0, 3);

              return (
                <Card key={seg.id} className="p-6 border-l-4 transition-all" style={{ borderLeftColor: seg.color }}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[var(--border)]">
                    <div className="flex items-start gap-3">
                      <span
                        className="h-9 w-9 rounded-lg flex items-center justify-center font-mono font-bold text-white text-sm shrink-0"
                        style={{ backgroundColor: seg.color }}
                      >
                        {letter}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-[var(--foreground)]">{seg.name}</h3>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-[var(--text-muted)] hover:text-[var(--foreground)]"
                            onClick={() => {
                              setEditingSegment(seg);
                              setSegNameInput(seg.name);
                              setSegDescInput(seg.description);
                            }}
                            title="Edit segment name and description"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{seg.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right font-mono text-xs">
                        <span className="font-bold text-sm text-[var(--foreground)] block">{formatNumber(seg.size)}</span>
                        <span className="text-[var(--text-muted)]">{seg.share_pct}% share</span>
                      </div>
                      <a
                        href={api.getExportAudienceUrl(run.id, seg.id)}
                        download={`audience_${seg.name.replace(/\s+/g, "_").toLowerCase()}.csv`}
                      >
                        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                          <Download className="h-3.5 w-3.5" />
                          Audience CSV
                        </Button>
                      </a>
                    </div>
                  </div>

                  {/* Key Traits & Recommended Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    {/* Key Traits */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">
                        Key Behavioral Traits (vs Baseline)
                      </h4>
                      <div className="space-y-2">
                        {topTraits.map(([feat, zVal]: any) => {
                          const z = Number(zVal);
                          const isAbove = z > 0;
                          const ratio = indexRatios[feat] || 1.0;
                          return (
                            <div key={feat} className="flex items-center gap-2 text-xs">
                              {isAbove ? (
                                <TrendingUp className="h-4 w-4 text-[#22C55E] shrink-0" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-amber-500 shrink-0" />
                              )}
                              <span className="font-mono text-[var(--foreground)]">
                                {feat.replace(/_/g, " ")}:
                              </span>
                              <span className="text-[var(--text-muted)]">
                                {ratio !== 1.0
                                  ? `${ratio.toFixed(1)}x overall average`
                                  : `${z > 0 ? "+" : ""}${z.toFixed(2)} σ`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 3 Recommended Actions */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">
                        3 Recommended Marketing Actions
                      </h4>
                      <ul className="space-y-1.5 text-xs text-[var(--foreground)]">
                        {actions.map((act: string, aIdx: number) => (
                          <li key={aIdx} className="flex items-start gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E] shrink-0 mt-0.5" />
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Progressive Disclosure: Feature Comparison Table */}
                  <div className="pt-3 border-t border-[var(--border)]">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-[#6366F1] gap-1 p-0 h-auto"
                      onClick={() =>
                        setExpandedSegs({ ...expandedSegs, [seg.id]: !isExpanded })
                      }
                    >
                      {isExpanded ? "Hide feature details ▲" : "Show details (Feature means vs baseline) ▼"}
                    </Button>

                    {isExpanded && (
                      <div className="mt-3 overflow-x-auto rounded-lg border border-[var(--border)]">
                        <table className="w-full text-xs text-left font-mono">
                          <thead className="bg-[var(--surface-raised)] border-b border-[var(--border)] text-[var(--text-muted)] uppercase">
                            <tr>
                              <th className="p-2.5">Feature</th>
                              <th className="p-2.5">Segment Mean</th>
                              <th className="p-2.5">Overall Mean</th>
                              <th className="p-2.5">Index Ratio</th>
                              <th className="p-2.5">Z-Score</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border)]">
                            {Object.keys(rawMeans).map((fn) => (
                              <tr key={fn} className="hover:bg-[var(--surface-raised)]/30">
                                <td className="p-2.5 font-medium text-[var(--foreground)]">{fn}</td>
                                <td className="p-2.5 text-[var(--foreground)]">{rawMeans[fn]}</td>
                                <td className="p-2.5 text-[var(--text-muted)]">{overallMeans[fn]}</td>
                                <td className="p-2.5 text-[var(--foreground)]">
                                  {indexRatios[fn] ? `${indexRatios[fn]}x` : "—"}
                                </td>
                                <td className="p-2.5 text-[#6366F1]">
                                  {zScores[fn] ? `${zScores[fn] > 0 ? "+" : ""}${zScores[fn]}` : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ----------------- TAB 3: VISUAL MAP ----------------- */}
        <TabsContent value="map" className="space-y-6 pt-2">
          {/* PCA 2D Scatter Map */}
          <Card className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[var(--border)]">
              <div>
                <h3 className="text-base font-bold text-[var(--foreground)]">PCA 2D Customer Projection</h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Sampled {formatNumber(mapData?.sampled_customers || 0)} customers across 2 principal components
                </p>
              </div>

              {/* Legend with Toggles */}
              <div className="flex flex-wrap items-center gap-2">
                {sortedSegments.map((s) => {
                  const isHidden = hiddenSegments[s.id];
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() =>
                        setHiddenSegments({ ...hiddenSegments, [s.id]: !isHidden })
                      }
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                        isHidden
                          ? "opacity-40 border-[var(--border)] bg-transparent text-[var(--text-muted)] line-through"
                          : "border-transparent text-white"
                      }`}
                      style={{ backgroundColor: isHidden ? undefined : s.color }}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" dataKey="pca_x" stroke="var(--text-muted)" fontSize={10} name="PCA 1" />
                  <YAxis type="number" dataKey="pca_y" stroke="var(--text-muted)" fontSize={10} name="PCA 2" />
                  <ZAxis range={[30, 30]} />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    content={({ payload }) => {
                      if (!payload || !payload.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs shadow-lg space-y-1">
                          <p className="font-bold text-[var(--foreground)]">{d.customer_id}</p>
                          <p className="text-[#6366F1] font-semibold">{d.segment_name}</p>
                          <p className="text-[var(--text-muted)] font-mono text-[10px]">
                            PCA ({d.pca_x}, {d.pca_y})
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Scatter data={filteredMapPoints}>
                    {filteredMapPoints.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.75} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Grid: Radar Chart & Z-Score Heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Radar Chart */}
            <Card className="lg:col-span-5 p-6 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]">
                <div>
                  <h4 className="text-sm font-bold text-[var(--foreground)]">Standardized Radar Profile</h4>
                  <p className="text-xs text-[var(--text-muted)]">Z-score deviations per attribute</p>
                </div>
                <Select
                  value={radarSegmentIdx.toString()}
                  onChange={(e) => setRadarSegmentIdx(parseInt(e.target.value, 10))}
                  className="w-36 text-xs h-8"
                >
                  {sortedSegments.map((s, idx) => (
                    <option key={s.id} value={idx.toString()}>{s.name}</option>
                  ))}
                </Select>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="feature" stroke="var(--text-muted)" fontSize={10} />
                    <PolarRadiusAxis stroke="var(--border)" fontSize={9} />
                    <Radar
                      name={currentRadarSeg?.name || "Segment"}
                      dataKey="zScore"
                      stroke={currentRadarSeg?.color || "#6366F1"}
                      fill={currentRadarSeg?.color || "#6366F1"}
                      fillOpacity={0.3}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Z-Score Heatmap */}
            <Card className="lg:col-span-7 p-6 space-y-4">
              <div className="pb-2 border-b border-[var(--border)]">
                <h4 className="text-sm font-bold text-[var(--foreground)]">Z-Score Trait Heatmap</h4>
                <p className="text-xs text-[var(--text-muted)]">Diverging color scale of segment means vs overall baseline</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-center font-mono">
                  <thead className="bg-[var(--surface-raised)] border-b border-[var(--border)] text-[var(--text-muted)]">
                    <tr>
                      <th className="p-2 text-left">Segment</th>
                      {Object.keys(sortedSegments[0]?.profile_json?.z_scores || {}).map((feat) => (
                        <th key={feat} className="p-2 whitespace-nowrap">{feat}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {sortedSegments.map((s) => (
                      <tr key={s.id}>
                        <td className="p-2 text-left font-bold" style={{ color: s.color }}>
                          {s.name}
                        </td>
                        {Object.entries(s.profile_json?.z_scores || {}).map(([feat, zVal]: any) => {
                          const z = Number(zVal);
                          // Diverging color
                          const bg =
                            z > 0.8
                              ? "bg-green-500/25 text-green-400"
                              : z > 0.3
                              ? "bg-green-500/10 text-green-500"
                              : z < -0.8
                              ? "bg-red-500/25 text-red-400"
                              : z < -0.3
                              ? "bg-red-500/10 text-red-500"
                              : "bg-[var(--surface-raised)]/40 text-[var(--text-muted)]";
                          return (
                            <td key={feat} className={`p-2 font-medium ${bg}`}>
                              {z > 0 ? `+${z.toFixed(2)}` : z.toFixed(2)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ----------------- TAB 4: CUSTOMERS ----------------- */}
        <TabsContent value="customers" className="space-y-6 pt-2">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--text-muted)]" />
              <Input
                value={custSearch}
                onChange={(e) => {
                  setCustSearch(e.target.value);
                  setCustPage(1);
                }}
                placeholder="Search customers by ID..."
                className="pl-9 text-sm"
              />
            </div>

            <div className="w-full sm:w-56">
              <Select
                value={custSegmentFilter}
                onChange={(e) => {
                  setCustSegmentFilter(e.target.value);
                  setCustPage(1);
                }}
              >
                <option value="">All Segments</option>
                {sortedSegments.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </div>
          </div>

          {/* Customers Table */}
          {custLoading ? (
            <TableSkeleton rows={6} cols={5} />
          ) : customersPage?.items?.length === 0 ? (
            <Card className="p-8 text-center text-sm text-[var(--text-muted)] border-dashed">
              No customers found matching &quot;{custSearch}&quot;.
            </Card>
          ) : (
            <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--surface)] shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[var(--surface-raised)] border-b border-[var(--border)] text-[var(--text-muted)] font-mono uppercase">
                    <tr>
                      <th className="p-3.5">Customer ID</th>
                      <th className="p-3.5">Assigned Segment</th>
                      <th className="p-3.5">Key Attributes</th>
                      <th className="p-3.5">PCA Coordinates</th>
                      <th className="p-3.5 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] font-mono">
                    {customersPage?.items?.map((c: any) => (
                      <tr
                        key={c.customer_id}
                        onClick={() => setSelectedCustomerDrawer(c)}
                        className="hover:bg-[var(--surface-raised)]/50 transition-colors cursor-pointer"
                      >
                        <td className="p-3.5 font-bold text-[var(--foreground)]">{c.customer_id}</td>
                        <td className="p-3.5">
                          <span
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold text-white"
                            style={{ backgroundColor: c.color }}
                          >
                            {c.segment_name}
                          </span>
                        </td>
                        <td className="p-3.5 text-[var(--text-muted)]">
                          {Object.entries(c.features || {})
                            .slice(0, 2)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(" • ")}
                        </td>
                        <td className="p-3.5 text-[var(--text-muted)]">
                          ({c.pca_x}, {c.pca_y})
                        </td>
                        <td className="p-3.5 text-right">
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-[#6366F1]">
                            View Drawer →
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              <div className="p-3.5 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>
                  Page {custPage} of {customersPage?.total_pages || 1} ({formatNumber(customersPage?.total || 0)} customers)
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={custPage <= 1}
                    onClick={() => setCustPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={custPage >= (customersPage?.total_pages || 1)}
                    onClick={() => setCustPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Customer Profile Drawer Dialog */}
          {selectedCustomerDrawer && (
            <Dialog
              open={Boolean(selectedCustomerDrawer)}
              onOpenChange={(open) => !open && setSelectedCustomerDrawer(null)}
              title={`Customer Profile: ${selectedCustomerDrawer.customer_id}`}
              description="Detailed behavioral attribution and model coordinates"
            >
              <div className="space-y-4 pt-2">
                <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Assigned Segment</p>
                    <p className="text-base font-bold text-[var(--foreground)]">{selectedCustomerDrawer.segment_name}</p>
                  </div>
                  <span
                    className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-white text-xs"
                    style={{ backgroundColor: selectedCustomerDrawer.color }}
                  >
                    {SEGMENT_LETTERS[selectedCustomerDrawer.segment_index % SEGMENT_LETTERS.length]}
                  </span>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">
                    Raw Feature Values
                  </h4>
                  <div className="rounded-lg border border-[var(--border)] divide-y divide-[var(--border)] font-mono text-xs">
                    {Object.entries(selectedCustomerDrawer.features || {}).map(([k, v]) => (
                      <div key={k} className="p-2.5 flex justify-between">
                        <span className="text-[var(--text-muted)]">{k}</span>
                        <span className="font-semibold text-[var(--foreground)]">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button variant="secondary" onClick={() => setSelectedCustomerDrawer(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </Dialog>
          )}
        </TabsContent>

        {/* ----------------- TAB 5: EXPORTS ----------------- */}
        <TabsContent value="export" className="space-y-6 pt-2">
          <Card className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-[var(--foreground)]">Download Segmentation Outputs</h3>
              <p className="text-xs text-[var(--text-muted)]">
                All CSV exports are encoded with standard UTF-8 BOM for immediate compatibility with Microsoft Excel, Google Sheets, and CRM tools.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Export 1: Customers + Labels */}
              <Card className="p-5 flex flex-col justify-between space-y-4 border-[var(--border)] bg-[var(--surface-raised)]/20">
                <div className="space-y-2">
                  <FileText className="h-6 w-6 text-[#6366F1]" />
                  <h4 className="font-bold text-sm text-[var(--foreground)]">Customers + Cluster Labels</h4>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Every customer ID with assigned segment name, segment index, and raw feature metrics.
                  </p>
                </div>
                <a href={api.getExportCustomersUrl(run.id)} download={`${run.name}_customers.csv`} className="w-full">
                  <Button variant="primary" size="sm" className="w-full gap-2 text-xs">
                    <Download className="h-3.5 w-3.5" />
                    Download CSV
                  </Button>
                </a>
              </Card>

              {/* Export 2: Segment Summary */}
              <Card className="p-5 flex flex-col justify-between space-y-4 border-[var(--border)] bg-[var(--surface-raised)]/20">
                <div className="space-y-2">
                  <FileText className="h-6 w-6 text-[#F5A524]" />
                  <h4 className="font-bold text-sm text-[var(--foreground)]">Segments Playbook Summary</h4>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    High-level table containing segment sizes, shares, descriptions, and recommended actions.
                  </p>
                </div>
                <a href={api.getExportSegmentsUrl(run.id)} download={`${run.name}_segments.csv`} className="w-full">
                  <Button variant="primary" size="sm" className="w-full gap-2 text-xs">
                    <Download className="h-3.5 w-3.5" />
                    Download CSV
                  </Button>
                </a>
              </Card>

              {/* Export 3: Full Run JSON */}
              <Card className="p-5 flex flex-col justify-between space-y-4 border-[var(--border)] bg-[var(--surface-raised)]/20">
                <div className="space-y-2">
                  <FileText className="h-6 w-6 text-[#22C55E]" />
                  <h4 className="font-bold text-sm text-[var(--foreground)]">Complete Run Manifest</h4>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Full JSON document containing metrics, algorithm parameters, centroids, and profile distributions.
                  </p>
                </div>
                <a href={api.getExportRunJsonUrl(run.id)} download={`${run.name}_full.json`} className="w-full">
                  <Button variant="secondary" size="sm" className="w-full gap-2 text-xs">
                    <Download className="h-3.5 w-3.5" />
                    Download JSON
                  </Button>
                </a>
              </Card>
            </div>

            {/* Per-Segment Audience CSVs */}
            <div className="pt-6 border-t border-[var(--border)] space-y-4">
              <h4 className="text-sm font-bold text-[var(--foreground)]">Individual Segment Audience Lists</h4>
              <p className="text-xs text-[var(--text-muted)]">
                Download targeted audience cohorts for direct upload to email and advertising platforms:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {sortedSegments.map((s, sIdx) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-xs font-semibold text-[var(--foreground)] truncate max-w-[140px]">{s.name}</span>
                    </div>
                    <a
                      href={api.getExportAudienceUrl(run.id, s.id)}
                      download={`audience_${s.name.replace(/\s+/g, "_").toLowerCase()}.csv`}
                    >
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        CSV ({s.size})
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Rename Run Dialog */}
      {renameOpen && (
        <Dialog
          open={renameOpen}
          onOpenChange={setRenameOpen}
          title="Rename Segmentation Run"
          description="Update the display name of this segmentation run."
        >
          <div className="space-y-4 pt-2">
            <Input
              value={runNameValue}
              onChange={(e) => setRunNameValue(e.target.value)}
              placeholder="Run Name"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setRenameOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={!runNameValue.trim() || runNameValue.trim() === run.name}
                isLoading={renameRunMutation.isPending}
                onClick={() => renameRunMutation.mutate(runNameValue.trim())}
              >
                Save Name
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Edit Segment Name & Description Dialog */}
      {editingSegment && (
        <Dialog
          open={Boolean(editingSegment)}
          onOpenChange={(open) => !open && setEditingSegment(null)}
          title={`Edit Segment: ${editingSegment.name}`}
          description="Customize the persona name and business description."
        >
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1 font-mono uppercase">
                Segment Name
              </label>
              <Input
                value={segNameInput}
                onChange={(e) => setSegNameInput(e.target.value)}
                placeholder="Persona Name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1 font-mono uppercase">
                Description
              </label>
              <textarea
                value={segDescInput}
                onChange={(e) => setSegDescInput(e.target.value)}
                rows={3}
                className="w-full rounded-[var(--control-radius)] border border-[var(--border)] bg-[var(--surface)] p-2.5 text-xs text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setEditingSegment(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={!segNameInput.trim()}
                isLoading={patchSegmentMutation.isPending}
                onClick={() =>
                  patchSegmentMutation.mutate({
                    id: editingSegment.id,
                    name: segNameInput.trim(),
                    description: segDescInput.trim(),
                  })
                }
              >
                Save Changes
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

export default function RunResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return (
    <React.Suspense fallback={<div className="p-8 space-y-4"><CardSkeleton /><TableSkeleton rows={4} /></div>}>
      <RunResultsContent runId={resolvedParams.id} />
    </React.Suspense>
  );
}
