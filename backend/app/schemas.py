from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# --- User Schemas ---
class UserRegister(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=8, max_length=128)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    theme: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

class UserPatch(BaseModel):
    name: Optional[str] = None
    theme: Optional[str] = None

class UserChangePassword(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


# --- Dataset Schemas ---
class DatasetResponse(BaseModel):
    id: str
    user_id: str
    name: str
    source_type: str
    original_filename: str
    row_count: int
    column_count: int
    schema_json: Dict[str, Any]
    mapping_json: Dict[str, Any]
    quality_json: Dict[str, Any]
    created_at: datetime
    runs_count: int = 0

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

class DatasetPatch(BaseModel):
    name: Optional[str] = None
    mapping_json: Optional[Dict[str, Any]] = None

class DatasetPreview(BaseModel):
    columns: List[str]
    rows: List[Dict[str, Any]]
    total_rows: int

class ColumnProfile(BaseModel):
    name: str
    dtype: str
    inferred_type: str
    missing_count: int
    missing_pct: float
    min: Optional[float] = None
    max: Optional[float] = None
    mean: Optional[float] = None
    median: Optional[float] = None
    std: Optional[float] = None
    unique_count: int
    histogram: Optional[List[Dict[str, Any]]] = None

class DatasetProfileResponse(BaseModel):
    dataset_id: str
    total_rows: int
    total_columns: int
    columns: List[ColumnProfile]


# --- Suggestion Schemas ---
class SuggestKRequest(BaseModel):
    features: List[str]
    log_transform: bool = True
    cap_outliers: bool = True

class SuggestKResponse(BaseModel):
    k_values: List[int]
    inertias: List[float]
    silhouettes: List[float]
    best_k: int

class SuggestEpsRequest(BaseModel):
    features: List[str]
    min_samples: int = 5
    log_transform: bool = True
    cap_outliers: bool = True

class SuggestEpsResponse(BaseModel):
    distances: List[float]
    suggested_eps: float


# --- Run Schemas ---
class RunCreate(BaseModel):
    dataset_id: str
    name: Optional[str] = None
    method: str  # "rfm", "kmeans", "hierarchical", "dbscan"
    features: Optional[List[str]] = None
    params: Optional[Dict[str, Any]] = None
    log_transform: bool = True
    cap_outliers: bool = True

class RunResponse(BaseModel):
    id: str
    dataset_id: str
    dataset_name: Optional[str] = None
    user_id: str
    name: str
    method: str
    params_json: Dict[str, Any]
    features_json: List[str]
    status: str
    error_message: Optional[str] = None
    n_customers: int
    n_segments: int
    metrics_json: Dict[str, Any]
    duration_ms: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

class RunPatch(BaseModel):
    name: str


# --- Segment Schemas ---
class SegmentResponse(BaseModel):
    id: str
    run_id: str
    index: int
    name: str
    description: str
    color: str
    size: int
    share_pct: float
    centroid_json: Dict[str, Any]
    profile_json: Dict[str, Any]
    actions_json: List[str]

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

class SegmentPatch(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


# --- Map & Customer Schemas ---
class MapPoint(BaseModel):
    customer_id: str
    segment_id: str
    segment_name: str
    segment_index: int
    color: str
    pca_x: Optional[float] = None
    pca_y: Optional[float] = None

class MapResponse(BaseModel):
    points: List[MapPoint]
    total_customers: int
    sampled_customers: int

class CustomerItem(BaseModel):
    customer_id: str
    segment_id: str
    segment_name: str
    segment_index: int
    color: str
    features: Dict[str, Any]
    pca_x: Optional[float] = None
    pca_y: Optional[float] = None

class CustomersPage(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    items: List[CustomerItem]


# --- Compare Schemas ---
class RunBrief(BaseModel):
    id: str
    name: str
    method: str
    n_segments: int
    created_at: datetime

class CompareMovementCell(BaseModel):
    segment_a_id: str
    segment_a_name: str
    segment_b_id: str
    segment_b_name: str
    count: int
    pct_of_a: float

class CompareTopShift(BaseModel):
    segment_a_name: str
    segment_b_name: str
    count: int
    pct: float

class CompareResponse(BaseModel):
    run_a: RunBrief
    run_b: RunBrief
    shared_customers: int
    ari: float
    ari_interpretation: str
    matrix: List[List[int]]
    labels_a: List[str]
    labels_b: List[str]
    flows: List[CompareMovementCell]
    top_shifts: List[CompareTopShift]


# --- Contact Schemas ---
class ContactCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    subject: str = Field(min_length=1, max_length=255)
    message: str = Field(min_length=5, max_length=5000)

class ContactResponse(BaseModel):
    id: str
    name: str
    email: str
    subject: str
    message: str
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

class ContactPatch(BaseModel):
    is_read: bool


# --- Dashboard Summary ---
class DashboardSummary(BaseModel):
    datasets_count: int
    runs_count: int
    customers_segmented: int
    last_run_date: Optional[datetime] = None
    recent_runs: List[RunResponse] = []
