import pytest
from fastapi.testclient import TestClient
from sqlalchemy import inspect

from app.core.config import settings
from app.db.session import check_database_connection, engine
from app.main import app


@pytest.fixture(scope="module")
def postgres_live_check():
    """Skip if live PostgreSQL database is not reachable."""
    if settings.is_sqlite:
        pytest.skip("Test environment is configured with SQLite; skipping live PostgreSQL checks.")
    if not check_database_connection(engine):
        pytest.skip("PostgreSQL database is not reachable on configured port.")
    return True


def test_postgres_container_connectivity(postgres_live_check):
    """Verify live PostgreSQL connection and dialect."""
    assert check_database_connection(engine) is True
    assert engine.dialect.name == "postgresql"


def test_postgres_schema_tables_exist(postgres_live_check):
    """Verify all 6 core tables exist in the live PostgreSQL database."""
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    expected = {
        "products",
        "demand_records",
        "anomaly_reviews",
        "forecast_runs",
        "recommendations",
        "scenario_runs",
    }
    assert expected.issubset(tables)


def test_postgres_http_retrieval_demo_data(postgres_live_check):
    """
    Verify Exit Requirement C:
    Demo products and their daily demand can be retrieved through the read-only HTTP endpoints
    against the live PostgreSQL database.
    """
    with TestClient(app) as client:
        # 1. Retrieve products
        res = client.get("/api/v1/products")
        assert res.status_code == 200
        prods = res.json()
        assert len(prods) >= 2
        skus = {p["sku"] for p in prods}
        assert "SKU-001" in skus
        assert "SKU-002" in skus

        # Find SKU-001
        p1 = next(p for p in prods if p["sku"] == "SKU-001")
        assert p1["current_stock"] == 80
        assert p1["unit_of_measure"] == "piece"

        # 2. Retrieve SKU-001 details by ID
        p1_res = client.get(f"/api/v1/products/{p1['id']}")
        assert p1_res.status_code == 200
        assert p1_res.json()["sku"] == "SKU-001"

        # 3. Retrieve SKU-001 demand
        d1_res = client.get(f"/api/v1/products/{p1['id']}/demand")
        assert d1_res.status_code == 200
        demands = d1_res.json()
        assert len(demands) >= 7

        # Verify stockout-affected observation and promotion surge are present
        stockouts = [d for d in demands if d["stockout_flag"] is True]
        assert len(stockouts) >= 1
        assert stockouts[0]["quantity"] == 0.0

        promos = [d for d in demands if d["promotion_flag"] is True]
        assert len(promos) >= 1
        assert promos[0]["quantity"] == 48.0


def test_postgres_replenishment_calculation_live(postgres_live_check):
    """
    Verify Phase 3:
    Replenishment recommendation calculation, snapshot persistence, and retrieval
    against live PostgreSQL container database.
    """
    with TestClient(app) as client:
        # 1. Retrieve SKU-001
        prods_res = client.get("/api/v1/products")
        assert prods_res.status_code == 200
        prods = prods_res.json()
        p1 = next(p for p in prods if p["sku"] == "SKU-001")

        # 2. Calculate and persist recommendation
        calc_res = client.post(f"/api/v1/products/{p1['id']}/recommendations/calculate")
        assert calc_res.status_code == 200
        rec = calc_res.json()
        assert rec["product_id"] == p1["id"]
        assert rec["reorder_point"] > 0
        assert rec["safety_stock"] > 0
        assert rec["formula_version"] == "v1.0"
        assert rec["input_snapshot"]["sku"] == "SKU-001"
        assert rec["assumptions"]["demand_model"]["mean_daily_demand"] > 0

        # 3. Retrieve latest recommendation
        latest_res = client.get(f"/api/v1/products/{p1['id']}/recommendations/latest")
        assert latest_res.status_code == 200
        assert latest_res.json()["id"] == rec["id"]

        # 4. Retrieve recommendations overview
        overview_res = client.get("/api/v1/recommendations?latest_only=true")
        assert overview_res.status_code == 200
        assert any(item["id"] == rec["id"] for item in overview_res.json()["items"])
