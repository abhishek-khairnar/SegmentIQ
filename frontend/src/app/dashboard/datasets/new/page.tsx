"use client";

import React, { useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  UploadCloud, FileSpreadsheet, Sparkles, CheckCircle2,
  AlertCircle, ArrowRight, Database, Info, Layers
} from "lucide-react";

function NewDatasetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const isSampleDefault = searchParams.get("sample") === "1";
  const [activeTab, setActiveTab] = useState(isSampleDefault ? "sample" : "upload");

  // Upload Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceType, setSourceType] = useState<"transactions" | "features">("transactions");
  const [datasetName, setDatasetName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Invalid file format. Please upload a .csv file.");
      return;
    }
    const maxBytes = 20 * 1024 * 1024; // 20 MB
    if (file.size > maxBytes) {
      toast.error("File exceeds 20 MB limit. Please upload a smaller file.");
      return;
    }
    setSelectedFile(file);
    if (!datasetName) {
      // Auto-populate name from file stem
      const stem = file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
      setDatasetName(stem.charAt(0).toUpperCase() + stem.slice(1));
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error("Please select a CSV file to upload.");
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("source_type", sourceType);
      if (datasetName.trim()) {
        formData.append("name", datasetName.trim());
      }
      return api.uploadDataset(formData);
    },
    onSuccess: (data) => {
      toast.success("Dataset uploaded and processed successfully!");
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      router.push(`/dashboard/datasets/${data.id}`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to upload and process dataset.");
    },
  });

  const sampleMutation = useMutation({
    mutationFn: (sampleKey: string) => api.loadSample(sampleKey),
    onSuccess: (data) => {
      toast.success(`Sample "${data.name}" loaded successfully!`);
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      router.push(`/dashboard/datasets/${data.id}`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to load sample dataset.");
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
          New Dataset
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Upload your customer data or choose one of our verified, pre-packaged sample cohorts.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 max-w-md">
          <TabsTrigger value="upload" className="gap-2">
            <UploadCloud className="h-4 w-4" />
            Upload CSV
          </TabsTrigger>
          <TabsTrigger value="sample" className="gap-2">
            <Sparkles className="h-4 w-4 text-[#F5A524]" />
            Use Sample
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Upload CSV */}
        <TabsContent value="upload" className="space-y-6">
          <Card className="p-6 sm:p-8 space-y-6 shadow-sm">
            {/* Drag & Drop Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  validateAndSetFile(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragOver
                  ? "border-[#6366F1] bg-[#6366F1]/5"
                  : selectedFile
                  ? "border-green-500/50 bg-green-500/5"
                  : "border-[var(--border)] bg-[var(--surface-raised)]/30 hover:bg-[var(--surface-raised)]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    validateAndSetFile(e.target.files[0]);
                  }
                }}
              />

              {selectedFile ? (
                <div className="space-y-2">
                  <div className="h-12 w-12 rounded-full bg-green-500/10 text-[#22C55E] flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="text-base font-semibold text-[var(--foreground)]">{selectedFile.name}</h4>
                  <p className="text-xs text-[var(--text-muted)] font-mono">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for ingestion
                  </p>
                  <Button variant="ghost" size="sm" className="mt-2 text-xs text-[#6366F1]">
                    Click to select a different file
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="h-12 w-12 rounded-full bg-[#6366F1]/10 text-[#6366F1] flex items-center justify-center mx-auto">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-[var(--foreground)]">
                      Drop your CSV file here, or browse
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Max file size: 20 MB • Up to 200,000 rows • UTF-8 CSV
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Choose Data Type */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[var(--foreground)] uppercase font-mono">
                Choose Data Type Structure
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => setSourceType("transactions")}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    sourceType === "transactions"
                      ? "border-[#6366F1] bg-[#6366F1]/5"
                      : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-raised)]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-[var(--foreground)]">Transaction Logs</span>
                    {sourceType === "transactions" && <CheckCircle2 className="h-4 w-4 text-[#6366F1]" />}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Multiple rows per customer. Each row represents a single order with customer ID, purchase date, and monetary spend.
                  </p>
                </div>

                <div
                  onClick={() => setSourceType("features")}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    sourceType === "features"
                      ? "border-[#6366F1] bg-[#6366F1]/5"
                      : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-raised)]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-[var(--foreground)]">Customer Features</span>
                    {sourceType === "features" && <CheckCircle2 className="h-4 w-4 text-[#6366F1]" />}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Exactly one row per customer. Contains pre-aggregated numeric feature columns (e.g., annual income, spending score, visits).
                  </p>
                </div>
              </div>
            </div>

            {/* Dataset Name Input */}
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5 uppercase font-mono">
                Dataset Display Name (Optional)
              </label>
              <Input
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
                placeholder="e.g. Q3 Store Transactions"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex justify-end">
              <Button
                variant="primary"
                size="lg"
                className="gap-2 w-full sm:w-auto"
                disabled={!selectedFile || uploadMutation.isPending}
                isLoading={uploadMutation.isPending}
                onClick={() => uploadMutation.mutate()}
              >
                Upload & Process Dataset
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 2: Use Sample */}
        <TabsContent value="sample" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sample 1: Online Store Transactions */}
            <Card className="p-6 flex flex-col justify-between space-y-4 hover:border-[#6366F1]/40 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="default">Transactions</Badge>
                  <span className="font-mono text-xs text-[var(--text-muted)]">~2,500 customers</span>
                </div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">Online Store Transactions</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Realistically skewed e-commerce purchase history spanning 2 years across 6 product categories. Perfect for running 11-segment RFM scoring, discovering high-value regulars, and identifying lapsed customers.
                </p>
                <div className="p-2.5 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[11px] font-mono text-[var(--foreground)]">
                  Columns: order_id, customer_id, order_date, amount, category
                </div>
              </div>

              <Button
                variant="primary"
                className="w-full gap-2 mt-4"
                isLoading={sampleMutation.isPending}
                onClick={() => sampleMutation.mutate("online_store_transactions")}
              >
                <Sparkles className="h-4 w-4 text-[#F5A524]" />
                Use Online Store Sample
              </Button>
            </Card>

            {/* Sample 2: Mall Customers */}
            <Card className="p-6 flex flex-col justify-between space-y-4 hover:border-[#6366F1]/40 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">Customer Features</Badge>
                  <span className="font-mono text-xs text-[var(--text-muted)]">500 customers</span>
                </div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">Mall Customer Features</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Classic clustering benchmark featuring 5 distinct natural behavioral cohorts based on age, annual income, store visits, and spending score. Ideal for K-Means and DBSCAN.
                </p>
                <div className="p-2.5 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[11px] font-mono text-[var(--foreground)]">
                  Columns: customer_id, age, annual_income_k, spending_score, visits
                </div>
              </div>

              <Button
                variant="secondary"
                className="w-full gap-2 mt-4"
                isLoading={sampleMutation.isPending}
                onClick={() => sampleMutation.mutate("mall_customers")}
              >
                <Sparkles className="h-4 w-4 text-[#F5A524]" />
                Use Mall Customers Sample
              </Button>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function NewDatasetPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm">Loading dataset loader...</div>}>
      <NewDatasetContent />
    </Suspense>
  );
}
