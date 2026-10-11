from datetime import date
from decimal import Decimal
from typing import Dict, List

from sqlalchemy.orm import Session

from app.core.logging import logger
from app.models.demand import DemandRecord
from app.models.product import Product

# Clearly labelled deterministic synthetic demo dataset
DEMO_PRODUCTS = [
    {
        "sku": "SKU-001",
        "name": "Notebook (Demo Synthetic)",
        "category": "Stationery",
        "unit_of_measure": "piece",
        "current_stock": 80,
        "committed_qty": 5,
        "safety_stock": 18,
        "reorder_point": 65,
        "lead_time_days": 4,
        "lead_time_stddev_days": 1.2,
        "unit_cost": Decimal("25.00"),
        "ordering_cost": Decimal("100.00"),
        "holding_cost_rate": Decimal("0.1600"),
        "target_service_level": 0.95,
        "minimum_order_qty": 10,
        "pack_size": 5,
        "is_active": True,
    },
    {
        "sku": "SKU-002",
        "name": "Water Bottle (Demo Synthetic)",
        "category": "Accessories",
        "unit_of_measure": "piece",
        "current_stock": 24,
        "committed_qty": 0,
        "safety_stock": 12,
        "reorder_point": 45,
        "lead_time_days": 7,
        "lead_time_stddev_days": 2.0,
        "unit_cost": Decimal("90.00"),
        "ordering_cost": Decimal("100.00"),
        "holding_cost_rate": Decimal("0.1333"),
        "target_service_level": 0.95,
        "minimum_order_qty": 6,
        "pack_size": 2,
        "is_active": True,
    },
]

DEMO_DEMAND_RECORDS: Dict[str, List[dict]] = {
    "SKU-001": [
        {
            "date": date(2026, 9, 1),
            "quantity": 12.0,
            "stockout_flag": False,
            "promotion_flag": False,
            "notes": None,
        },
        {
            "date": date(2026, 9, 2),
            "quantity": 15.0,
            "stockout_flag": False,
            "promotion_flag": False,
            "notes": None,
        },
        {
            "date": date(2026, 9, 3),
            "quantity": 48.0,
            "stockout_flag": False,
            "promotion_flag": True,
            "notes": "festival promotion (demand spike)",
        },
        {
            "date": date(2026, 9, 4),
            "quantity": 0.0,
            "stockout_flag": True,
            "promotion_flag": False,
            "notes": "out of stock (censored demand)",
        },
        {
            "date": date(2026, 9, 5),
            "quantity": 11.0,
            "stockout_flag": False,
            "promotion_flag": False,
            "notes": None,
        },
        {
            "date": date(2026, 9, 6),
            "quantity": 14.0,
            "stockout_flag": False,
            "promotion_flag": False,
            "notes": None,
        },
        {
            "date": date(2026, 9, 7),
            "quantity": 13.0,
            "stockout_flag": False,
            "promotion_flag": False,
            "notes": None,
        },
    ],
    "SKU-002": [
        {
            "date": date(2026, 9, 1),
            "quantity": 5.0,
            "stockout_flag": False,
            "promotion_flag": False,
            "notes": None,
        },
        {
            "date": date(2026, 9, 2),
            "quantity": 7.0,
            "stockout_flag": False,
            "promotion_flag": False,
            "notes": None,
        },
        {
            "date": date(2026, 9, 3),
            "quantity": 6.0,
            "stockout_flag": False,
            "promotion_flag": False,
            "notes": None,
        },
        {
            "date": date(2026, 9, 4),
            "quantity": 8.0,
            "stockout_flag": False,
            "promotion_flag": False,
            "notes": None,
        },
        {
            "date": date(2026, 9, 5),
            "quantity": 0.0,
            "stockout_flag": False,
            "promotion_flag": False,
            "notes": "explicit zero demand day (open store)",
        },
        {
            "date": date(2026, 9, 6),
            "quantity": 6.0,
            "stockout_flag": False,
            "promotion_flag": False,
            "notes": None,
        },
        {
            "date": date(2026, 9, 7),
            "quantity": 7.0,
            "stockout_flag": False,
            "promotion_flag": False,
            "notes": None,
        },
    ],
}


def seed_demo_data(db: Session) -> Dict[str, int]:
    """
    Idempotently seeds deterministic demo products and demand records.
    Never overwrites existing products.
    """
    seeded_products = 0
    seeded_demand = 0

    for prod_data in DEMO_PRODUCTS:
        existing = db.query(Product).filter_by(sku=prod_data["sku"]).first()
        if not existing:
            product = Product(**prod_data)
            db.add(product)
            db.flush()  # Populates product.id
            seeded_products += 1

            # Seed demand records for this product
            demand_items = DEMO_DEMAND_RECORDS.get(product.sku, [])
            for item in demand_items:
                record = DemandRecord(
                    product_id=product.id,
                    date=item["date"],
                    quantity=item["quantity"],
                    stockout_flag=item["stockout_flag"],
                    promotion_flag=item["promotion_flag"],
                    notes=item["notes"],
                )
                db.add(record)
                seeded_demand += 1
        else:
            logger.info(
                "Demo product SKU '%s' already exists, skipping insertion.", prod_data["sku"]
            )

    db.commit()
    logger.info("Seeded %d demo products and %d demand records.", seeded_products, seeded_demand)
    return {"products": seeded_products, "demand_records": seeded_demand}
