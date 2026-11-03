from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import Alert
from app.schemas.schemas import AlertResponse, AlertConfigResponse, AlertConfigUpdate
from app.services.alert_service import AlertService

router = APIRouter(prefix="/alerts", tags=["Intelligent Alerts"])

@router.get("", response_model=List[AlertResponse])
def get_alerts(unread_only: bool = False, db: Session = Depends(get_db)):
    """
    Returns active triggered alerts:
    - Announcement-based alerts (results, M&A, leadership changes)
    - Market-based alerts (unusual volume surge > 2x, price movement > ±5%)
    """
    query = db.query(Alert)
    if unread_only:
        query = query.filter(Alert.is_read == False)
    alerts = query.order_by(Alert.triggered_at.desc()).all()
    return alerts

@router.get("/config", response_model=AlertConfigResponse)
def get_alert_config(db: Session = Depends(get_db)):
    """
    Retrieves the configurable alert thresholds.
    """
    cfg = AlertService.get_or_create_config(db)
    return AlertConfigResponse(
        price_movement_threshold_pct=cfg.price_movement_threshold_pct,
        volume_spike_threshold_multiplier=cfg.volume_spike_threshold_multiplier,
        monitored_categories=cfg.monitored_categories or []
    )

@router.put("/config", response_model=AlertConfigResponse)
def update_alert_config(payload: AlertConfigUpdate, db: Session = Depends(get_db)):
    """
    Allows the user to customize what 'unusual' means:
    - Modify price movement % threshold (e.g. 3%, 5%, 8%)
    - Modify volume spike multiplier (e.g. 1.5x, 2.0x, 3.0x)
    - Select corporate categories of interest
    """
    updated = AlertService.update_config(
        db=db,
        price_threshold_pct=payload.price_movement_threshold_pct,
        volume_threshold_multiplier=payload.volume_spike_threshold_multiplier,
        monitored_categories=payload.monitored_categories
    )
    return AlertConfigResponse(
        price_movement_threshold_pct=updated.price_movement_threshold_pct,
        volume_spike_threshold_multiplier=updated.volume_spike_threshold_multiplier,
        monitored_categories=updated.monitored_categories or []
    )

@router.post("/{alert_id}/read")
def mark_alert_read(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_read = True
    db.commit()
    return {"message": "Alert marked as read", "alert_id": alert_id}

@router.post("/evaluate")
def trigger_alert_evaluation(db: Session = Depends(get_db)):
    """
    Runs an immediate evaluation scan across the portfolio.
    """
    created = AlertService.evaluate_market_alerts(db)
    return {
        "status": "success",
        "new_alerts_triggered": len(created),
        "alerts": [a.title for a in created]
    }

