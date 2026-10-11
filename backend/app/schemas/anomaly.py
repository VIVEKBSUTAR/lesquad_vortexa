from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class AnomalyReviewBase(BaseModel):
    demand_record_id: int
    classification: Literal["promotion", "data_error", "unknown"]
    reviewer_notes: Optional[str] = None
    original_quantity: float = Field(..., ge=0)
    adjusted_quantity: Optional[float] = Field(None, ge=0)


class AnomalyReviewCreate(AnomalyReviewBase):
    pass


class AnomalyReviewRead(AnomalyReviewBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    reviewed_at: datetime
    created_at: datetime
