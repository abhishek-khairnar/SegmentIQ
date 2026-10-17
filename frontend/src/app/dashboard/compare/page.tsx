"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/EmptyState";
import { TableSkeleton, CardSkeleton } from "@/components/common/Skeletons";
import { ErrorCard } from "@/components/common/ErrorCard";
import {
  GitCompare, ArrowRight, TrendingUp, Layers,
  CheckCircle2, AlertCircle, ArrowUpRight
} from "lucide-react";
import { formatNumber } from "@/lib/utils";

function CompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlA = searchParams.get("a") || "";
  const urlB = searchParams.get("b") || "";

  const [runAId, setRunAId] = useState(urlA);
  const [runBId, setRunBId] = useState(urlB);

  useEffect(() => {
    if (urlA) setRunAId(urlA);
  }, [urlA]);

  useEffect(() => {
    if (urlB) setRunBId(urlB);
  }, [urlB]);

  // 1. Fetch all runs
  const { data: runs, isLoading: runsLoading } = useQuery({
    queryKey: ["runs"],
    queryFn: () => api.listRuns(),
  });

  // Keep URL updated with ?a= and ?b=
  useEffect(() => {
    if (runAId || runBId) {
      const q = new URLSearchParams();
      if (runAId) q.set("a", runAId);
      if (runBId) q.set("b", runBId);
      router.replace(`/dashboard/compare?${q.toString()}`);
    }
  }, [runAId, runBId, router]);

  // Selected Run A object
  const selectedRunA = useMemo(() => {
    return runs?.find((r: any) => r.id === runAId);
  }, [runs, runAId]);

  // Filter compatible runs for Run B (must share the same dataset_id, and status === 'done')
  const compatibleRunsForB = useMemo(() => {
    if (!runs || !selectedRunA) return [];
    return runs.filter(
      (r: any) =>
        r.dataset_id === selectedRunA.dataset_id &&
        r.id !== selectedRunA.id &&
        r.status === "done"
    );
  }, [runs, selectedRunA]);

  // 2. Fetch Comparison Query when both runAId and runBId are selected
  const canCompare = Boolean(runAId && runBId && runAId !== runBId);

  const { data: compareResult, isLoading: compareLoading, isError, error } = useQuery({
    queryKey: ["compare-runs", runAId, runBId],
    queryFn: () => api.compareRuns(runAId, runBId),
    enabled: canCompare,
  });

  if (runsLoading) {
    return <CardSkeleton />;
  }

  const doneRuns = runs?.filter((r: any) => r.status === "done") || [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
          Run Comparison &amp; Transition Matrix
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Measure structural alignment and customer migration between two segmentation models.
        </p>
      </div>

      {doneRuns.length < 2 ? (
        <EmptyState
          icon={<GitCompare className="h-10 w-10 text-[#6366F1]" />}
          title="At least two completed runs required"
          description="To compare clustering models, execute at least two segmentation runs on the same dataset (e.g. RFM vs K-Means)."
          actionLabel="View Datasets"
          onAction={() => router.push("/dashboard/datasets")}
        />
      ) : (
        <div className="space-y-6">
          {/* Run Pickers */}
          <Card className="p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--foreground)] font-mono mb-4">
              Select Two Segmentation Runs of the Same Dataset
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Picker A */}
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1 font-mono">
                  Primary Model (Run A)
                </label>
                <Select
                  id="compare-select-a"
                  value={runAId}
                  onChange={(e) => {
                    setRunAId(e.target.value);
                    setRunBId(""); // Reset B when A changes
                  }}
                >
                  <option value="">-- Choose Run A --</option>
                  {doneRuns.map((r: any) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.method.toUpperCase()} • {r.dataset_name || "Dataset"})
                    </option>
                  ))}
                </Select>
              </div>

              {/* Picker B */}
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1 font-mono">
                  Comparison Model (Run B)
                </label>
                <Select
                  id="compare-select-b"
                  value={runBId}
                  disabled={!selectedRunA || compatibleRunsForB.length === 0}
                  onChange={(e) => setRunBId(e.target.value)}
                >
                  <option value="">-- Choose Run B --</option>
                  {compatibleRunsForB.map((r: any) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.method.toUpperCase()})
                    </option>
                  ))}
                </Select>
                {selectedRunA && compatibleRunsForB.length === 0 && (
                  <p className="text-[11px] text-amber-500 mt-1">
                    No other completed runs found for dataset &quot;{selectedRunA.dataset_name}&quot;. Create another run first.
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Results Display */}
          {compareLoading && <CardSkeleton />}

          {isError && (
            <ErrorCard message={(error as Error).message || "Failed to compare selected runs."} />
          )}

          {compareResult && (
            <div className="space-y-6 animate-fade-in">
              {/* Metric Card: Adjusted Rand Index */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 md:col-span-1 flex flex-col justify-between space-y-4 border-l-4 border-l-[#6366F1]">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-[var(--text-muted)]">
                      Metric
                    </span>
                    <h3 className="text-3xl font-extrabold text-[#6366F1] mt-1 font-mono">
                      ARI = {compareResult.ari}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Adjusted Rand Index (1.0 = identical, 0.0 = random chance)
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-xs text-[var(--foreground)] leading-relaxed">
                    <p className="font-semibold text-[var(--foreground)] mb-0.5">Interpretation:</p>
                    {compareResult.ari_interpretation}
                  </div>
                </Card>

                <Card className="p-6 md:col-span-2 space-y-4">
                  <h4 className="text-sm font-bold text-[var(--foreground)]">Top Migration Flows &amp; Structural Shifts</h4>
                  <p className="text-xs text-[var(--text-muted)]">
                    The 5 largest transitions between segments from Run A to Run B across {formatNumber(compareResult.shared_customers)} shared customers:
                  </p>
                  <div className="space-y-2">
                    {compareResult.top_shifts?.map((shift: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[var(--foreground)]">{shift.segment_a_name}</span>
                          <ArrowRight className="h-3 w-3 text-[var(--text-muted)]" />
                          <span className="font-semibold text-[#6366F1]">{shift.segment_b_name}</span>
                        </div>
                        <div className="text-right font-mono">
                          <span className="font-bold text-[var(--foreground)]">{shift.count} customers</span>
                          <span className="text-[var(--text-muted)] text-[11px] block">({shift.pct}% of cohort)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Movement Contingency Matrix */}
              <Card className="p-6 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-[var(--foreground)]">Contingency Movement Heatmap</h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Rows represent Run A segments; columns represent Run B segments.
                  </p>
                </div>

                <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                  <table className="w-full text-xs text-center font-mono">
                    <thead className="bg-[var(--surface-raised)] border-b border-[var(--border)] text-[var(--text-muted)]">
                      <tr>
                        <th className="p-3 text-left">Run A \ Run B</th>
                        {compareResult.labels_b?.map((lbl: string) => (
                          <th key={lbl} className="p-3 whitespace-nowrap text-xs text-[var(--foreground)] font-bold">
                            {lbl}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {compareResult.labels_a?.map((lblA: string, rIdx: number) => (
                        <tr key={lblA}>
                          <td className="p-3 text-left font-bold text-[var(--foreground)] whitespace-nowrap bg-[var(--surface-raised)]/40">
                            {lblA}
                          </td>
                          {compareResult.matrix[rIdx]?.map((cnt: number, cIdx: number) => {
                            const maxCell = Math.max(...compareResult.matrix.flat()) || 1;
                            const intensity = cnt / maxCell;
                            const bgStyle =
                              cnt > 0
                                ? { backgroundColor: `rgba(99, 102, 241, ${Math.max(0.08, intensity)})` }
                                : undefined;

                            return (
                              <td
                                key={cIdx}
                                style={bgStyle}
                                className={`p-3 font-semibold transition-colors ${
                                  cnt > 0 ? "text-[var(--foreground)] font-bold" : "text-[var(--text-muted)] opacity-40"
                                }`}
                                title={`${lblA} → ${compareResult.labels_b[cIdx]}: ${cnt} customers`}
                              >
                                {cnt}
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
          )}
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm">Loading comparison tool...</div>}>
      <CompareContent />
    </Suspense>
  );
}
