from fastapi import status
from fastapi.testclient import TestClient

from app.main import app, create_app


def test_app_imports_successfully():
    """Verify application modules import without error."""
    assert app is not None
    assert callable(create_app)


def test_app_starts_with_test_config(client: TestClient):
    """Verify application starts and responds using test configuration."""
    response = client.get("/api/v1/status")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == "StockSense" or "StockSense" in data["name"]
    assert data["status"] == "active"
    assert "Phase 1" in data["phase"]


def test_cors_headers(client: TestClient):
    """Verify CORS middleware responds with allowed origins."""
    response = client.options(
        "/api/v1/status",
        headers={
            "Origin": "http://testserver",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.headers.get("access-control-allow-origin") == "http://testserver"


def test_openapi_documentation_available_in_test_mode(client: TestClient):
    """Verify OpenAPI schema is available in non-production mode."""
    response = client.get("/openapi.json")
    assert response.status_code == status.HTTP_200_OK
    schema = response.json()
    assert "openapi" in schema
    assert schema["info"]["title"] == "StockSense" or "StockSense" in schema["info"]["title"]


def test_root_index_endpoint(client: TestClient):
    """Verify GET / returns service metadata and links."""
    response = client.get("/")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["service"] == "StockSense" or "StockSense" in data["service"]
    assert "docs_url" in data
    assert "api_v1_products" in data
