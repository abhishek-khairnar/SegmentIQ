"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/common/EmptyState";
import { TableSkeleton } from "@/components/common/Skeletons";
import { ErrorCard } from "@/components/common/ErrorCard";
import {
  PlaySquare, CheckCircle2, AlertCircle, Trash2, Edit3,
  GitCompare, ArrowRight, Search, Filter
} from "lucide-react";
import { formatNumber } from "@/lib/utils";

export default function RunsListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const { data: runs, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["runs"],
    queryFn: () => api.listRuns(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteRun(id),
    onSuccess: () => {
      toast.success("Segmentation run deleted.");
      queryClient.invalidateQueries({ queryKey: ["runs"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete run.");
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.renameRun(id, { name }),
    onSuccess: (data) => {
      toast.success(`Run renamed to "${data.name}".`);
      queryClient.invalidateQueries({ queryKey: ["runs"] });
      setRenameTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to rename run.");
    },
  });

  const filteredRuns = useMemo(() => {
    if (!runs) return [];
    return runs.filter((r: any) => {
      const matchSearch =
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.dataset_name && r.dataset_name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchMethod = methodFilter === "all" || r.method.toLowerCase() === methodFilter.toLowerCase();
      return matchSearch && matchMethod;
    });
  }, [runs, searchTerm, methodFilter]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div className="h-8 w-40 bg-[var(--surface-raised)] rounded-md animate-pulse" />
        </div>
        <TableSkeleton rows={5} cols={6} />
      </div>
    );
  }

  if (isError) {
    return <ErrorCard message={(error as Error).message} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
            Segmentation Runs
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Browse and compare all generated customer segments and cluster models.
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--text-muted)]" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search runs by name or dataset..."
            className="pl-9 text-sm"
          />
        </div>

        <div className="w-full sm:w-48">
          <Select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}>
            <option value="all">All Methods</option>
            <option value="rfm">RFM Rules</option>
            <option value="kmeans">K-Means</option>
            <option value="hierarchical">Hierarchical</option>
            <option value="dbscan">DBSCAN</option>
          </Select>
        </div>
      </div>

      {/* Runs Table */}
      {filteredRuns.length === 0 ? (
        <EmptyState
          icon={<PlaySquare className="h-10 w-10 text-[#6366F1]" />}
          title={searchTerm || methodFilter !== "all" ? "No matching runs found" : "No segmentation runs yet"}
          description={
            searchTerm || methodFilter !== "all"
              ? "No runs match your current filter settings. Try adjusting your search query."
              : "Open any dataset from your Datasets tab to execute your first segmentation run."
          }
          actionLabel="Go to Datasets"
          onAction={() => router.push("/dashboard/datasets")}
        />
      ) : (
        <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--surface)] shadow-sm">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--surface-raised)] border-b border-[var(--border)] text-[var(--text-muted)] font-mono uppercase">
                <tr>
                  <th className="p-4">Run Name</th>
                  <th className="p-4">Dataset</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Segments</th>
                  <th className="p-4">Silhouette</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredRuns.map((r: any) => (
                  <tr key={r.id} className="hover:bg-[var(--surface-raised)]/50 transition-colors">
                    <td className="p-4 font-semibold text-sm text-[var(--foreground)]">
                      <Link href={`/dashboard/runs/${r.id}`} className="hover:text-[#6366F1] flex items-center gap-1.5">
                        {r.name}
                      </Link>
                      <span className="text-[11px] font-mono text-[var(--text-muted)] block mt-0.5">
                        {new Date(r.created_at).toLocaleString()}
                      </span>
                    </td>
                    <td className="p-4">
                      {r.dataset_name ? (
                        <Link href={`/dashboard/datasets/${r.dataset_id}`} className="hover:underline text-[var(--foreground)]">
                          {r.dataset_name}
                        </Link>
                      ) : (
                        <span className="text-[var(--text-muted)]">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary" className="font-mono uppercase text-[10px]">
                        {r.method}
                      </Badge>
                    </td>
                    <td className="p-4 font-mono font-medium text-[var(--foreground)]">
                      {r.n_segments} clusters
                    </td>
                    <td className="p-4 font-mono text-[var(--text-muted)]">
                      {r.metrics_json?.silhouette !== undefined ? r.metrics_json.silhouette.toFixed(3) : "—"}
                    </td>
                    <td className="p-4">
                      {r.status === "done" && (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Done
                        </Badge>
                      )}
                      {r.status === "running" && (
                        <Badge variant="warning" className="gap-1 animate-pulse">
                          Running
                        </Badge>
                      )}
                      {r.status === "failed" && (
                        <Badge variant="danger" className="gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Failed
                        </Badge>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/dashboard/runs/${r.id}`}>
                          <Button variant="primary" size="sm" className="h-7 px-2.5 text-xs">
                            Open
                          </Button>
                        </Link>
                        <Link href={`/dashboard/compare?a=${r.id}`}>
                          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" title="Compare against another run">
                            <GitCompare className="h-3 w-3" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-[var(--text-muted)] hover:text-[var(--foreground)]"
                          onClick={() => {
                            setRenameTarget({ id: r.id, name: r.name });
                            setRenameValue(r.name);
                          }}
                          title="Rename"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-[var(--text-muted)] hover:text-[#EF4444]"
                          onClick={() => setDeleteTarget({ id: r.id, name: r.name })}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked View */}
          <div className="md:hidden divide-y divide-[var(--border)]">
            {filteredRuns.map((r: any) => (
              <div key={r.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <Link href={`/dashboard/runs/${r.id}`} className="font-semibold text-sm text-[var(--foreground)] hover:text-[#6366F1]">
                      {r.name}
                    </Link>
                    <span className="text-xs text-[var(--text-muted)] font-mono block">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <Badge variant="secondary" className="uppercase font-mono text-[10px]">
                    {r.method}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)] pt-1">
                  <span>{r.n_segments} clusters</span>
                  <span>Sil: {r.metrics_json?.silhouette !== undefined ? r.metrics_json.silhouette.toFixed(3) : "—"}</span>
                  <Badge variant={r.status === "done" ? "success" : r.status === "failed" ? "danger" : "warning"}>
                    {r.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                  <Link href={`/dashboard/runs/${r.id}`}>
                    <Button variant="primary" size="sm" className="h-8 text-xs">
                      Open
                    </Button>
                  </Link>
                  <Link href={`/dashboard/compare?a=${r.id}`}>
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      Compare
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-[#EF4444]"
                    onClick={() => setDeleteTarget({ id: r.id, name: r.name })}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="Delete Segmentation Run"
          description="Are you sure you want to delete this analysis run? All segments and assigned customer scores will be removed."
          itemName={deleteTarget.name}
          confirmText="Delete permanently"
          isDestructive={true}
          isLoading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        />
      )}

      {/* Rename Dialog */}
      {renameTarget && (
        <Dialog
          open={Boolean(renameTarget)}
          onOpenChange={(open) => !open && setRenameTarget(null)}
          title="Rename Run"
          description="Enter a new display name for this segmentation analysis."
        >
          <div className="space-y-4 pt-2">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Run Name"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setRenameTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={!renameValue.trim() || renameValue.trim() === renameTarget.name}
                isLoading={renameMutation.isPending}
                onClick={() =>
                  renameMutation.mutate({ id: renameTarget.id, name: renameValue.trim() })
                }
              >
                Save
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
