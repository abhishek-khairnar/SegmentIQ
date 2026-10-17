"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { CardSkeleton, TableSkeleton } from "@/components/common/Skeletons";
import { ErrorCard } from "@/components/common/ErrorCard";
import {
  Database, Layers, CheckCircle2, AlertTriangle, ShieldCheck,
  Edit3, Save, Table as TableIcon, BarChart3, ArrowRight, Info
} from "lucide-react";
import { formatNumber } from "@/lib/utils";

export default function DatasetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const datasetId = resolvedParams.id;
  const router = useRouter();
  const queryClient = useQueryClient();

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [mappingState, setMappingState] = useState<any>({});
  const [mappingDirty, setMappingDirty] = useState(false);

  // Fetch Dataset
  const { data: dataset, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["dataset", datasetId],
    queryFn: () => api.getDataset(datasetId),
  });

  // Fetch Preview
  const { data: preview } = useQuery({
    queryKey: ["dataset-preview", datasetId],
    queryFn: () => api.getPreview(datasetId),
    enabled: Boolean(dataset),
  });

  // Fetch Profile
  const { data: profile } = useQuery({
    queryKey: ["dataset-profile", datasetId],
    queryFn: () => api.getProfile(datasetId),
    enabled: Boolean(dataset),
  });

  useEffect(() => {
    if (dataset) {
      setMappingState(dataset.mapping_json || {});
      setRenameValue(dataset.name);
    }
  }, [dataset]);

  const patchMutation = useMutation({
    mutationFn: (body: { name?: string; mapping_json?: any }) =>
      api.patchDataset(datasetId, body),
    onSuccess: (updated) => {
      toast.success("Dataset configuration updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["dataset", datasetId] });
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
      setMappingDirty(false);
      setRenameOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update dataset configuration.");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-10 w-64 bg-[var(--surface-raised)] rounded-md animate-pulse" />
        <CardSkeleton />
        <TableSkeleton rows={4} cols={5} />
      </div>
    );
  }

  if (isError || !dataset) {
    return <ErrorCard message={(error as Error)?.message || "Dataset not found."} onRetry={() => refetch()} />;
  }

  // Validate mapping
  const isTransactions = dataset.source_type === "transactions";
  const isMappingValid = isTransactions
    ? Boolean(mappingState.customer_id && mappingState.date && mappingState.amount)
    : Boolean(mappingState.customer_id && mappingState.feature_columns?.length > 0);

  const availableColumns = preview?.columns || Object.keys(dataset.schema_json || {});

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
              {dataset.name}
            </h1>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[var(--text-muted)] hover:text-[var(--foreground)]"
              onClick={() => setRenameOpen(true)}
              title="Rename dataset"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <Badge variant={isTransactions ? "default" : "secondary"}>
              {dataset.source_type}
            </Badge>
          </div>
          <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
            File: {dataset.original_filename} • {formatNumber(dataset.row_count)} rows • {dataset.column_count} columns
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href={`/dashboard/datasets/${dataset.id}/segment`}>
            <Button
              variant="primary"
              className="gap-2 shadow-sm"
              disabled={!isMappingValid}
            >
              <Layers className="h-4 w-4" />
              Segment this dataset
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Mapping Validity Alert if not valid */}
      {!isMappingValid && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-[#F5A524] shrink-0 mt-0.5" />
          <div className="text-xs text-[var(--foreground)]">
            <p className="font-semibold text-sm">Column mapping required</p>
            <p className="text-[var(--text-muted)] mt-0.5">
              {isTransactions
                ? "Please map Customer ID, Order Date, and Spend Amount below before running segmentation."
                : "Please map Customer ID and select at least one numeric feature column below."}
            </p>
          </div>
        </div>
      )}

      {/* Grid: Column Mapping Card & Data Quality Audit Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Column Mapping Card */}
        <Card className="lg:col-span-7 p-6 space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <div>
              <h3 className="text-base font-bold text-[var(--foreground)]">Column Mapping Configuration</h3>
              <p className="text-xs text-[var(--text-muted)]">Verified automatically from column names and types</p>
            </div>
            {mappingDirty && (
              <Badge variant="warning">Unsaved Changes</Badge>
            )}
          </div>

          {isTransactions ? (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-1">
                  Customer ID Column <span className="text-red-500">*</span>
                </label>
                <Select
                  value={mappingState.customer_id || ""}
                  onChange={(e) => {
                    setMappingState({ ...mappingState, customer_id: e.target.value });
                    setMappingDirty(true);
                  }}
                >
                  <option value="">-- Select Column --</option>
                  {availableColumns.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-1">
                  Order Date Column <span className="text-red-500">*</span>
                </label>
                <Select
                  value={mappingState.date || ""}
                  onChange={(e) => {
                    setMappingState({ ...mappingState, date: e.target.value });
                    setMappingDirty(true);
                  }}
                >
                  <option value="">-- Select Column --</option>
                  {availableColumns.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-1">
                  Spend Amount Column <span className="text-red-500">*</span>
                </label>
                <Select
                  value={mappingState.amount || ""}
                  onChange={(e) => {
                    setMappingState({ ...mappingState, amount: e.target.value });
                    setMappingDirty(true);
                  }}
                >
                  <option value="">-- Select Column --</option>
                  {availableColumns.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-medium text-[var(--text-muted)] mb-1">
                    Order ID (Optional)
                  </label>
                  <Select
                    value={mappingState.order_id || ""}
                    onChange={(e) => {
                      setMappingState({ ...mappingState, order_id: e.target.value || undefined });
                      setMappingDirty(true);
                    }}
                  >
                    <option value="">-- None --</option>
                    {availableColumns.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block font-medium text-[var(--text-muted)] mb-1">
                    Product Category (Optional)
                  </label>
                  <Select
                    value={mappingState.category || ""}
                    onChange={(e) => {
                      setMappingState({ ...mappingState, category: e.target.value || undefined });
                      setMappingDirty(true);
                    }}
                  >
                    <option value="">-- None --</option>
                    {availableColumns.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-1">
                  Customer ID Column <span className="text-red-500">*</span>
                </label>
                <Select
                  value={mappingState.customer_id || ""}
                  onChange={(e) => {
                    setMappingState({ ...mappingState, customer_id: e.target.value });
                    setMappingDirty(true);
                  }}
                >
                  <option value="">-- Select Column --</option>
                  {availableColumns.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-2">
                  Feature Columns Allowed for Clustering <span className="text-red-500">*</span>
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)]/40">
                  {availableColumns
                    .filter((c) => c !== mappingState.customer_id)
                    .map((col) => {
                      const isChecked = (mappingState.feature_columns || []).includes(col);
                      return (
                        <label key={col} className="flex items-center gap-2 cursor-pointer text-xs text-[var(--foreground)]">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const current = mappingState.feature_columns || [];
                              const updated = e.target.checked
                                ? [...current, col]
                                : current.filter((c: string) => c !== col);
                              setMappingState({ ...mappingState, feature_columns: updated });
                              setMappingDirty(true);
                            }}
                            className="rounded border-[var(--border)] text-[#6366F1] focus:ring-[#6366F1]"
                          />
                          <span className="font-mono">{col}</span>
                        </label>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <Button
              variant="primary"
              size="sm"
              disabled={!mappingDirty || patchMutation.isPending}
              isLoading={patchMutation.isPending}
              onClick={() => patchMutation.mutate({ mapping_json: mappingState })}
              className="gap-2"
            >
              <Save className="h-3.5 w-3.5" />
              Save Mapping
            </Button>
          </div>
        </Card>

        {/* Data Quality Card */}
        <Card className="lg:col-span-5 p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
            <ShieldCheck className="h-5 w-5 text-[#22C55E]" />
            <h3 className="text-base font-bold text-[var(--foreground)]">Data Quality Audit</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] flex justify-between items-center">
              <span className="text-[var(--text-muted)]">Raw Ingestion Rows</span>
              <span className="font-mono font-bold text-[var(--foreground)]">
                {formatNumber(dataset.quality_json?.raw_rows || dataset.row_count)}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] flex justify-between items-center">
              <span className="text-[var(--text-muted)]">Duplicate Rows Pruned</span>
              <span className="font-mono text-[var(--foreground)]">
                {dataset.quality_json?.duplicate_rows_removed || dataset.quality_json?.duplicate_customers_removed || 0}
              </span>
            </div>

            {dataset.source_type === "transactions" && (
              <div className="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] flex justify-between items-center">
                <span className="text-[var(--text-muted)]">Returns/Zero Spend Excluded</span>
                <span className="font-mono text-[var(--foreground)]">
                  {dataset.quality_json?.returns_or_negative_amounts_excluded || 0}
                </span>
              </div>
            )}

            <div className="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] flex justify-between items-center">
              <span className="text-[var(--text-muted)]">Detected Encoding & Delimiter</span>
              <span className="font-mono text-[#6366F1]">
                {dataset.quality_json?.encoding_detected || "UTF-8"} (delimiter &apos;{dataset.quality_json?.delimiter_detected || ","}&apos;)
              </span>
            </div>
          </div>

          {dataset.quality_json?.actions_taken?.length > 0 && (
            <div className="pt-2 border-t border-[var(--border)] space-y-1">
              <p className="text-[11px] font-semibold text-[var(--foreground)]">Cleaning Actions Applied:</p>
              <ul className="space-y-1 text-[11px] text-[var(--text-muted)] list-disc list-inside">
                {dataset.quality_json.actions_taken.map((act: string, idx: number) => (
                  <li key={idx}>{act}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>

      {/* Column Profile Table */}
      {profile && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
            <BarChart3 className="h-5 w-5 text-[#6366F1]" />
            <h3 className="text-base font-bold text-[var(--foreground)]">Column Profiles & Statistical Summaries</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--surface-raised)] border-b border-[var(--border)] text-[var(--text-muted)] font-mono uppercase">
                <tr>
                  <th className="p-3">Column</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Missing %</th>
                  <th className="p-3">Min</th>
                  <th className="p-3">Max</th>
                  <th className="p-3">Mean</th>
                  <th className="p-3">Unique</th>
                  <th className="p-3">Mini Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] font-mono">
                {profile.columns.map((c: any) => (
                  <tr key={c.name} className="hover:bg-[var(--surface-raised)]/50 transition-colors">
                    <td className="p-3 font-semibold text-[var(--foreground)]">{c.name}</td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-[10px] uppercase font-mono">{c.inferred_type}</Badge>
                    </td>
                    <td className="p-3 text-[var(--text-muted)]">{c.missing_pct}%</td>
                    <td className="p-3 text-[var(--foreground)]">{c.min !== null ? c.min : "—"}</td>
                    <td className="p-3 text-[var(--foreground)]">{c.max !== null ? c.max : "—"}</td>
                    <td className="p-3 text-[var(--foreground)]">{c.mean !== null ? c.mean : "—"}</td>
                    <td className="p-3 text-[var(--text-muted)]">{formatNumber(c.unique_count)}</td>
                    <td className="p-3">
                      {c.histogram && c.histogram.length > 0 ? (
                        <div className="flex items-end h-6 w-24 gap-0.5 bg-[var(--surface-raised)] p-0.5 rounded">
                          {c.histogram.map((bin: any, bIdx: number) => {
                            const maxCount = Math.max(...c.histogram.map((h: any) => h.count)) || 1;
                            const heightPct = Math.max(10, Math.round((bin.count / maxCount) * 100));
                            return (
                              <div
                                key={bIdx}
                                className="flex-1 bg-[#6366F1] rounded-t-xs"
                                style={{ height: `${heightPct}%` }}
                                title={`${bin.bin}: ${bin.count} rows`}
                              />
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-[var(--text-muted)]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Row Preview (First 50 Rows) */}
      {preview && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <TableIcon className="h-5 w-5 text-[#6366F1]" />
              <h3 className="text-base font-bold text-[var(--foreground)]">Raw Data Preview</h3>
            </div>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              Showing first 50 of {formatNumber(preview.total_rows)} rows
            </span>
          </div>

          <div className="overflow-x-auto max-h-96 rounded-lg border border-[var(--border)]">
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--surface-raised)] border-b border-[var(--border)] text-[var(--text-muted)] font-mono uppercase sticky top-0">
                <tr>
                  {preview.columns.map((col) => (
                    <th key={col} className="p-3 whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] font-mono">
                {preview.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-[var(--surface-raised)]/40 transition-colors">
                    {preview.columns.map((col) => (
                      <td key={col} className="p-3 whitespace-nowrap text-[var(--foreground)]">
                        {row[col] !== null ? String(row[col]) : <span className="text-[var(--text-muted)]">NULL</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Rename Dialog */}
      {renameOpen && (
        <Dialog
          open={renameOpen}
          onOpenChange={setRenameOpen}
          title="Rename Dataset"
          description="Update the display name for this dataset."
        >
          <div className="space-y-4 pt-2">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Dataset Name"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setRenameOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={!renameValue.trim() || renameValue.trim() === dataset.name}
                isLoading={patchMutation.isPending}
                onClick={() => patchMutation.mutate({ name: renameValue.trim() })}
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
