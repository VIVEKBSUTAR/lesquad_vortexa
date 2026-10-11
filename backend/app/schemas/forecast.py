from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ForecastRunBase(BaseModel):
    product_id: int
    baseline_method: str = Field(default="moving_average", max_length=64)
    candidate_method: str = Field(..., max_length=64)
    mae_baseline: Optional[float] = None
    mae_candidate: Optional[float] = None
    wape_baseline: Optional[float] = None
    wape_candidate: Optional[float] = None
    holdout_start_date: Optional[date] = None
    holdout_end_date: Optional[date] = None
    status: str = Field(default="completed", max_length=32)


class ForecastRunCreate(ForecastRunBase):
    pass


class ForecastRunRead(ForecastRunBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
