from datetime import datetime
from typing import Any, Dict, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class RecommendationBase(BaseModel):
    product_id: int
    recommended_order_quantity: int = Field(..., ge=0)
    current_stock: int
    safety_stock: int
    reorder_point: int
    urgency: Literal["low", "medium", "high", "critical"] = "medium"
    explanation: Optional[str] = None
    assumptions: Optional[Dict[str, Any]] = None
    status: Literal["pending", "approved", "rejected"] = "pending"


class RecommendationCreate(RecommendationBase):
    pass


class RecommendationRead(RecommendationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
