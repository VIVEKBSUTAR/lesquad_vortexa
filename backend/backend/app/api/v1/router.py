from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.health import health_ready
from app.api.v1.anomalies import router as anomalies_router
from app.api.v1.forecasts import router as forecasts_router
from app.api.v1.imports import router as imports_router
from app.api.v1.products import router as products_router
from app.api.v1.recommendations import router as recommendations_router
from app.api.v1.scenarios import router as scenarios_router
from app.core.config import settings
from app.db.session import get_db
from app.schemas.common import HealthReadyResponse

api_router = APIRouter()
api_router.include_router(products_router)
api_router.include_router(imports_router)
api_router.include_router(recommendations_router)
api_router.include_router(anomalies_router)
api_router.include_router(forecasts_router)
api_router.include_router(scenarios_router)


class ApiMetaResponse(BaseModel):
    name: str
    version: str
    status: str
    phase: str


@api_router.get(
    "/status",
    response_model=ApiMetaResponse,
    summary="API v1 Status",
    description="Returns API service information and status for version 1.",
)
async def api_status() -> ApiMetaResponse:
    return ApiMetaResponse(
        name=settings.PROJECT_NAME,
        version=settings.VERSION,
        status="active",
        phase=(
            "Phase 1 - Backend Foundation (Phase 2 - CSV Import, "
            "Phase 3 - Replenishment, Phase 4 - Demand Anomaly Review, "
            "Phase 5 - Forecast Benchmark & Evaluation, "
            "Phase 6 - What-If Replenishment Simulator)"
        ),
    )


@api_router.get(
    "/health",
    response_model=HealthReadyResponse,
    summary="API v1 Health Probe",
    description="Check service and database readiness for API v1.",
)
def api_v1_health(db: Session = Depends(get_db)):
    return health_ready(db)
