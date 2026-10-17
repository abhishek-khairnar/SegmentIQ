import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, ForeignKey, DateTime, Index
)
from sqlalchemy.orm import relationship
from app.db import Base

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="user", nullable=False)  # "user" or "admin"
    theme = Column(String(20), default="system", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    datasets = relationship("Dataset", back_populates="user", cascade="all, delete-orphan")
    runs = relationship("SegmentationRun", back_populates="user", cascade="all, delete-orphan")

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    source_type = Column(String(50), nullable=False)  # "transactions" or "features"
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    row_count = Column(Integer, default=0, nullable=False)
    column_count = Column(Integer, default=0, nullable=False)
    schema_json = Column(Text, default="{}", nullable=False)
    mapping_json = Column(Text, default="{}", nullable=False)
    quality_json = Column(Text, default="{}", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    user = relationship("User", back_populates="datasets")
    runs = relationship("SegmentationRun", back_populates="dataset", cascade="all, delete-orphan")

class SegmentationRun(Base):
    __tablename__ = "segmentation_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    dataset_id = Column(String(36), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    method = Column(String(50), nullable=False)  # "rfm", "kmeans", "hierarchical", "dbscan"
    params_json = Column(Text, default="{}", nullable=False)
    features_json = Column(Text, default="[]", nullable=False)
    status = Column(String(50), default="queued", nullable=False)  # "queued", "running", "done", "failed"
    error_message = Column(Text, nullable=True)
    n_customers = Column(Integer, default=0, nullable=False)
    n_segments = Column(Integer, default=0, nullable=False)
    metrics_json = Column(Text, default="{}", nullable=False)
    duration_ms = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    user = relationship("User", back_populates="runs")
    dataset = relationship("Dataset", back_populates="runs")
    segments = relationship("Segment", back_populates="run", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="run", cascade="all, delete-orphan")

class Segment(Base):
    __tablename__ = "segments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    run_id = Column(String(36), ForeignKey("segmentation_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    index = Column(Integer, nullable=False)  # 0, 1, 2...
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    color = Column(String(50), nullable=False)
    size = Column(Integer, default=0, nullable=False)
    share_pct = Column(Float, default=0.0, nullable=False)
    centroid_json = Column(Text, default="{}", nullable=False)
    profile_json = Column(Text, default="{}", nullable=False)
    actions_json = Column(Text, default="[]", nullable=False)

    run = relationship("SegmentationRun", back_populates="segments")
    assignments = relationship("Assignment", back_populates="segment", cascade="all, delete-orphan")

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    run_id = Column(String(36), ForeignKey("segmentation_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    segment_id = Column(String(36), ForeignKey("segments.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(String(255), nullable=False)
    features_json = Column(Text, default="{}", nullable=False)
    pca_x = Column(Float, nullable=True)
    pca_y = Column(Float, nullable=True)

    run = relationship("SegmentationRun", back_populates="assignments")
    segment = relationship("Segment", back_populates="assignments")

    __table_args__ = (
        Index("idx_assignments_run_customer", "run_id", "customer_id"),
    )

class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
