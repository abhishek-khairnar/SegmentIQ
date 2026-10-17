"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ErrorCard } from "@/components/common/ErrorCard";
import { CardSkeleton } from "@/components/common/Skeletons";
import {
  Target, Layers, Sliders, CheckCircle2, ChevronRight,
  ChevronLeft, Play, Sparkles, AlertCircle, ArrowRight,
  Loader2, Info
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";

export default function RunWizardPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const datasetId = resolvedParams.id;
  const router = useRouter();

  const [step, setStep] = useState(1);

  // Wizard Configuration State
  const [method, setMethod] = useState<"rfm" | "kmeans" | "hierarchical" | "dbscan">("kmeans");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [logTransform, setLogTransform] = useState(true);
  const [capOutliers, setCapOutliers] = useState(true);

  // Clustering Params
  const [kValue, setKValue] = useState(4);
  const [linkage, setLinkage] = useState("ward");
  const [eps, setEps] = useState(0.5);
  const [minSamples, setMinSamples] = useState(5);
  const [runName, setRunName] = useState("");

  // Suggestion State
  const [suggestKData, setSuggestKData] = useState<any>(null);
  const [suggestEpsData, setSuggestEpsData] = useState<any>(null);

  // Execution / Polling State
  const [executingRunId, setExecutingRunId] = useState<string | null>(null);
  const [progressState, setProgressState] = useState<string>("Preparing");
  const [runError, setRunError] = useState<string | null>(null);

  const { data: dataset, isLoading, isError, error } = useQuery({
    queryKey: ["dataset", datasetId],
    queryFn: () => api.getDataset(datasetId),
  });

  // Initialize defaults on dataset load
  useEffect(() => {
    if (dataset) {
      const isTrans = dataset.source_type === "transactions";
      if (isTrans) {
        setMethod("rfm");
        setSelectedFeatures(["recency_days", "frequency", "monetary"]);
      } else {
        setMethod("kmeans");
        const feats = dataset.mapping_json?.feature_columns || [];
        setSelectedFeatures(feats);
      }

      const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
      setRunName(`${dataset.name} - ${isTrans ? "RFM" : "K-Means"} - ${dateStr}`);
    }
  }, [dataset]);

  // Update default run name when method changes
  useEffect(() => {
    if (dataset) {
      const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const methodStr = method === "rfm" ? "RFM" : method.toUpperCase();
      setRunName(`${dataset.name} - ${methodStr} - ${dateStr}`);
    }
  }, [method, dataset]);

  // Suggest K Mutation
  const suggestKMutation = useMutation({
    mutationFn: () =>
      api.suggestK(datasetId, {
        features: selectedFeatures,
        log_transform: logTransform,
        cap_outliers: capOutliers,
      }),
    onSuccess: (data) => {
      setSuggestKData(data);
      setKValue(data.best_k);
      toast.success(`Optimal k = ${data.best_k} suggested based on maximum silhouette score!`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to calculate suggested k.");
    },
  });

  // Suggest Eps Mutation
  const suggestEpsMutation = useMutation({
    mutationFn: () =>
      api.suggestEps(datasetId, {
        features: selectedFeatures,
        min_samples: minSamples,
        log_transform: logTransform,
        cap_outliers: capOutliers,
      }),
    onSuccess: (data) => {
      setSuggestEpsData(data);
      setEps(data.suggested_eps);
      toast.success(`Suggested eps = ${data.suggested_eps} based on k-distance elbow knee!`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to calculate suggested eps.");
    },
  });

  // Create Run Mutation
  const createRunMutation = useMutation({
    mutationFn: () => {
      const params: any = {
        log_transform: logTransform,
        cap_outliers: capOutliers,
      };
      if (method === "kmeans" || method === "hierarchical") {
        params.k = kValue;
        if (method === "hierarchical") params.linkage = linkage;
      } else if (method === "dbscan") {
        params.eps = eps;
        params.min_samples = minSamples;
      }
      return api.createRun({
        dataset_id: datasetId,
        name: runName.trim(),
        method,
        features: selectedFeatures,
        params,
      });
    },
    onSuccess: (run) => {
      setExecutingRunId(run.id);
      setProgressState("Scaling");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to launch run.");
    },
  });

  // Polling Effect
  useEffect(() => {
    if (!executingRunId) return;

    const stages = ["Scaling", "Clustering", "Profiling", "Saving"];
    let stageIdx = 0;

    const interval = setInterval(async () => {
      try {
        const statusData = await api.getRun(executingRunId);
        if (statusData.status === "done") {
          clearInterval(interval);
          toast.success("Segmentation run completed successfully!");
          router.push(`/dashboard/runs/${executingRunId}`);
        } else if (statusData.status === "failed") {
          clearInterval(interval);
          setRunError(statusData.error_message || "Clustering run failed.");
        } else {
          // Progress simulation for UI transparency
          stageIdx = (stageIdx + 1) % stages.length;
          setProgressState(stages[stageIdx]);
        }
      } catch (err: any) {
        clearInterval(interval);
        setRunError(err.message || "Lost connection while polling run progress.");
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [executingRunId, router]);

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (isError || !dataset) {
    return <ErrorCard message={(error as Error)?.message || "Dataset not found."} />;
  }

  // Determine available features
  const isTrans = dataset.source_type === "transactions";
  const availableFeatures = isTrans
    ? ["recency_days", "frequency", "monetary", "avg_order_value", "tenure_days"]
    : dataset.mapping_json?.feature_columns || [];

  // If currently executing, show progress view
  if (executingRunId) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-6 animate-fade-in">
        {runError ? (
          <Card className="p-8 border-red-500/30 bg-red-500/5 space-y-4">
            <AlertCircle className="h-10 w-10 text-[#EF4444] mx-auto" />
            <h2 className="text-xl font-bold text-[var(--foreground)]">Segmentation Failed</h2>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">{runError}</p>
            <div className="pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setExecutingRunId(null);
                  setRunError(null);
                }}
              >
                Back to settings
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-8 space-y-6">
            <div className="h-14 w-14 rounded-full bg-[#6366F1]/10 text-[#6366F1] flex items-center justify-center mx-auto">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">Running Segmentation...</h2>
              <p className="text-sm text-[var(--text-muted)] mt-1 font-mono">
                Current stage: <span className="text-[#6366F1] font-semibold">{progressState}</span>
              </p>
            </div>
            <div className="w-full bg-[var(--surface-raised)] rounded-full h-2 overflow-hidden border border-[var(--border)]">
              <div className="bg-[#6366F1] h-2 rounded-full animate-pulse w-3/4" />
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Calculating centroids, z-scores, and PCA projections. You will be redirected automatically upon completion.
            </p>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Stepper Header */}
      <div>
        <div className="flex items-center justify-between pb-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-[var(--foreground)]">
              Segmentation Wizard
            </h1>
            <p className="text-xs text-[var(--text-muted)]">Dataset: {dataset.name}</p>
          </div>
          <Badge variant="outline" className="font-mono">Step {step} of 4</Badge>
        </div>

        {/* Stepper progress indicator */}
        <div className="grid grid-cols-4 gap-2">
          {["1. Method", "2. Features", "3. Parameters", "4. Review & Run"].map((lbl, idx) => (
            <div key={idx} className="space-y-1">
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  step > idx + 1
                    ? "bg-[#22C55E]"
                    : step === idx + 1
                    ? "bg-[#6366F1]"
                    : "bg-[var(--border)]"
                }`}
              />
              <span className="hidden sm:block text-[11px] font-medium text-[var(--text-muted)] truncate">
                {lbl}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Method Selection */}
      {step === 1 && (
        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)]">Step 1: Choose Segmentation Method</h2>
            <p className="text-xs text-[var(--text-muted)]">
              Select rule-based RFM quantiles or an unsupervised machine learning algorithm.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Method: RFM */}
            <div
              data-testid="method-rfm"
              onClick={() => isTrans && setMethod("rfm")}
              className={`p-5 rounded-xl border-2 transition-all ${
                !isTrans
                  ? "opacity-40 cursor-not-allowed border-[var(--border)]"
                  : method === "rfm"
                  ? "border-[#6366F1] bg-[#6366F1]/5 cursor-pointer shadow-sm"
                  : "border-[var(--border)] hover:bg-[var(--surface-raised)] cursor-pointer"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-[var(--foreground)]">RFM Scoring (Rules)</span>
                {method === "rfm" && <CheckCircle2 className="h-4 w-4 text-[#6366F1]" />}
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                <strong>Best for:</strong> E-commerce stores with transactional orders. Partitions customers into 11 established behavioral buckets.
              </p>
              {!isTrans && (
                <span className="inline-block mt-2 text-[10px] text-amber-500 font-medium">
                  Requires transaction data with dates and amounts
                </span>
              )}
            </div>

            {/* Method: K-Means */}
            <div
              data-testid="method-kmeans"
              onClick={() => setMethod("kmeans")}
              className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                method === "kmeans"
                  ? "border-[#6366F1] bg-[#6366F1]/5 shadow-sm"
                  : "border-[var(--border)] hover:bg-[var(--surface-raised)]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-[var(--foreground)]">K-Means Clustering</span>
                {method === "kmeans" && <CheckCircle2 className="h-4 w-4 text-[#6366F1]" />}
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                <strong>Best for:</strong> Fast, well-separated spherical clusters across multiple numeric attributes.
              </p>
            </div>

            {/* Method: Hierarchical */}
            <div
              data-testid="method-hierarchical"
              onClick={() => setMethod("hierarchical")}
              className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                method === "hierarchical"
                  ? "border-[#6366F1] bg-[#6366F1]/5 shadow-sm"
                  : "border-[var(--border)] hover:bg-[var(--surface-raised)]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-[var(--foreground)]">Hierarchical (Agglomerative)</span>
                {method === "hierarchical" && <CheckCircle2 className="h-4 w-4 text-[#6366F1]" />}
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                <strong>Best for:</strong> Detecting nested hierarchy structures without pre-assuming cluster shapes.
              </p>
            </div>

            {/* Method: DBSCAN */}
            <div
              data-testid="method-dbscan"
              onClick={() => setMethod("dbscan")}
              className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                method === "dbscan"
                  ? "border-[#6366F1] bg-[#6366F1]/5 shadow-sm"
                  : "border-[var(--border)] hover:bg-[var(--surface-raised)]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-[var(--foreground)]">DBSCAN Density Clustering</span>
                {method === "dbscan" && <CheckCircle2 className="h-4 w-4 text-[#6366F1]" />}
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                <strong>Best for:</strong> Arbitrary non-spherical clusters and automatic outlier isolation.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border)] flex justify-end">
            <Button variant="primary" onClick={() => setStep(2)} className="gap-2">
              Next: Select Features
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Feature Selection & Transformations */}
      {step === 2 && (
        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)]">Step 2: Features & Scaling Options</h2>
            <p className="text-xs text-[var(--text-muted)]">
              Choose which attributes to feed into the algorithm and configure outlier protections.
            </p>
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-semibold text-[var(--foreground)] uppercase font-mono">
              Numeric Attributes Included in Model
            </label>
            <div className="space-y-2 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)]/30">
              {availableFeatures.map((feat: string) => {
                const isChecked = selectedFeatures.includes(feat);
                return (
                  <label key={feat} className="flex items-center gap-2.5 cursor-pointer text-sm text-[var(--foreground)]">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={method === "rfm" && ["recency_days", "frequency", "monetary"].includes(feat)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFeatures([...selectedFeatures, feat]);
                        } else {
                          setSelectedFeatures(selectedFeatures.filter((f) => f !== feat));
                        }
                      }}
                      className="rounded border-[var(--border)] text-[#6366F1] focus:ring-[#6366F1]"
                    />
                    <span className="font-mono">{feat}</span>
                    {method === "rfm" && ["recency_days", "frequency", "monetary"].includes(feat) && (
                      <Badge variant="outline" className="text-[10px]">Required for RFM</Badge>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Transformation Switches */}
          <div className="pt-2 border-t border-[var(--border)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">Log-transform skewed features</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Applies log1p to features with positive skew &gt; 1.0 (recommended for revenue &amp; spend).
                </p>
              </div>
              <Switch checked={logTransform} onCheckedChange={setLogTransform} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">Cap outliers at 1st and 99th percentile</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Winsorizes extreme edge values so anomalies do not distort cluster centers.
                </p>
              </div>
              <Switch checked={capOutliers} onCheckedChange={setCapOutliers} />
            </div>

            <div className="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-xs text-[var(--text-muted)] flex items-center gap-2">
              <Info className="h-4 w-4 text-[#6366F1] shrink-0" />
              <span>
                StandardScaler (zero mean, unit variance) is always automatically applied to all features.
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border)] flex justify-between">
            <Button variant="secondary" onClick={() => setStep(1)} className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              variant="primary"
              disabled={selectedFeatures.length === 0}
              onClick={() => setStep(3)}
              className="gap-2"
            >
              Next: Configure Parameters
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Parameters & Suggestion Heuristics */}
      {step === 3 && (
        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)]">Step 3: Algorithm Parameters</h2>
            <p className="text-xs text-[var(--text-muted)]">
              Tune your hyperparameters or use our automated mathematical suggestions.
            </p>
          </div>

          {method === "rfm" ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)]/30 space-y-2">
                <h4 className="text-sm font-semibold text-[var(--foreground)]">Fixed 5-Quantile Scoring</h4>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  RFM divides Recency, Frequency, and Monetary measures into 5 equal quantiles (scores 1 to 5). Each customer receives an RF score which maps deterministically to one of the 11 segments.
                </p>
              </div>
            </div>
          ) : method === "kmeans" || method === "hierarchical" ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-[var(--foreground)]">
                    Number of Clusters (k): <span className="font-mono text-[#6366F1] font-bold text-base">{kValue}</span>
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    isLoading={suggestKMutation.isPending}
                    onClick={() => suggestKMutation.mutate()}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#F5A524]" />
                    Suggest k (Elbow & Silhouette)
                  </Button>
                </div>
                <input
                  type="range"
                  min="2"
                  max="10"
                  value={kValue}
                  onChange={(e) => setKValue(parseInt(e.target.value, 10))}
                  className="w-full accent-[#6366F1] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)]">
                  <span>2 clusters</span>
                  <span>10 clusters</span>
                </div>
              </div>

              {/* Suggest K Charts */}
              {suggestKData && (
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)]/20 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] font-mono">
                      Silhouette Score Across k = 2..10
                    </h4>
                    <Badge variant="success">Suggested k = {suggestKData.best_k}</Badge>
                  </div>
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={suggestKData.k_values.map((k: number, i: number) => ({
                          k,
                          silhouette: suggestKData.silhouettes[i],
                          inertia: suggestKData.inertias[i],
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="k" stroke="var(--text-muted)" fontSize={10} />
                        <YAxis stroke="var(--text-muted)" fontSize={10} />
                        <Tooltip />
                        <Line type="monotone" dataKey="silhouette" stroke="#6366F1" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {method === "hierarchical" && (
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1 uppercase font-mono">
                    Linkage Criterion
                  </label>
                  <Select value={linkage} onChange={(e) => setLinkage(e.target.value)}>
                    <option value="ward">Ward (minimizes cluster variance)</option>
                    <option value="complete">Complete (maximum distance)</option>
                    <option value="average">Average (mean distance)</option>
                  </Select>
                </div>
              )}
            </div>
          ) : (
            /* DBSCAN Parameters */
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1 font-mono">
                    Epsilon (eps)
                  </label>
                  <Input
                    type="number"
                    step="0.05"
                    min="0.05"
                    value={eps}
                    onChange={(e) => setEps(parseFloat(e.target.value) || 0.1)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1 font-mono">
                    Min Samples
                  </label>
                  <Input
                    type="number"
                    min="2"
                    value={minSamples}
                    onChange={(e) => setMinSamples(parseInt(e.target.value, 10) || 2)}
                  />
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                isLoading={suggestEpsMutation.isPending}
                onClick={() => suggestEpsMutation.mutate()}
              >
                <Sparkles className="h-3.5 w-3.5 text-[#F5A524]" />
                Auto-suggest eps (k-distance plot)
              </Button>

              {suggestEpsData && (
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)]/20 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] font-mono">
                      Sorted k-Distance Plot
                    </h4>
                    <Badge variant="success">Suggested eps = {suggestEpsData.suggested_eps}</Badge>
                  </div>
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={suggestEpsData.distances.map((dist: number, i: number) => ({
                          point: i,
                          distance: dist,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="point" stroke="var(--text-muted)" fontSize={10} />
                        <YAxis stroke="var(--text-muted)" fontSize={10} />
                        <Tooltip />
                        <Line type="monotone" dataKey="distance" stroke="#2DD4BF" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-[var(--border)] flex justify-between">
            <Button variant="secondary" onClick={() => setStep(2)} className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <Button variant="primary" onClick={() => setStep(4)} className="gap-2">
              Next: Review &amp; Run
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 4: Review & Run */}
      {step === 4 && (
        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)]">Step 4: Review Configuration &amp; Run</h2>
            <p className="text-xs text-[var(--text-muted)]">
              Verify your setup and name this segmentation analysis run.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Target Dataset:</span>
              <span className="font-semibold text-[var(--foreground)]">{dataset.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Algorithm / Method:</span>
              <span className="font-mono font-semibold uppercase text-[#6366F1]">{method}</span>
            </div>
            {method === "kmeans" || method === "hierarchical" ? (
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Target Clusters (k):</span>
                <span className="font-mono font-semibold text-[var(--foreground)]">{kValue}</span>
              </div>
            ) : method === "dbscan" ? (
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">DBSCAN Settings:</span>
                <span className="font-mono font-semibold text-[var(--foreground)]">eps: {eps}, min_samples: {minSamples}</span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Selected Features:</span>
              <span className="font-mono text-[var(--foreground)] truncate max-w-[280px]">
                {selectedFeatures.join(", ")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Data Preprocessing:</span>
              <span className="text-[var(--foreground)]">
                {logTransform ? "Log1p enabled" : "No log transform"}, {capOutliers ? "Outliers capped" : "No capping"}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5 uppercase font-mono">
              Analysis Run Name
            </label>
            <Input
              value={runName}
              onChange={(e) => setRunName(e.target.value)}
              placeholder="Analysis Run Name"
            />
          </div>

          <div className="pt-4 border-t border-[var(--border)] flex justify-between items-center">
            <Button variant="secondary" onClick={() => setStep(3)} className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              variant="primary"
              size="lg"
              disabled={createRunMutation.isPending || !runName.trim()}
              isLoading={createRunMutation.isPending}
              onClick={() => createRunMutation.mutate()}
              className="gap-2 shadow-md shadow-[#6366F1]/20"
            >
              <Play className="h-4 w-4" />
              Run Segmentation
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
