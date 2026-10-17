# SegmentIQ

> **Customer Segmentation & RFM Analytics Platform**  
> Unsupervised machine learning clustering and automated rule-based behavioral intelligence for e-commerce, marketing, and data teams.

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.6+-F7931E?style=flat-square&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

![SegmentIQ Landing Page Hero](docs/screenshots/01-landing-hero.png)
*Figure 1: SegmentIQ landing page hero showcasing the real-time interactive 2D customer projection map.*

---

## Table of Contents

- [1. Overview](#1-overview)
- [2. Key Features](#2-key-features)
- [3. Live Walkthrough & Visual Tour](#3-live-walkthrough--visual-tour)
- [4. System Architecture](#4-system-architecture)
- [5. Folder Structure](#5-folder-structure)
- [6. Algorithmic Logic & How It Works](#6-algorithmic-logic--how-it-works)
  - [a. Authentication & Multi-Tenant Isolation](#a-authentication--multi-tenant-isolation)
  - [b. Ingestion & Quality Audit Pipeline](#b-ingestion--quality-audit-pipeline)
  - [c. Feature Building from Transactions](#c-feature-building-from-transactions)
  - [d. RFM Scoring & 25-Cell Rule Engine](#d-rfm-scoring--25-cell-rule-engine)
  - [e. Machine Learning Clustering Pipeline](#e-machine-learning-clustering-pipeline)
  - [f. Hyperparameter Optimization: Suggest k & eps](#f-hyperparameter-optimization-suggest-k--eps)
  - [g. Mathematical Cluster Quality Metrics](#g-mathematical-cluster-quality-metrics)
  - [h. 2D Dimensionality Reduction (PCA)](#h-2d-dimensionality-reduction-pca)
  - [i. Segment Profiling & Z-Score Heatmaps](#i-segment-profiling--z-score-heatmaps)
  - [j. Automated Cohort Naming & Playbook Generation](#j-automated-cohort-naming--playbook-generation)
  - [k. Asynchronous Run Lifecycle](#k-asynchronous-run-lifecycle)
  - [l. Run Comparison & Adjusted Rand Index](#l-run-comparison--adjusted-rand-index)
  - [m. Export Formats & UTF-8 BOM Standards](#m-export-formats--utf-8-bom-standards)
- [7. Data Model & Database Schema](#7-data-model--database-schema)
- [8. Complete API Reference](#8-complete-api-reference)
- [9. Synthetic Sample Datasets](#9-synthetic-sample-datasets)
- [10. Getting Started & Installation](#10-getting-started--installation)
- [11. Running with Docker Compose](#11-running-with-docker-compose)
- [12. Automated Test Suites](#12-automated-test-suites)
- [13. Screenshot Regeneration](#13-screenshot-regeneration)
- [14. Security Architecture](#14-security-architecture)
- [15. Production Deployment Guide](#15-production-deployment-guide)
- [16. Troubleshooting & Common Pitfalls](#16-troubleshooting--common-pitfalls)
- [17. Limitations & Future Roadmap](#17-limitations--future-roadmap)
- [18. License & Author](#18-license--author)

---

## 1. Overview

**SegmentIQ** is an end-to-end customer intelligence platform designed to replace black-box marketing assumptions with rigorous, transparent behavioral segmentation.

Modern commerce and SaaS businesses gather thousands of transactional touchpoints daily but struggle to translate raw logs into actionable customer retention strategies. Generic segmentation tools either lock users into opaque proprietary scores or require complex Python notebooks that non-technical growth teams cannot operate.

SegmentIQ bridges this gap with dual analytics paradigms:
1. **Deterministic RFM Rule-Based Scoring**: Ingests multi-row transactional order logs, computes Recency, Frequency, and Monetary scores across monotonic quantiles, and classifies customers into 11 established behavioral segments with tailored marketing plays.
2. **Unsupervised Machine Learning Clustering**: Fits **K-Means**, **Hierarchical (Agglomerative)**, and **DBSCAN** models over customer feature vectors, featuring automated Elbow/Silhouette curve evaluation to recommend the optimal cluster count ($k$) and nearest-neighbor k-distance knee analysis for density radii ($\varepsilon$).

### Who It Is For
- **Growth & Retention Marketers**: Run targeted campaigns (win-back, VIP loyalty, re-engagement) based on empirical customer lifetime behavior.
- **E-Commerce Operators**: Turn store purchase logs into customer cohort lists compatible with Klaviyo, Mailchimp, and CRM platforms.
- **Data Analysts & Scientists**: Rapidly evaluate clustering heuristics, inspect PCA projections, and compare algorithm stability with Adjusted Rand Index (ARI) transition matrices.

---

## 2. Key Features

### Data Ingestion & Sanitization
- **Dual Ingestion Paths**: Native support for **Transaction Logs** (multiple purchase rows per customer) and **Customer Feature Tables** (pre-aggregated customer attributes).
- **Automated Schema Sniffing**: Auto-detects delimiters (comma, semicolon, tab, pipe), UTF-8/Latin-1 encodings, and infers date/numeric column types.
- **Data Quality Audit**: Identifies missing values, strips invalid negative monetary values, flags duplicate transactions, and applies median imputations with complete transparency.
- **High-Performance Storage**: Ingested files are converted into columnar Apache Parquet format on disk with Snappy compression for instant querying.

### Segmentation Engines
- **RFM Rule Engine**: 25-cell deterministic mapping classifying customers into 11 distinct cohorts (`Champions`, `Loyal Customers`, `At Risk`, `Can't Lose Them`, `About to Sleep`, etc.).
- **K-Means Clustering**: Fast, spherical cluster partitioning initialized with `k-means++` (10 runs, random seed 42).
- **Hierarchical Agglomerative**: Distance-based clustering supporting Ward, Complete, and Average linkage modes with automated stratified sampling for large cohorts.
- **DBSCAN Density Clustering**: Density-based clustering isolating arbitrary cluster geometries and automatically flagging outliers into an isolated noise cohort.
- **Mathematical Hyperparameter Suggestion**: Automated calculation of Silhouette and Inertia curves across $k \in [2, 10]$ and k-nearest-neighbor distance knees for $\varepsilon$.

### Visual Analytics & Dimensionality Reduction
- **2D PCA Projection Maps**: Dynamic interactive scatter plots visualizing customer distributions reduced to their top two principal components.
- **Standardized Radar Profiles**: Spider charts depicting feature deviations relative to baseline averages.
- **Z-Score Trait Heatmaps**: Diverging color matrices highlighting characteristic over- and under-indexing per segment.
- **Automated Persona Generation**: Context-aware naming engine that crafts human-readable labels and three actionable growth strategies per cluster.

### Cross-Model Comparison & Transition Matrix
- **Adjusted Rand Index (ARI)**: Rigorous mathematical measurement of structural clustering congruence between two distinct algorithms on the same cohort.
- **Contingency Movement Heatmap**: Visual transition matrix mapping how individual customers reallocate between models.
- **Top Migration Shifts**: Summary of the five largest customer movements between segments.

### Export & Multi-Tenant Security
- **Excel-Safe UTF-8 BOM CSV Exports**: Export full customer rosters, segment summaries, or model parameters with zero character corruption in Microsoft Excel.
- **Full JSON Archives**: Export raw centroids, PCA coordinates, and metadata for custom external downstream workflows.
- **Tenant Isolation**: Secure Argon2id password hashing, HttpOnly session cookies, per-user data sandboxing, and role-based administration.

---

## 3. Live Walkthrough & Visual Tour

### Public Pages

| Page | View | Description |
|---|---|---|
| **Landing Hero** | ![Landing Hero](docs/screenshots/01-landing-hero.png) | High-impact hero section with interactive 2D cluster simulation and quick-start CTAs. |
| **Landing Full** | ![Landing Full](docs/screenshots/02-landing-full.png) | Complete landing experience detailing workflow stages, RFM interactive cards, and customer FAQs. |
| **Features** | ![Features](docs/screenshots/03-features.png) | Comprehensive feature catalog outlining ingestion, algorithms, visualization, and export capabilities. |
| **How It Works** | ![How It Works](docs/screenshots/04-how-it-works.png) | Step-by-step interactive methodology breakdown from raw CSV upload to segment deployment. |
| **Methods Guide** | ![Methods Guide](docs/screenshots/05-docs-methods-guide.png) | In-depth technical documentation covering RFM quantiles, K-Means mathematics, Ward linkage, and DBSCAN density formulas. |
| **About Platform** | ![About](docs/screenshots/06-about.png) | Core mission, architecture principles, engineering standards, and developer credits. |
| **Contact Support** | ![Contact](docs/screenshots/07-contact.png) | Direct inquiry form allowing users to submit technical feedback stored securely in the database. |
| **User Login** | ![Login](docs/screenshots/08-login.png) | Secure credential authentication dialog with client-side Zod validation and rate limiting. |
| **User Registration** | ![Register](docs/screenshots/09-register.png) | Fast onboarding interface provisioning an isolated user tenant and database space. |
| **Privacy Policy** | ![Privacy](docs/screenshots/10-privacy.png) | Plain-English privacy disclosures detailing local Parquet storage, no third-party tracking, and data deletion rights. |
| **Terms of Service** | ![Terms](docs/screenshots/11-terms.png) | Platform usage terms, open-source MIT guidelines, and dataset handling warranties. |

### Application & Workspace

| Section | View | Description |
|---|---|---|
| **Dashboard Overview** | ![Dashboard Overview](docs/screenshots/12-dashboard-overview.png) | Central command console with real-time KPI metrics, recent segmentation runs, and one-click sample seeds. |
| **Datasets List** | ![Datasets List](docs/screenshots/13-datasets-list.png) | Comprehensive catalog of ingested datasets displaying row counts, column types, and storage formats. |
| **Upload Custom CSV** | ![Upload Custom CSV](docs/screenshots/14-dataset-new-upload.png) | Drag-and-drop file uploader supporting up to 20 MB with real-time MIME-type and size verification. |
| **Sample Datasets Tab** | ![Sample Datasets Tab](docs/screenshots/15-dataset-new-samples.png) | One-click generators for synthetic "Online Store Transactions" (25,000 rows) and "Mall Customers" (500 rows). |
| **Dataset Mapping & Quality** | ![Dataset Mapping](docs/screenshots/16-dataset-detail-mapping.png) | Column configuration view displaying auto-detected mappings and automated data sanitation audits. |
| **Column Profiles & Stats** | ![Column Profiles](docs/screenshots/17-dataset-column-profile.png) | Statistical summary view detailing distinct counts, min/max bounds, quartiles, and median values. |
| **Wizard Step 1: Method** | ![Wizard Step 1](docs/screenshots/18-wizard-step1-method.png) | Algorithm selection interface highlighting RFM Scoring, K-Means, Hierarchical, or DBSCAN. |
| **Wizard Step 2: Features** | ![Wizard Step 2](docs/screenshots/19-wizard-step2-features.png) | Feature selection checkboxes with toggles for Log1p skew transforms and 1st/99th percentile outlier capping. |
| **Wizard Step 3: Suggest k** | ![Wizard Step 3 Suggest k](docs/screenshots/20-wizard-step3-suggest-k.png) | Automated hyperparameter tuning running Silhouette score optimizations to recommend optimal cluster counts. |
| **Wizard Step 3: DBSCAN eps** | ![Wizard Step 3 DBSCAN eps](docs/screenshots/21-wizard-step3-dbscan-eps.png) | Nearest-neighbor distance plot executing elbow knee detection to determine optimal $\varepsilon$ radii. |
| **Wizard Step 4: Review** | ![Wizard Step 4](docs/screenshots/22-wizard-step4-review.png) | Final configuration confirmation summarizing selected features, preprocessing flags, and target parameters. |
| **Runs Management** | ![Runs List](docs/screenshots/23-runs-list.png) | Unified run repository displaying execution statuses, cohort counts, duration, and direct links to results. |

### Results & Analytics Hub

| View | Screenshot | Description |
|---|---|---|
| **RFM Results Overview** | ![RFM Results Overview](docs/screenshots/24-results-overview-rfm.png) | Executive summary highlighting dominant cohorts, highest-value customers, and population distributions. |
| **RFM Segments Playbook** | ![RFM Segments Playbook](docs/screenshots/25-results-segments-rfm.png) | Segment cards detailing customer share, average monetary value, Recency days, and recommended marketing actions. |
| **RFM Visual Map** | ![RFM Visual Map](docs/screenshots/26-results-map-rfm.png) | 2D PCA scatter projection alongside standardized radar profiles and Z-score trait heatmaps. |
| **Customer Table & Drawer** | ![Customer Table & Drawer](docs/screenshots/27-results-customers.png) | High-speed searchable customer table with slide-over drawer showing individual customer coordinates and raw values. |
| **Multi-Format Export** | ![Multi-Format Export](docs/screenshots/28-results-export.png) | Export hub for Excel-ready UTF-8 BOM CSV customer rosters, segment profile summaries, and JSON bundles. |
| **K-Means Overview** | ![K-Means Overview](docs/screenshots/29-results-overview-kmeans.png) | K-Means model summary displaying Silhouette, Davies-Bouldin, and Calinski-Harabasz mathematical scores. |
| **K-Means Segments** | ![K-Means Segments](docs/screenshots/30-results-segments-kmeans.png) | Automatically named demographic personas with index metrics comparing segment averages against cohort baselines. |
| **K-Means Visual Map** | ![K-Means Visual Map](docs/screenshots/31-results-map-kmeans.png) | 2D PCA customer projection colored by K-Means cluster assignments with interactive feature radar plots. |
| **DBSCAN Results** | ![DBSCAN Results](docs/screenshots/32-results-dbscan.png) | Density-based segmentation results highlighting identified dense clusters and isolated noise outliers. |
| **Model Comparison (ARI)** | ![Model Comparison](docs/screenshots/33-compare.png) | Mathematical model comparison calculating Adjusted Rand Index ($ARI = 0.9701$) and customer migration matrix. |
| **Account Settings** | ![Account Settings](docs/screenshots/34-settings.png) | User profile management, password updates, theme toggles, and permanent account/data deletion. |
| **Admin Inbound Messages** | ![Admin Messages](docs/screenshots/35-admin-messages.png) | Role-restricted administrative inbox for inspecting, reviewing, and deleting user contact inquiries. |
| **Light Theme Mode** | ![Light Theme Mode](docs/screenshots/36-theme-light.png) | High-contrast light mode visualization demonstrating full system theme switching. |

### Mobile & Developer Interfaces

| View | Screenshot | Description |
|---|---|---|
| **Mobile Landing View** | ![Mobile Landing](docs/screenshots/37-mobile-landing.png) | Responsive layout on a 390px mobile viewport with optimized typographic hierarchy. |
| **Mobile Drawer Navigation** | ![Mobile Menu Open](docs/screenshots/38-mobile-menu-open.png) | Slide-out mobile navigation sheet providing quick access to all public pages and auth controls. |
| **Mobile Results View** | ![Mobile Results](docs/screenshots/39-mobile-results.png) | Fully responsive run analytics cards and KPI summary metrics formatted for smartphone screens. |
| **Swagger OpenAPI Documentation** | ![API Docs Swagger](docs/screenshots/40-api-docs-swagger.png) | Interactive Swagger UI proxied through `/api-docs` allowing real-time testing of all backend endpoints. |

---

## 4. System Architecture

```mermaid
flowchart TB
    subgraph Client["Browser Client (1440px / 768px / 390px)"]
        UI["Next.js App Router (React 19)"]
        State["TanStack React Query v5"]
        Charts["Recharts + HTML5 Canvas"]
    end

    subgraph Gateway["Next.js Web Server (:3000)"]
        Proxy["Next.js Rewrite Engine (/api/* -> :8000/api/*)"]
        DocsProxy["Swagger Proxy (/api-docs -> :8000/docs)"]
    end

    subgraph Backend["FastAPI REST Application (:8000)"]
        AuthMiddleware["Argon2id + JWT Cookie Auth"]
        RateLimiter["SlowAPI Rate Limiter"]
        Routers["FastAPI API Routers (Datasets, Runs, Compare, Admin)"]
        Workers["FastAPI BackgroundTasks Queue"]
    end

    subgraph ML["scikit-learn Analytics Engine"]
        Ingest["Delimiter & Encoding Sniffer + Quality Audit"]
        RFMEngine["Monotonic Quantile 25-Cell RFM Engine"]
        ClusterPipe["K-Means / Hierarchical / DBSCAN + Knee Detection"]
        DimReduction["Truncated 2D PCA + Scaler Pipeline"]
    end

    subgraph Storage["Storage & Persistence Layer"]
        SQLite[("SQL Database (SQLite / PostgreSQL)")]
        Parquet[("Columnar Parquet Store (Snappy Compressed)")]
    end

    Client -->|HTTP / JSON| Gateway
    Gateway -->|Reverse Proxy Rewrite| Backend
    Backend --> AuthMiddleware
    AuthMiddleware --> Routers
    Routers -->|Async Queue| Workers
    Workers --> ML
    Routers -->|Metadata & Auth| SQLite
    ML -->|Read / Write Data| Parquet
    ML -->|Persist Runs & Metrics| SQLite
```

### Architecture Breakdown
1. **Client Layer**: Next.js App Router running React 19 and TanStack Query v5 for deterministic cache synchronization and optimistic updates. Visual maps and charts render using Recharts and Canvas.
2. **Next.js Gateway**: Serves server-rendered static assets and acts as a transparent reverse proxy rewriting `/api/*` to the FastAPI backend and `/api-docs` to Swagger UI, avoiding browser CORS complications.
3. **FastAPI Backend**: High-performance asynchronous REST API powered by Uvicorn. Validates inputs through Pydantic v2, enforces rate limits via SlowAPI, and protects endpoints with Argon2id password hashing and HttpOnly JWT cookies.
4. **Machine Learning Pipeline**: Built on NumPy, Pandas, and scikit-learn. Handles delimiter auto-sniffing, Winsorizing outlier capping, Log1p skew transforms, K-Means clustering, Ward hierarchical trees, and DBSCAN density graphs.
5. **Persistence Layer**: Relational metadata, user accounts, and segment definitions reside in SQLAlchemy (SQLite locally, PostgreSQL in production). Raw customer data is stored in partitioned Apache Parquet files with Snappy compression.

---

## 5. Folder Structure

```
SegmentIQ/
├── .gitignore                   # Excludes .env, *.db, storage/*.parquet, node_modules, venv
├── docker-compose.yml           # Multi-container orchestration (FastAPI + Next.js)
├── LICENSE                      # Official MIT License (Copyright abhishek-khairnar)
├── README.md                    # Complete project documentation and guide
├── docs/
│   └── screenshots/             # 40 optimized visual walkthrough PNG screenshots
├── backend/
│   ├── Dockerfile               # Production container definition for FastAPI
│   ├── requirements.txt         # Pinned backend dependencies
│   ├── alembic/                 # Alembic database migration scripts
│   ├── sample_data/             # Seed synthetic CSV datasets
│   ├── app/
│   │   ├── main.py              # FastAPI application entrypoint and middleware
│   │   ├── config.py            # Environment settings and storage paths
│   │   ├── db.py                # SQLAlchemy engine and session dependency
│   │   ├── models.py            # ORM entities (User, Dataset, Run, Segment, Assignment)
│   │   ├── schemas.py           # Pydantic validation schemas
│   │   ├── security.py          # Argon2id password hasher and JWT token generator
│   │   ├── deps.py              # Current user and admin dependency guards
│   │   ├── routers/             # API endpoint handlers
│   │   │   ├── auth.py          # Register, login, logout, password change
│   │   │   ├── datasets.py      # Upload, sample load, quality audit, column profile
│   │   │   ├── runs.py          # Segmentation launch, polling, customer drawer
│   │   │   ├── suggest.py       # Suggest k (Silhouette/Elbow) and eps (k-distance)
│   │   │   ├── compare.py       # Cross-model ARI and transition matrix
│   │   │   ├── export.py        # UTF-8 BOM CSV and JSON exporters
│   │   │   ├── admin.py         # Role-restricted message management
│   │   │   └── contact.py       # Public contact form submission
│   │   └── services/            # Pure data science algorithms
│   │       ├── ingest.py        # Encoding detection, sniffing, and cleaning
│   │       ├── rfm.py           # 25-cell RFM scoring and transaction feature building
│   │       ├── clustering.py    # K-Means, Hierarchical, DBSCAN, Suggest k/eps
│   │       ├── naming.py        # Automated persona naming and marketing plays
│   │       └── sample_generator.py # Deterministic synthetic dataset generator
│   └── tests/                   # Pytest automated test suite (12 passed)
└── frontend/
    ├── Dockerfile               # Production multi-stage Next.js container definition
    ├── package.json             # Pinned frontend dependencies and npm scripts
    ├── postcss.config.mjs       # Tailwind CSS v4 PostCSS configuration
    ├── next.config.ts           # Next.js config with backend API rewrites
    ├── tsconfig.json            # Strict TypeScript configuration
    ├── public/                  # Static assets and icons
    ├── e2e/                     # Playwright E2E tests and screenshot generator
    │   ├── smoke.spec.ts        # Smoke tests and public navigation
    │   ├── lifecycle_admin_compare.spec.ts # Full journey lifecycle test
    │   └── capture-screenshots.spec.ts    # Reusable screenshot capture suite
    └── src/
        ├── app/                 # Next.js App Router pages and layouts
        │   ├── page.tsx         # Landing page with interactive hero
        │   ├── layout.tsx       # Root layout with fonts and providers
        │   ├── globals.css      # Core design tokens and Tailwind imports
        │   ├── (public)/        # Features, How-it-works, Docs, About, Contact
        │   └── dashboard/       # Protected workspace, wizard, runs, results
        ├── components/          # Reusable UI component library
        └── lib/                 # API client, TanStack Query hooks, formatters
```

---

## 6. Algorithmic Logic & How It Works

### a. Authentication & Multi-Tenant Isolation
- **Argon2id Hashing**: Passwords are hashed using the state-of-the-art Argon2id algorithm via `passlib[argon2]`, providing maximum resistance against GPU/ASIC cracking.
- **Stateless JWT via HttpOnly Cookies**: Successful logins issue an encrypted JWT cookie (`access_token`) flagged with `HttpOnly`, `SameSite=Lax`, and `Secure` (in production). JavaScript cannot access the session token, neutralizing Cross-Site Scripting (XSS) token theft.
- **Tenant Scoping**: All database queries filter strictly by `user_id == current_user.id`. A user cannot read, update, or delete any dataset, run, or segment belonging to another account.

### b. Ingestion & Quality Audit Pipeline
1. **File Checks**: Restricts uploads to standard `.csv` files $\le 20\text{ MB}$, $\le 200,000\text{ rows}$, and $\le 100\text{ columns}$.
2. **Encoding & Delimiter Sniffing**: Inspects the first 16 KB with `charset-normalizer` to differentiate UTF-8 and Latin-1. Evaluates delimiters (`,`, `;`, `\t`, `|`) using Python's `csv.Sniffer` fallback.
3. **Sanitization Rules**:
   - Drops duplicate rows.
   - For transaction files, drops records missing `customer_id`, `order_date`, or `amount`.
   - Strips rows with negative or zero spending amounts (refunds/chargebacks flagged in audit log).
   - In feature files, missing numeric values are imputed with the column **median**.
4. **Storage**: Converts cleaned dataframes into columnar Apache Parquet files with Snappy compression in `backend/storage/datasets/{dataset_id}.parquet`.

### c. Feature Building from Transactions
When a user uploads purchase transactions, SegmentIQ aggregates them into a customer-level RFM feature vector using an anchor reference date:
$$T_{\text{ref}} = \max(\text{order\_dates}) + 1\text{ day}$$

- **Recency ($R$)**: Days between customer's most recent order and $T_{\text{ref}}$:
  $$R_i = \max\left(1, \lfloor T_{\text{ref}} - \max(t_{i,j}) \rfloor\right)$$
- **Frequency ($F$)**: Count of distinct purchase transactions or orders:
  $$F_i = |\{ \text{order\_id}_{i,j} \}|$$
- **Monetary ($M$)**: Sum of spending across all valid orders:
  $$M_i = \sum_{j} \text{amount}_{i,j}$$
- **Average Order Value ($AOV$)**:
  $$AOV_i = \frac{M_i}{F_i}$$
- **Tenure ($T$)**: Days since first registered purchase:
  $$T_i = \lfloor T_{\text{ref}} - \min(t_{i,j}) \rfloor$$
- **Category Variety**: Number of distinct merchandise categories purchased.

### d. RFM Scoring & 25-Cell Rule Engine
Customers are ranked and binned into quintiles (1 to 5) for $R$, $F$, and $M$ using rank-based tie handling:
- `r_rank = df['recency_days'].rank(method='first', ascending=False)` (lower days = higher score).
- `f_rank = df['frequency'].rank(method='first', ascending=True)`.
- `m_rank = df['monetary'].rank(method='first', ascending=True)`.

Scores are assigned using `pd.qcut(rank, q=5, labels=[1, 2, 3, 4, 5])`. Each $(R, F)$ pair maps deterministically to one of **11 behavioral segments** via the ordered rule table:

| Priority | Segment Name | R Condition | F Condition | Business Meaning | Recommended Playbook Action |
|:---:|:---|:---:|:---:|:---|:---|
| 1 | **Champions** | $R \ge 4$ | $F \ge 4$ | Bought recently, buy often, high spend. | Reward with VIP status, early access; avoid discounting. |
| 2 | **Can't Lose Them** | $R == 1$ | $F \ge 4$ | Major past spenders who haven't returned. | Personal outreach, win-back surveys, aggressive renewal deals. |
| 3 | **At Risk** | $R \le 2$ | $F \ge 3$ | Frequent buyers who have slipped away. | Automated win-back series, replenishment reminders. |
| 4 | **Need Attention** | $R == 3$ | $F == 3$ | Average frequency and recency; slipping. | Limited-time deals, cross-sell based on purchase history. |
| 5 | **Loyal Customers** | $R \ge 3$ | $F \ge 3$ | Steady repeat purchasers with strong loyalty. | Upsell premium tiers, invite to referral programmes. |
| 6 | **New Customers** | $R \ge 4$ | $F == 1$ | First purchase completed very recently. | Onboarding email series, 2nd-order discount voucher. |
| 7 | **Promising** | $R == 3$ | $F == 1$ | Recent shoppers with low frequency. | Showcase brand story, promote trending products. |
| 8 | **Potential Loyalists**| $R \ge 3$ | $F == 2$ | Recent buyers with 2 orders completed. | Recommend complementary items, offer free shipping threshold. |
| 9 | **About to Sleep** | $R == 2$ | $F \le 2$ | Below average recency and low frequency. | Reactivation drip campaigns, discount popular bestsellers. |
| 10 | **Hibernating** | $R == 1$ | $F == 2$ | Low spenders with prolonged inactivity. | Low-cost email reactivation; suppress if unengaged. |
| 11 | **Lost** | $R == 1$ | $F == 1$ | Single past purchase; inactive for months. | One final revival attempt, then suppress from marketing spend. |

*Total matrix coverage: Exactly 25 cells across $R \in [1..5] \times F \in [1..5]$.*

### e. Machine Learning Clustering Pipeline
1. **Feature Selection**: Users select numeric attributes (e.g. `annual_income_k`, `spending_score`, `age`).
2. **Outlier Capping (Winsorizing)**: If enabled, caps extreme outliers to the 1st and 99th percentiles:
   $$x' = \min(\max(x, Q_{0.01}), Q_{0.99})$$
3. **Log1p Transform**: For features exhibiting positive skewness $> 1.0$, applies:
   $$x_{\text{trans}} = \ln(x + 1)$$
4. **Standardization**: Features are centered and scaled to unit variance using `StandardScaler`:
   $$z = \frac{x - \mu}{\sigma}$$
5. **Algorithm Execution**:
   - **K-Means**: Runs with `k-means++` initialization and 10 seeds to converge on centroids minimizing intra-cluster inertia.
   - **Hierarchical**: Computes pairwise distances using Euclidean metric with Ward minimum variance linkage. If $N > 20,000$, fits a stratified sample of 20,000 and assigns remaining points to nearest cluster centroids.
   - **DBSCAN**: Density-based spatial clustering grouping points with core distances $\le \varepsilon$ and $\ge \text{min\_samples}$. Points in sparse regions are assigned label `-1` ("Noise / Outliers").

### f. Hyperparameter Optimization: Suggest k & eps
- **Suggest $k$ (K-Means / Hierarchical)**: Fits models across $k \in [2, 10]$, computes Inertia and Silhouette scores, and suggests the $k$ maximizing the silhouette coefficient:
  $$k^* = \arg\max_{k \in [2, 10]} s(k)$$
- **Suggest $\varepsilon$ (DBSCAN)**: Uses `NearestNeighbors(n_neighbors=min_samples)` to compute distances to each customer's $k$-th nearest neighbor. Distances are sorted in ascending order. SegmentIQ calculates the **knee point** by finding the point on the curve with maximum perpendicular distance to the line connecting $(0, d_0)$ and $(N-1, d_{N-1})$.

### g. Mathematical Cluster Quality Metrics
- **Silhouette Coefficient ($s$)**: Measures how similar a point is to its own cluster compared to neighboring clusters (range $[-1, 1]$, values $> 0.5$ indicate strong separation):
  $$s = \frac{b - a}{\max(a, b)}$$
- **Davies-Bouldin Index ($DB$)**: Average similarity measure between each cluster and its most similar counterpart (lower is better, $< 1.0$ indicates good clustering):
  $$DB = \frac{1}{k} \sum_{i=1}^k \max_{j \neq i} \left( \frac{\sigma_i + \sigma_j}{d(c_i, c_j)} \right)$$
- **Calinski-Harabasz Score ($CH$)**: Variance ratio criterion computing the ratio of between-cluster dispersion to within-cluster dispersion (higher is better):
  $$CH = \frac{\text{Tr}(B_k)}{\text{Tr}(W_k)} \times \frac{N - k}{k - 1}$$
- **Inertia**: Sum of squared distances of samples to their closest cluster center.

### h. 2D Dimensionality Reduction (PCA)
To project high-dimensional customer attributes into a 2D scatter plot, SegmentIQ applies **Principal Component Analysis (PCA)**:
$$\mathbf{X}_{\text{2D}} = \mathbf{X}_{\text{scaled}} \mathbf{W}_2$$
Where $\mathbf{W}_2$ contains the eigenvectors corresponding to the two largest eigenvalues of the covariance matrix. The explained variance ratio for PC1 and PC2 is reported in the model metrics.

### i. Segment Profiling & Z-Score Heatmaps
For every identified cluster $j$ and feature $f$, the engine calculates:
- **Cluster Mean**: $\mu_{j, f} = \frac{1}{|C_j|} \sum_{i \in C_j} x_{i, f}$
- **Baseline Mean**: $\bar{\mu}_f = \frac{1}{N} \sum_{i=1}^N x_{i, f}$
- **Index vs. Baseline**: $\text{Index}_{j, f} = \left(\frac{\mu_{j, f}}{\bar{\mu}_f}\right) \times 100$
- **Z-Score Deviation**: $z_{j, f} = \frac{\mu_{j, f} - \bar{\mu}_f}{\sigma_f}$

### j. Automated Cohort Naming & Playbook Generation
Non-RFM clustering algorithms lack predefined semantic labels. SegmentIQ inspects each cluster's largest positive and negative Z-scores ($|z| \ge 0.5$) and automatically generates plain-language personas (e.g., *"High annual income / Low spending score"*) alongside three actionable retention plays.

### k. Asynchronous Run Lifecycle
Runs execute through FastAPI background tasks:
1. `queued`: Database record created with hyperparameters.
2. `running`: Dataset loaded from Parquet, transformed, and fitted.
3. `done`: Centroids, segment profiles, PCA coordinates, and quality metrics saved to database.
4. `failed`: Error message recorded; UI renders failure state with recovery guidance.

### l. Run Comparison & Adjusted Rand Index
The Compare tool evaluates two models ($A$ and $B$) on the same dataset:
- **Contingency Matrix ($C_{ij}$)**: Measures the count of customers assigned to segment $i$ in Model A and segment $j$ in Model B.
- **Adjusted Rand Index ($ARI$)**: Measures cluster overlap adjusted for chance ($1.0$ = identical grouping, $0.0$ = random distribution):
  $$ARI = \frac{\sum_{ij} \binom{n_{ij}}{2} - \left[ \sum_i \binom{a_i}{2} \sum_j \binom{b_j}{2} \right] / \binom{n}{2}}{\frac{1}{2}\left[ \sum_i \binom{a_i}{2} + \sum_j \binom{b_j}{2} \right] - \left[ \sum_i \binom{a_i}{2} \sum_j \binom{b_j}{2} \right] / \binom{n}{2}}$$

### m. Export Formats & UTF-8 BOM Standards
- **UTF-8 with Byte Order Mark (BOM)**: CSV files are exported with the prefix `\xef\xbb\xbf`. This guarantees that Microsoft Excel on Windows and macOS opens the CSV with correct UTF-8 character encoding without garbled text.
- **Customer Assignments CSV**: Contains `customer_id`, `segment_name`, `pca_x`, `pca_y`, and raw features.
- **Segment Profiles CSV**: Contains cluster sizes, percentage shares, attribute means, index scores, and marketing recommendations.

---

## 7. Data Model & Database Schema

```mermaid
erDiagram
    User ||--o{ Dataset : owns
    User ||--o{ SegmentationRun : launches
    Dataset ||--o{ SegmentationRun : generates
    SegmentationRun ||--o{ Segment : produces
    SegmentationRun ||--o{ Assignment : partitions
    Segment ||--o{ Assignment : contains

    User {
        string id PK
        string email UK
        string name
        string password_hash
        string role
        string theme
        datetime created_at
    }

    Dataset {
        string id PK
        string user_id FK
        string name
        string source_type
        string original_filename
        string file_path
        int row_count
        int column_count
        text schema_json
        text mapping_json
        text quality_json
        datetime created_at
    }

    SegmentationRun {
        string id PK
        string user_id FK
        string dataset_id FK
        string name
        string method
        string status
        text features_json
        text params_json
        text metrics_json
        int n_customers
        int n_segments
        int duration_ms
        text error_message
        datetime created_at
    }

    Segment {
        string id PK
        string run_id FK
        int index
        string name
        text description
        string color
        int size
        float share_pct
        text centroid_json
        text profile_json
        text actions_json
    }

    Assignment {
        string id PK
        string run_id FK
        string segment_id FK
        string customer_id
        text features_json
        float pca_x
        float pca_y
    }

    ContactMessage {
        string id PK
        string name
        string email
        string subject
        text message
        boolean is_read
        datetime created_at
    }
```

---

## 8. Complete API Reference

All endpoints are served with prefix `/api` and documented interactively via `/api-docs` (Swagger UI).

<details>
<summary><strong>Click to expand the full API endpoint table</strong></summary>

| Method | Endpoint | Auth Required | Description |
|---|---|:---:|---|
| `POST` | `/api/auth/register` | No | Register a new user account with Argon2id hashing. |
| `POST` | `/api/auth/login` | No | Authenticate user and issue HttpOnly JWT session cookie. |
| `POST` | `/api/auth/logout` | Yes | Invalidate session by clearing the JWT auth cookie. |
| `GET` | `/api/auth/me` | Yes | Fetch profile details of the authenticated user. |
| `PATCH` | `/api/auth/me` | Yes | Update user display name or interface theme setting. |
| `POST` | `/api/auth/change-password`| Yes | Securely verify current password and update to new password. |
| `DELETE` | `/api/auth/me` | Yes | Permanently delete account and cascade-delete all datasets and runs. |
| `GET` | `/api/datasets` | Yes | List all datasets owned by the current user. |
| `POST` | `/api/datasets` | Yes | Upload custom CSV file; executes sniffing and data quality audit. |
| `POST` | `/api/datasets/sample` | Yes | Provision pre-packaged "Online Store" or "Mall Customers" sample. |
| `GET` | `/api/datasets/{id}` | Yes | Fetch dataset schema, data quality audit report, and column profiles. |
| `PATCH` | `/api/datasets/{id}/mapping`| Yes | Update column mapping (customer_id, date, amount, features). |
| `DELETE` | `/api/datasets/{id}` | Yes | Delete dataset record and remove underlying Parquet file from disk. |
| `POST` | `/api/datasets/{id}/suggest-k` | Yes | Calculate Inertia and Silhouette curves across $k \in [2..10]$. |
| `POST` | `/api/datasets/{id}/suggest-eps` | Yes | Calculate k-nearest neighbor distances and detect knee point for $\varepsilon$. |
| `GET` | `/api/runs` | Yes | List all segmentation runs with status, method, and cohort counts. |
| `POST` | `/api/runs` | Yes | Launch asynchronous segmentation run (RFM, K-Means, Hierarchical, DBSCAN). |
| `GET` | `/api/runs/{id}` | Yes | Fetch run execution status, quality metrics, segments, and profiles. |
| `PATCH` | `/api/runs/{id}` | Yes | Rename an existing segmentation run. |
| `DELETE` | `/api/runs/{id}` | Yes | Delete segmentation run and cascade-delete segments and assignments. |
| `GET` | `/api/runs/{id}/customers`| Yes | Query paginated customer assignments with search and segment filter. |
| `GET` | `/api/runs/{id}/export/csv` | Yes | Download UTF-8 BOM CSV containing customer cluster assignments. |
| `GET` | `/api/runs/{id}/export/summary`| Yes | Download UTF-8 BOM CSV containing segment profiles and centroids. |
| `GET` | `/api/runs/{id}/export/json`| Yes | Download complete JSON archive with metadata and PCA coordinates. |
| `GET` | `/api/compare` | Yes | Compute Adjusted Rand Index and contingency matrix between two runs. |
| `POST` | `/api/contact` | No | Submit an inbound message or support feedback. |
| `GET` | `/api/admin/messages` | Admin | List all inbound contact inquiries. |
| `PATCH` | `/api/admin/messages/{id}` | Admin | Toggle read/unread status on a contact message. |
| `DELETE` | `/api/admin/messages/{id}` | Admin | Permanently delete a contact message. |
| `GET` | `/api/health` | No | System health check returning HTTP 200 `{"status": "ok"}`. |
| `GET` | `/api/meta/stats` | No | Public aggregate statistics (total customers segmented, run counts). |

</details>

---

## 9. Synthetic Sample Datasets

SegmentIQ includes a deterministic sample generator (`backend/app/services/sample_generator.py`) allowing instant evaluation without uploading private data:

1. **Online Store Transactions (`transactions`)**:
   - **Records**: 25,000 transaction rows across 2,495 distinct customers.
   - **Columns**: `order_id`, `customer_id`, `order_date`, `order_amount`, `category`.
   - **Cohorts Generated**: Synthetically models Champions (frequent large purchases), Occasionals, Lapsed, and At-Risk customer clusters over a 365-day rolling window.
2. **Mall Customer Features (`features`)**:
   - **Records**: 500 aggregated customer rows.
   - **Columns**: `customer_id`, `age`, `annual_income_k`, `spending_score`, `visits_per_month`.
   - **Cohorts Generated**: 5 distinct multi-dimensional demographic clusters with varying spending habits and visit frequencies.

---

## 10. Getting Started & Installation

### Prerequisites
- **Python**: Version `3.11+`
- **Node.js**: Version `20+` (LTS recommended)
- **Git**: Installed and configured

### Step-by-Step Setup (Windows PowerShell)

```powershell
# 1. Clone repository
git clone https://github.com/abhishek-khairnar/SegmentIQ.git
cd SegmentIQ

# 2. Configure Backend
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
alembic upgrade head

# 3. Start Backend Server (runs on http://127.0.0.1:8000)
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

In a second terminal window:

```powershell
# 4. Configure Frontend
cd SegmentIQ\frontend
npm install

# 5. Start Frontend Dev Server on port 3000
npm run dev -- -p 3000
```

### Step-by-Step Setup (macOS / Linux)

```bash
# 1. Clone repository
git clone https://github.com/abhishek-khairnar/SegmentIQ.git
cd SegmentIQ

# 2. Configure Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

In a second terminal window:

```bash
cd SegmentIQ/frontend
npm install
npm run dev -- -p 3000
```

### Environment Variables

| Variable | Scope | Purpose | Example / Default Value |
|---|---|---|---|
| `SECRET_KEY` | Backend | Cryptographic key for signing JWT tokens | `generate-a-strong-secret-key-32-chars` |
| `DATABASE_URL` | Backend | SQLAlchemy database connection string | `sqlite:///./segmentiq.db` |
| `STORAGE_PATH` | Backend | Filesystem directory for Parquet storage | `./storage` |
| `FRONTEND_ORIGIN`| Backend | Allowed CORS origin for browser requests | `http://localhost:3000` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Backend | JWT session duration | `10080` (7 days) |
| `BACKEND_URL` | Frontend | Target backend URL for Next.js rewrites | `http://127.0.0.1:8000` |

### Creating the Administrator Account
To grant an account access to `/dashboard/admin/messages`:

```powershell
# From the backend/ directory with venv activated:
python -c "from app.db import SessionLocal; from app.models import User; from app.security import hash_password; db = SessionLocal(); u = User(email='admin@segmentiq.com', name='Platform Admin', password_hash=hash_password('AdminPass123'), role='admin'); db.add(u); db.commit(); print('Admin created successfully.'); db.close()"
```

### First-Run Verification Checklist
- [x] Open `http://localhost:3000` — Landing page hero loads with live cluster simulation.
- [x] Open `http://localhost:3000/api/health` — Returns `{"status":"ok","app":"SegmentIQ"}`.
- [x] Open `http://localhost:3000/api-docs` — Swagger UI opens and lists all 31 endpoints.
- [x] Click **Try sample data** to load the Online Store Transactions sample.
- [x] Click **Segment this dataset** and run an RFM segmentation.

---

## 11. Running with Docker Compose

SegmentIQ includes multi-container Docker definitions (`docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`):

```bash
# Build and launch both services
docker-compose up --build
```

- **Frontend**: Accessible at `http://localhost:3000`
- **Backend API**: Accessible at `http://localhost:8000`
- *Note: Docker Compose configuration is provided for container deployment; local native execution is the verified development baseline.*

---

## 12. Automated Test Suites

### Backend Tests (`pytest`)
The backend suite covers Argon2 password hashing, JWT cookies, delimiter sniffing, median imputation, the full 25-cell RFM rule table, and scikit-learn clustering.

```powershell
cd backend
.\venv\Scripts\Activate.ps1
pytest tests/ -v
```
**Verified Pass Count**: `12 passed in 10.32s`

### Frontend End-to-End Tests (`Playwright`)
The frontend suite validates public page navigation, user authentication, sample loading, model execution, results tabs, comparison matrices, and admin message management.

```powershell
cd frontend
npx playwright test
```
**Verified Pass Count**: `7 passed in 59.1s`

---

## 13. Screenshot Regeneration

All 40 visual documentation screenshots can be regenerated with real application data via an automated Playwright script:

```powershell
cd frontend
npm run screenshots
```

The script:
1. Provisions or authenticates `demo@segmentiq.com`.
2. Seeds both sample datasets and verifies completion of RFM, K-Means, Hierarchical, and DBSCAN runs.
3. Visits all 40 views at 1440x900 (desktop) and 390x844 (mobile).
4. Clears temporary toast alerts and waits for canvas charts to render before capturing to `docs/screenshots/`.

---

## 14. Security Architecture

1. **Argon2id Password Storage**: Implements memory-hard password derivation via `passlib[argon2]`.
2. **HttpOnly SameSite Cookies**: Authentication tokens are stored in `HttpOnly` cookies with `SameSite=Lax` protection, preventing client-side script access.
3. **Multi-Tenant Ownership Enforcement**: Every database query verifies `WHERE user_id = :current_user_id`.
4. **Strict File Upload Validation**: Validates file extension, MIME type, max file size (20 MB), and drops rows containing invalid or malicious types.
5. **Rate Limiting**: Critical authentication endpoints (`/api/auth/login`, `/api/auth/register`) are rate-limited via SlowAPI to prevent brute-force attacks.

---

## 15. Production Deployment Guide

### Frontend on Vercel
1. Link your GitHub repository to Vercel.
2. Set Root Directory to `frontend`.
3. Configure Environment Variable:
   - `BACKEND_URL`: `https://your-backend-api.onrender.com`
4. Deploy.

### Backend on Render / Railway
1. Create a Python Web Service linked to the repository.
2. Set Root Directory to `backend`.
3. Set Build Command: `pip install -r requirements.txt && alembic upgrade head`
4. Set Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Configure Environment Variables:
   - `SECRET_KEY`: Long random string
   - `DATABASE_URL`: Managed PostgreSQL connection URI (`postgresql://...`)
   - `FRONTEND_ORIGIN`: `https://your-segmentiq-app.vercel.app`

---

## 16. Troubleshooting & Common Pitfalls

| Problem | Root Cause | Verified Resolution |
|---|---|---|
| **Port 3000 or 8000 Already in Use** | A previous instance is still running. | Windows: `Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess \| Stop-Process -Force`. Linux: `fuser -k 3000/tcp`. |
| **PowerShell Script Execution Policy Error** | PowerShell blocks virtual environment activation. | Run: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`, then re-run `.\venv\Scripts\Activate.ps1`. |
| **CORS / API Rewrite Errors (404 on `/api/*`)** | Frontend cannot reach backend API. | Ensure backend is running on `http://127.0.0.1:8000` and `BACKEND_URL` is set in frontend `.env`. |
| **Tailwind CSS v4 `@theme` Warning** | Missing `@tailwindcss/postcss` compiler. | Run `npm install -D @tailwindcss/postcss` in `frontend/` and ensure `postcss.config.mjs` contains the plugin. |
| **Playwright Browsers Missing** | Chromium binaries not downloaded. | Run `npx playwright install chromium` in `frontend/`. |
| **Alembic Database Migration Errors** | Database schema mismatch. | Run `alembic upgrade head` from `backend/` or delete `segmentiq.db` in development to re-initialize. |
| **CSV File Upload Rejected (>20 MB)** | Upload exceeds platform safety limit. | Pre-filter your CSV to $\le 20\text{ MB}$ or $\le 200,000\text{ rows}$ before uploading. |
| **Column Mismatch on Clustering Run** | Selected feature name not in dataset. | Open Dataset Details, click **Edit Column Mapping**, verify mapped names, and click **Save Mapping**. |

---

## 17. Limitations & Future Roadmap

### Current Limitations
- **File Types**: Currently accepts CSV formats only (Excel `.xlsx` must be exported to `.csv` prior to upload).
- **Single-Machine Compute**: Clustering calculations run synchronously on the backend worker; large datasets ($>100,000$ rows) take several seconds to compute.
- **Hierarchical Scaling**: Hierarchical clustering uses stratified subsampling above 20,000 rows to avoid $O(N^2)$ memory limits.

### Future Roadmap
- [ ] Direct database connectors (PostgreSQL, Snowflake, BigQuery).
- [ ] Automated email provider export sync (Klaviyo, HubSpot, Mailchimp APIs).
- [ ] Cohort drift tracking and automatic segment migration alerts over time.
- [ ] UMAP dimensionality reduction alongside PCA.

---

## 18. License & Author

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for full details.

Developed with precision by **Abhishek Khairnar**  
- **GitHub**: [@abhishek-khairnar](https://github.com/abhishek-khairnar)  
- **Repository**: [https://github.com/abhishek-khairnar/SegmentIQ](https://github.com/abhishek-khairnar/SegmentIQ)

### Acknowledgements
- [scikit-learn](https://scikit-learn.org/) for robust unsupervised machine learning algorithms.
- [FastAPI](https://fastapi.tiangolo.com/) for modern, typed asynchronous Python web services.
- [Next.js](https://nextjs.org/) & [Tailwind CSS](https://tailwindcss.com/) for fluid frontend engineering.
