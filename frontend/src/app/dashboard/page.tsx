"use client";

import React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/EmptyState";
import { CardSkeleton, TableSkeleton } from "@/components/common/Skeletons";
import { ErrorCard } from "@/components/common/ErrorCard";
import {
  Database, PlaySquare, Users, Clock, Plus,
  Sparkles, ArrowRight, CheckCircle2, AlertCircle, ChevronRight
} from "lucide-react";
import { formatNumber } from "@/lib/utils";

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: summary,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => api.getDashboardSummary(),
  });

  const loadSampleMutation = useMutation({
    mutationFn: (sampleKey: string) => api.loadSample(sampleKey),
    onSuccess: (data) => {
      toast.success(`Sample dataset "${data.name}" loaded successfully!`);
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to load sample dataset.");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-[var(--surface-raised)] rounded-md animate-pulse" />
          <div className="h-10 w-32 bg-[var(--surface-raised)] rounded-md animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <TableSkeleton rows={4} cols={5} />
      </div>
    );
  }

  if (isError) {
    return <ErrorCard message={(error as Error).message} onRetry={() => refetch()} />;
  }

  const hasData = summary && (summary.datasets_count > 0 || summary.runs_count > 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
            Welcome, {user?.name || "Analyst"}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Monitor datasets, execute clustering workflows, and inspect audience segments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/datasets/new">
            <Button variant="primary" className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" />
              New dataset
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Datasets count */}
        <Card className="flex items-center gap-4 p-5">
          <div className="h-12 w-12 rounded-xl bg-[#6366F1]/10 text-[#6366F1] flex items-center justify-center shrink-0">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] font-mono">
              Datasets
            </p>
            <h3 className="text-2xl font-extrabold text-[var(--foreground)] mt-0.5">
              {formatNumber(summary?.datasets_count || 0)}
            </h3>
          </div>
        </Card>

        {/* Runs count */}
        <Card className="flex items-center gap-4 p-5">
          <div className="h-12 w-12 rounded-xl bg-[#A78BFA]/10 text-[#A78BFA] flex items-center justify-center shrink-0">
            <PlaySquare className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] font-mono">
              Segmentation Runs
            </p>
            <h3 className="text-2xl font-extrabold text-[var(--foreground)] mt-0.5">
              {formatNumber(summary?.runs_count || 0)}
            </h3>
          </div>
        </Card>

        {/* Customers segmented */}
        <Card className="flex items-center gap-4 p-5">
          <div className="h-12 w-12 rounded-xl bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] font-mono">
              Customers Profiled
            </p>
            <h3 className="text-2xl font-extrabold text-[var(--foreground)] mt-0.5">
              {formatNumber(summary?.customers_segmented || 0)}
            </h3>
          </div>
        </Card>

        {/* Last run date */}
        <Card className="flex items-center gap-4 p-5">
          <div className="h-12 w-12 rounded-xl bg-[#F5A524]/10 text-[#F5A524] flex items-center justify-center shrink-0">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] font-mono">
              Last Analysis
            </p>
            <h3 className="text-sm font-semibold text-[var(--foreground)] mt-1 truncate max-w-[130px]">
              {summary?.last_run_date
                ? new Date(summary.last_run_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "No runs yet"}
            </h3>
          </div>
        </Card>
      </div>

      {!hasData ? (
        /* Full Empty State for New Users */
        <Card className="p-8 sm:p-12 text-center border-dashed border-[var(--border)] bg-[var(--surface)]">
          <div className="h-14 w-14 rounded-2xl bg-[#6366F1]/10 text-[#6366F1] flex items-center justify-center mx-auto mb-4">
            <Database className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-[var(--foreground)]">No datasets loaded yet</h2>
          <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto mt-1 mb-6 leading-relaxed">
            Get started by uploading your own transaction CSV or load one of our pre-configured sample datasets with a single click.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/dashboard/datasets/new">
              <Button variant="primary" className="gap-2">
                <Plus className="h-4 w-4" />
                Upload Customer CSV
              </Button>
            </Link>
            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => loadSampleMutation.mutate("online_store_transactions")}
              isLoading={loadSampleMutation.isPending}
            >
              <Sparkles className="h-4 w-4 text-[#F5A524]" />
              Load Online Store Transactions (Sample)
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Recent Runs Table (5 Rows) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[var(--foreground)]">Recent Segmentation Runs</h2>
                <p className="text-xs text-[var(--text-muted)]">Your latest clustering and RFM outputs</p>
              </div>
              <Link href="/dashboard/runs" className="text-xs font-semibold text-[#6366F1] hover:underline flex items-center gap-1">
                View all runs
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {summary?.recent_runs && summary.recent_runs.length > 0 ? (
              <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--surface)]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[var(--surface-raised)] border-b border-[var(--border)] text-[var(--text-muted)] font-mono uppercase">
                    <tr>
                      <th className="p-3.5">Run Name</th>
                      <th className="p-3.5">Method</th>
                      <th className="p-3.5">Segments</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {summary.recent_runs.map((run: any) => (
                      <tr key={run.id} className="hover:bg-[var(--surface-raised)]/60 transition-colors">
                        <td className="p-3.5 font-medium text-[var(--foreground)]">
                          <Link href={`/dashboard/runs/${run.id}`} className="hover:text-[#6366F1] font-semibold flex items-center gap-2">
                            {run.name}
                          </Link>
                          <span className="text-[11px] text-[var(--text-muted)] font-normal block">
                            {new Date(run.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <Badge variant="secondary" className="uppercase font-mono text-[10px]">
                            {run.method}
                          </Badge>
                        </td>
                        <td className="p-3.5 font-mono text-[var(--foreground)]">
                          {run.n_segments} clusters
                        </td>
                        <td className="p-3.5">
                          {run.status === "done" && (
                            <Badge variant="success" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Done
                            </Badge>
                          )}
                          {run.status === "running" && (
                            <Badge variant="warning" className="gap-1 animate-pulse">
                              Running...
                            </Badge>
                          )}
                          {run.status === "failed" && (
                            <Badge variant="danger" className="gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Failed
                            </Badge>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <Link href={`/dashboard/runs/${run.id}`}>
                            <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs text-[#6366F1]">
                              Open →
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Card className="p-6 text-center text-sm text-[var(--text-muted)] border-dashed">
                No runs recorded yet. Open a dataset to run your first segmentation.
              </Card>
            )}
          </div>

          {/* Quick Start & Shortcuts Card */}
          <div className="lg:col-span-4 space-y-4">
            <h2 className="text-lg font-bold text-[var(--foreground)]">Quick Actions</h2>
            <Card className="p-5 space-y-4 bg-[var(--surface)] border-[var(--border)]">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#F5A524]" />
                  Pre-Packaged Samples
                </h4>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Try our realistic datasets to explore RFM rules or mall clustering in one click:
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between text-xs"
                  onClick={() => loadSampleMutation.mutate("online_store_transactions")}
                  isLoading={loadSampleMutation.isPending}
                >
                  <span>Online Store Transactions</span>
                  <span className="font-mono text-[10px] text-[var(--text-muted)]">2,500 cust</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between text-xs"
                  onClick={() => loadSampleMutation.mutate("mall_customers")}
                  isLoading={loadSampleMutation.isPending}
                >
                  <span>Mall Customer Features</span>
                  <span className="font-mono text-[10px] text-[var(--text-muted)]">500 cust</span>
                </Button>
              </div>

              <div className="pt-3 border-t border-[var(--border)]">
                <Link href="/dashboard/datasets/new" className="w-full block">
                  <Button variant="primary" size="sm" className="w-full gap-2">
                    <Plus className="h-3.5 w-3.5" />
                    Upload Custom CSV
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
