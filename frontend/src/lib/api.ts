export class ApiError extends Error {
  status: number;
  code?: string;
  errors?: Array<{ field: string; message: string }>;

  constructor(message: string, status: number, code?: string, errors?: Array<{ field: string; message: string }>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `/api${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // for httpOnly cookie
  });

  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get("content-type") || "";
  let data: any = null;
  if (contentType.includes("application/json")) {
    data = await response.json();
  } else if (contentType.includes("text/")) {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = data?.detail || data?.message || "An unexpected error occurred.";
    throw new ApiError(errorMsg, response.status, data?.code, data?.errors);
  }

  return data as T;
}

export const api = {
  // Generic HTTP helpers for flexibility
  get: <T = any>(endpoint: string) => request<T>(endpoint, { method: "GET" }),
  post: <T = any>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: "POST",
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    }),
  patch: <T = any>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: "PATCH",
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    }),
  delete: <T = any>(endpoint: string) => request<T>(endpoint, { method: "DELETE" }),

  // Auth
  register: (body: { email: string; name: string; password: string }) =>
    request<any>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  
  login: (body: { email: string; password: string }) =>
    request<any>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  
  logout: () =>
    request<{ message: string }>("/auth/logout", { method: "POST" }),
  
  getMe: () =>
    request<any>("/auth/me", { method: "GET" }),
  
  patchMe: (body: { name?: string; theme?: string }) =>
    request<any>("/auth/me", { method: "PATCH", body: JSON.stringify(body) }),
  
  changePassword: (body: { current_password: string; new_password: string }) =>
    request<{ message: string }>("/auth/change-password", { method: "POST", body: JSON.stringify(body) }),
  
  deleteMe: () =>
    request<{ message: string }>("/auth/me", { method: "DELETE" }),

  // Datasets
  listDatasets: () =>
    request<any[]>("/datasets", { method: "GET" }),
  
  uploadDataset: (formData: FormData) =>
    request<any>("/datasets", { method: "POST", body: formData }),
  
  loadSample: (sampleKey: string) =>
    request<any>(`/datasets/sample/${sampleKey}`, { method: "POST" }),
  
  getDataset: (id: string) =>
    request<any>(`/datasets/${id}`, { method: "GET" }),
  
  patchDataset: (id: string, body: { name?: string; mapping_json?: any }) =>
    request<any>(`/datasets/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  
  deleteDataset: (id: string) =>
    request<{ message: string }>(`/datasets/${id}`, { method: "DELETE" }),
  
  getPreview: (id: string) =>
    request<{ columns: string[]; rows: any[]; total_rows: number }>(`/datasets/${id}/preview`, { method: "GET" }),
  
  getProfile: (id: string) =>
    request<any>(`/datasets/${id}/profile`, { method: "GET" }),

  // Suggest
  suggestK: (id: string, body: { features: string[]; log_transform?: boolean; cap_outliers?: boolean }) =>
    request<{ k_values: number[]; inertias: number[]; silhouettes: number[]; best_k: number }>(`/datasets/${id}/suggest-k`, {
      method: "POST",
      body: JSON.stringify(body)
    }),
  
  suggestEps: (id: string, body: { features: string[]; min_samples?: number; log_transform?: boolean; cap_outliers?: boolean }) =>
    request<{ distances: number[]; suggested_eps: number }>(`/datasets/${id}/suggest-eps`, {
      method: "POST",
      body: JSON.stringify(body)
    }),

  // Runs
  listRuns: (params?: { dataset_id?: string; method?: string }) => {
    const q = new URLSearchParams();
    if (params?.dataset_id) q.set("dataset_id", params.dataset_id);
    if (params?.method) q.set("method", params.method);
    const queryStr = q.toString() ? `?${q.toString()}` : "";
    return request<any[]>(`/runs${queryStr}`, { method: "GET" });
  },

  createRun: (body: { dataset_id: string; name?: string; method: string; features?: string[]; params?: any }) =>
    request<any>("/runs", { method: "POST", body: JSON.stringify(body) }),

  getRun: (id: string) =>
    request<any>(`/runs/${id}`, { method: "GET" }),

  renameRun: (id: string, body: { name: string }) =>
    request<any>(`/runs/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  deleteRun: (id: string) =>
    request<{ message: string }>(`/runs/${id}`, { method: "DELETE" }),

  getSegments: (runId: string) =>
    request<any[]>(`/runs/${runId}/segments`, { method: "GET" }),

  patchSegment: (segmentId: string, body: { name?: string; description?: string }) =>
    request<any>(`/segments/${segmentId}`, { method: "PATCH", body: JSON.stringify(body) }),

  getMap: (runId: string) =>
    request<{ points: any[]; total_customers: number; sampled_customers: number }>(`/runs/${runId}/map`, { method: "GET" }),

  getCustomers: (runId: string, params: { page?: number; page_size?: number; segment_id?: string; search?: string; sort_by?: string; sort_desc?: boolean }) => {
    const q = new URLSearchParams();
    if (params.page) q.set("page", params.page.toString());
    if (params.page_size) q.set("page_size", params.page_size.toString());
    if (params.segment_id) q.set("segment_id", params.segment_id);
    if (params.search) q.set("search", params.search);
    if (params.sort_by) q.set("sort_by", params.sort_by);
    if (params.sort_desc) q.set("sort_desc", "true");
    return request<any>(`/runs/${runId}/customers?${q.toString()}`, { method: "GET" });
  },

  // Export URLs
  getExportCustomersUrl: (runId: string) => `/api/runs/${runId}/export/customers.csv`,
  getExportSegmentsUrl: (runId: string) => `/api/runs/${runId}/export/segments.csv`,
  getExportRunJsonUrl: (runId: string) => `/api/runs/${runId}/export/run.json`,
  getExportAudienceUrl: (runId: string, segmentId: string) => `/api/runs/${runId}/export/segment/${segmentId}.csv`,

  // Compare
  compareRuns: (a: string, b: string) =>
    request<any>(`/compare?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`, { method: "GET" }),

  // Contact & Admin
  submitContact: (body: { name: string; email: string; subject: string; message: string }) =>
    request<any>("/contact", { method: "POST", body: JSON.stringify(body) }),

  getAdminMessages: () =>
    request<any[]>("/admin/messages", { method: "GET" }),

  patchAdminMessage: (id: number | string, body: { is_read: boolean }) =>
    request<any>(`/admin/messages/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  deleteAdminMessage: (id: number | string) =>
    request<{ message: string }>(`/admin/messages/${id}`, { method: "DELETE" }),

  // Meta & Summary
  getDashboardSummary: () =>
    request<any>("/dashboard/summary", { method: "GET" }),

  getHealth: () =>
    request<any>("/health", { method: "GET" })
};

export { api as apiClient };
