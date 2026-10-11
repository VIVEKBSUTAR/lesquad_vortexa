from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict, Field


class ScenarioRunBase(BaseModel):
    product_id: int
    scenario_name: str = Field(..., max_length=128)
    demand_surge_pct: float = Field(default=0.0, ge=0)
    supplier_delay_days: int = Field(default=0, ge=0)
    projected_unmet_demand: Optional[float] = None
    projected_total_cost: Optional[float] = None
    parameters: Optional[Dict[str, Any]] = None
    results_summary: Optional[Dict[str, Any]] = None


class ScenarioRunCreate(ScenarioRunBase):
    pass


class ScenarioRunRead(ScenarioRunBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
