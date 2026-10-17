"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  Database, Plus, Search, PlaySquare, Trash2, Edit3,
  ExternalLink, Layers, ArrowUpDown
} from "lucide-react";
import { formatNumber } from "@/lib/utils";

function DatasetsListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const urlSearch = searchParams.get("q") || "";
  const urlSort = searchParams.get("sort") || "newest";

  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [sortBy, setSortBy] = useState(urlSort);

  // Modals state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Sync search and sort with URL
  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams();
      if (searchTerm) params.set("q", searchTerm);
      if (sortBy !== "newest") params.set("sort", sortBy);
      const queryStr = params.toString() ? `?${params.toString()}` : "";
      router.replace(`/dashboard/datasets${queryStr}`);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, sortBy, router]);

  const { data: datasets, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["datasets"],
    queryFn: () => api.listDatasets(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteDataset(id),
    onSuccess: () => {
      toast.success("Dataset successfully deleted.");
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete dataset.");
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.patchDataset(id, { name }),
    onSuccess: (data) => {
      toast.success(`Dataset renamed to "${data.name}".`);
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
      setRenameTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to rename dataset.");
    },
  });

  // Filter & sort
  const filteredDatasets = useMemo(() => {
    if (!datasets) return [];
    let list = datasets.filter((d: any) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.original_filename.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortBy === "name") {
      list.sort((a: any, b: any) => a.name.localeCompare(b.name));
    } else if (sortBy === "rows") {
      list.sort((a: any, b: any) => b.row_count - a.row_count);
    } else {
      // newest
      list.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return list;
  }, [datasets, searchTerm, sortBy]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div className="h-8 w-40 bg-[var(--surface-raised)] rounded-md animate-pulse" />
          <div className="h-10 w-32 bg-[var(--surface-raised)] rounded-md animate-pulse" />
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
            Datasets
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Manage your uploaded transaction logs and customer feature matrices.
          </p>
        </div>
        <Link href="/dashboard/datasets/new">
          <Button variant="primary" className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            Upload dataset
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--text-muted)]" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search datasets by name or filename..."
            className="pl-9 text-sm"
          />
        </div>

        <div className="w-full sm:w-48">
          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Sort: Newest first</option>
            <option value="name">Sort: Name (A-Z)</option>
            <option value="rows">Sort: Row count</option>
          </Select>
        </div>
      </div>

      {/* Datasets Table / Cards */}
      {filteredDatasets.length === 0 ? (
        <EmptyState
          icon={<Database className="h-10 w-10 text-[#6366F1]" />}
          title={searchTerm ? "No matching datasets found" : "No datasets uploaded yet"}
          description={
            searchTerm
              ? `No datasets match your query "${searchTerm}". Try adjusting your keywords or clearing the filter.`
              : "Upload a customer CSV (transactions or feature table) or use one of our pre-packaged samples."
          }
          actionLabel="Upload dataset"
          onAction={() => router.push("/dashboard/datasets/new")}
        />
      ) : (
        <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--surface)] shadow-sm">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--surface-raised)] border-b border-[var(--border)] text-[var(--text-muted)] font-mono uppercase">
                <tr>
                  <th className="p-4">Dataset Name</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Rows</th>
                  <th className="p-4">Columns</th>
                  <th className="p-4">Runs</th>
                  <th className="p-4">Uploaded</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredDatasets.map((d: any) => (
                  <tr key={d.id} className="hover:bg-[var(--surface-raised)]/50 transition-colors">
                    <td className="p-4">
                      <Link
                        href={`/dashboard/datasets/${d.id}`}
                        className="font-semibold text-sm text-[var(--foreground)] hover:text-[#6366F1] flex items-center gap-1.5"
                      >
                        {d.name}
                      </Link>
                      <span className="text-[11px] font-mono text-[var(--text-muted)] block mt-0.5">
                        {d.original_filename}
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge variant={d.source_type === "transactions" ? "default" : "secondary"}>
                        {d.source_type}
                      </Badge>
                    </td>
                    <td className="p-4 font-mono font-medium text-[var(--foreground)]">
                      {formatNumber(d.row_count)}
                    </td>
                    <td className="p-4 font-mono text-[var(--text-muted)]">
                      {d.column_count}
                    </td>
                    <td className="p-4 font-mono text-[var(--foreground)]">
                      {d.runs_count} runs
                    </td>
                    <td className="p-4 text-[var(--text-muted)]">
                      {new Date(d.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/dashboard/datasets/${d.id}/segment`}>
                          <Button variant="primary" size="sm" className="h-7 px-2.5 text-xs gap-1">
                            <Layers className="h-3 w-3" />
                            Segment
                          </Button>
                        </Link>
                        <Link href={`/dashboard/datasets/${d.id}`}>
                          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" title="Open details">
                            Open
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-[var(--text-muted)] hover:text-[var(--foreground)]"
                          onClick={() => {
                            setRenameTarget({ id: d.id, name: d.name });
                            setRenameValue(d.name);
                          }}
                          title="Rename"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-[var(--text-muted)] hover:text-[#EF4444]"
                          onClick={() => setDeleteTarget({ id: d.id, name: d.name })}
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

          {/* Mobile Stacked Cards View */}
          <div className="md:hidden divide-y divide-[var(--border)]">
            {filteredDatasets.map((d: any) => (
              <div key={d.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <Link
                      href={`/dashboard/datasets/${d.id}`}
                      className="font-semibold text-sm text-[var(--foreground)] hover:text-[#6366F1]"
                    >
                      {d.name}
                    </Link>
                    <span className="text-xs text-[var(--text-muted)] font-mono block">
                      {d.original_filename}
                    </span>
                  </div>
                  <Badge variant={d.source_type === "transactions" ? "default" : "secondary"}>
                    {d.source_type}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs font-mono text-[var(--text-muted)] pt-1">
                  <div>
                    <span className="block text-[10px] uppercase">Rows</span>
                    <span className="font-semibold text-[var(--foreground)]">{formatNumber(d.row_count)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase">Cols</span>
                    <span className="font-semibold text-[var(--foreground)]">{d.column_count}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase">Runs</span>
                    <span className="font-semibold text-[var(--foreground)]">{d.runs_count}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                  <Link href={`/dashboard/datasets/${d.id}/segment`}>
                    <Button variant="primary" size="sm" className="h-8 text-xs">
                      Segment
                    </Button>
                  </Link>
                  <Link href={`/dashboard/datasets/${d.id}`}>
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      Open
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-[#EF4444]"
                    onClick={() => setDeleteTarget({ id: d.id, name: d.name })}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="Delete Dataset"
          description="Are you sure you want to permanently delete this dataset? All associated clustering runs, segment profiles, and assignments will also be purged."
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
          title="Rename Dataset"
          description="Enter a new display name for this dataset."
        >
          <div className="space-y-4 pt-2">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Dataset Name"
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
                Save Name
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

export default function DatasetsListPage() {
  return (
    <React.Suspense fallback={<div className="p-6"><TableSkeleton rows={6} /></div>}>
      <DatasetsListContent />
    </React.Suspense>
  );
}
