# StockSense — Backend Foundation (Phase 1)

StockSense is an **Adaptive, Risk-Aware Inventory Replenishment Engine**. This service provides the core FastAPI application, database schemas, configuration management, and migration infrastructure.

---

## 1. System Architecture & Directory Structure

```
backend/
├── alembic.ini                   # Alembic migration configuration
├── alembic/
│   ├── env.py                   # Dynamic migration runner (SQLite batch + PostgreSQL)
│   ├── script.py.mako           # Migration template
│   └── versions/
│       └── 0001_initial_schema.py # Initial migration for the 6 core entities
├── app/
│   ├── __init__.py              # Package marker
│   ├── main.py                  # FastAPI application factory & lifespan manager
│   ├── core/
│   │   ├── config.py            # Pydantic BaseSettings & production safety validation
│   │   ├── errors.py            # Standardized error responses & exception handlers
│   │   └── logging.py           # Structured logging with sensitive data masking
│   ├── db/
│   │   ├── base.py              # Declarative Base with explicit naming conventions
│   │   └── session.py           # Dialect-aware engine builder & get_db dependency
│   ├── models/                  # SQLAlchemy 2.0 ORM models
│   │   ├── product.py           # products
│   │   ├── demand.py            # demand_records
│   │   ├── anomaly.py           # anomaly_reviews
│   │   ├── forecast.py          # forecast_runs
│   │   ├── recommendation.py    # recommendations
│   │   └── scenario.py          # scenario_runs
│   ├── schemas/                 # Pydantic request/response validation schemas
│   │   ├── common.py            # Health & error schemas
│   │   ├── product.py
│   │   ├── demand.py
│   │   ├── anomaly.py
│   │   ├── forecast.py
│   │   ├── recommendation.py
│   │   └── scenario.py
│   ├── api/
│   │   ├── health.py            # GET /health/live and GET /health/ready
│   │   └── v1/
│   │       └── router.py        # Versioned router mounted at /api/v1
│   └── services/                # Business logic services (reserved for future phases)
├── tests/                       # Pytest automated test suite (100% isolated)
│   ├── conftest.py              # Isolated in-memory & file DB fixtures
│   ├── test_app.py              # Import, startup, CORS, and OpenAPI checks
│   ├── test_config.py           # Settings validation & production safety checks
│   ├── test_database.py         # Session lifecycle, CRUD, and constraint checks
│   ├── test_errors.py           # Error formats & stack trace masking checks
│   ├── test_health.py           # Liveness & readiness probe checks
│   ├── test_isolation.py        # Zero external credential dependency checks
│   └── test_migrations.py       # Alembic upgrade, inspect, and downgrade checks
├── .env.example                 # Safe environment configuration template
├── pyproject.toml               # Build system, pytest, and ruff linting configuration
├── requirements.txt             # Production dependencies
└── requirements-dev.txt         # Development & testing dependencies
```

---

## 2. Local Setup Instructions (Windows PowerShell)

Follow these exact steps from a freshly cloned repository.

### Step 1: Open PowerShell and Navigate to the Backend Directory
```powershell
cd backend
```

### Step 2: Create a Python 3.11 Virtual Environment
```powershell
py -3.11 -m venv .venv
```

### Step 3: Activate the Virtual Environment (CRITICAL)
```powershell
.\.venv\Scripts\Activate.ps1
```
*(If PowerShell blocks script execution, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first).*

> **IMPORTANT**: Always activate `.venv` before running commands, or explicitly prefix commands with `.\.venv\Scripts\` (e.g. `.\.venv\Scripts\alembic upgrade head`). Running bare `alembic` without activating the virtual environment invokes the system's global Python 3.13 interpreter instead of the project's Python 3.11 virtual environment.

### Step 4: Install Dependencies
```powershell
pip install -r requirements-dev.txt
```

### Step 5: Configure Environment Variables
Copy the example template to create your local `.env`:
```powershell
Copy-Item .env.example .env
```

To connect to the local Docker PostgreSQL container on port `5434`:
```ini
ENVIRONMENT=development
DATABASE_URL="postgresql+psycopg2://stocksense_app:stocksense_dev_password@localhost:5434/stocksense"
SECRET_KEY="dev_insecure_secret_key_change_in_production_min32chars"
```

---

## 3. Database Migration & Demo Data Seeding

### Apply Schema Migrations
```powershell
# Using activated venv:
alembic upgrade head

# Or explicitly via .venv executable:
.\.venv\Scripts\alembic upgrade head
```

### Seed Deterministic Demo Dataset
Seed the database with the required synthetic products and daily demand records:
```powershell
python -c "from app.db.session import SessionLocal; from app.seed.demo_data import seed_demo_data; db = SessionLocal(); seed_demo_data(db); db.close()"
```

---

## 4. Running the Backend Server

Start the development server with hot reload:

```powershell
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Once running:
- **Liveness Probe**: `http://127.0.0.1:8000/health/live`
- **Readiness Probe**: `http://127.0.0.1:8000/health/ready`
- **API Status**: `http://127.0.0.1:8000/api/v1/status`
- **List Products**: `http://127.0.0.1:8000/api/v1/products`
- **Product Details**: `http://127.0.0.1:8000/api/v1/products/1`
- **Product Demand**: `http://127.0.0.1:8000/api/v1/products/1/demand`
- **Interactive OpenAPI Docs**: `http://127.0.0.1:8000/docs`
- **Alternative ReDoc**: `http://127.0.0.1:8000/redoc`

---

## 5. Running the Automated Test Suite

Run all automated unit, integration, and migration tests:

```powershell
pytest -v
```

Run code formatting and linting:

```powershell
ruff check app tests
ruff format app tests
```

---

## 6. Core Database Entities (Schema Reference)

| Table | Logical Responsibility | Key Constraints & Indexes |
|---|---|---|
| `products` | Product master, on-hand stock, lead-time profile, costs, supplier constraints. | Unique SKU, non-negative stock/cost checks, positive lead-time check, service-level range check. |
| `demand_records` | Historical daily sales observations per product, preserving stockout and promotion context. | Unique `(product_id, date)`, non-negative quantity, cascade delete on product. |
| `anomaly_reviews` | Stores flagged anomaly observations, classifications, reviewer notes, and adjusted values. | Foreign key to `demand_records`, check constraint on classification (`'promotion'`, `'data_error'`, `'unknown'`). |
| `forecast_runs` | Records baseline vs. candidate forecast evaluation runs and comparative metrics (MAE, WAPE). | Foreign key to `products`, cascade delete. |
| `recommendations` | Explainable replenishment recommendations (ROP, safety stock, order qty, assumptions). | Foreign key to `products`, non-negative order qty check, urgency constraint, status constraint. |
| `scenario_runs` | What-if simulation parameters, demand surges, supplier delays, and stress impact summaries. | Foreign key to `products`, non-negative surge and delay checks. |

---

## 7. Production Readiness & Configuration Safety

1. **PostgreSQL Requirement**:
   In production (`ENVIRONMENT=production`), the application strictly rejects SQLite and requires a valid `postgresql://` connection string.
2. **Secret Key Safeguards**:
   Production mode validates that `SECRET_KEY` is at least 32 characters long and does not contain dev placeholder tokens.
3. **Secret Masking**:
   Passkeys and database credentials are automatically masked from all logs, health check responses, and unhandled exception responses.
4. **Unverified PostgreSQL Checks**:
   Because a live PostgreSQL daemon was not present in the local Windows test environment, PostgreSQL-specific tests (such as native `JSONB` optimizations and Supabase row-level security) remain to be verified on staging infrastructure with live PostgreSQL.
