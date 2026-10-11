from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.demand import DemandRecord
from app.models.product import Product
from app.schemas.demand import DemandRecordRead
from app.schemas.product import ProductRead

router = APIRouter(prefix="/products", tags=["Products"])


@router.get(
    "",
    response_model=List[ProductRead],
    summary="List Products",
    description="Retrieve all configured products and inventory profiles.",
)
def list_products(db: Session = Depends(get_db)) -> List[ProductRead]:
    products = db.query(Product).order_by(Product.id.asc()).all()
    return products


@router.get(
    "/{product_id}",
    response_model=ProductRead,
    summary="Get Product Details",
    description="Retrieve specific product details and parameters by product ID.",
)
def get_product(product_id: int, db: Session = Depends(get_db)) -> ProductRead:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found.",
        )
    return product


@router.get(
    "/{product_id}/demand",
    response_model=List[DemandRecordRead],
    summary="Get Product Daily Demand",
    description="Retrieve historical daily demand records for a specific product.",
)
def get_product_demand(product_id: int, db: Session = Depends(get_db)) -> List[DemandRecordRead]:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found.",
        )
    records = (
        db.query(DemandRecord)
        .filter(DemandRecord.product_id == product_id)
        .order_by(DemandRecord.date.asc())
        .all()
    )
    return records
