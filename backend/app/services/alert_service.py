from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.models import Alert, AlertThresholdConfig, StockPriceSnapshot, Announcement, PortfolioItem
from app.services.stock_service import StockService

class AlertService:
    @classmethod
    def get_or_create_config(cls, db: Session) -> AlertThresholdConfig:
        config = db.query(AlertThresholdConfig).first()
        if not config:
            config = AlertThresholdConfig(
                price_movement_threshold_pct=5.0,
                volume_spike_threshold_multiplier=2.0,
                monitored_categories=["results", "M&A", "management_change", "litigation", "fund_raise", "credit_rating", "capex"]
            )
            db.add(config)
            db.commit()
            db.refresh(config)
        return config

    @classmethod
    def update_config(
        cls,
        db: Session,
        price_threshold_pct: Optional[float] = None,
        volume_threshold_multiplier: Optional[float] = None,
        monitored_categories: Optional[List[str]] = None
    ) -> AlertThresholdConfig:
        config = cls.get_or_create_config(db)
        if price_threshold_pct is not None:
            config.price_movement_threshold_pct = price_threshold_pct
        if volume_threshold_multiplier is not None:
            config.volume_spike_threshold_multiplier = volume_threshold_multiplier
        if monitored_categories is not None:
            config.monitored_categories = monitored_categories

        db.commit()
        db.refresh(config)
        return config

    @classmethod
    def evaluate_market_alerts(cls, db: Session) -> List[Alert]:
        """
        Scans all portfolio stocks and detects whether price movement or volume spike exceeds
        the user's configured thresholds.
        """
        config = cls.get_or_create_config(db)
        price_thresh = config.price_movement_threshold_pct
        vol_thresh = config.volume_spike_threshold_multiplier

        portfolio_items = db.query(PortfolioItem).filter(PortfolioItem.is_active == True).all()
        created_alerts = []

        now = datetime.utcnow()

        for item in portfolio_items:
            snapshot = StockService.fetch_stock_snapshot(item.ticker, db)
            pct_change = abs(snapshot.get("pct_change", 0.0))
            spike_ratio = snapshot.get("volume_spike_ratio", 1.0)
            cur_price = snapshot.get("current_price", 0.0)
            vol = snapshot.get("volume", 0.0)
            avg_vol = snapshot.get("avg_vol_20d", 0.0)

            # Check price threshold trigger
            if pct_change >= price_thresh:
                direction = "surged" if snapshot.get("pct_change", 0.0) > 0 else "plummeted"
                title = f"{item.ticker} {direction} {snapshot.get('pct_change', 0.0):+.2f}%"
                msg = f"Stock price crossed the ±{price_thresh}% threshold. Last traded at ₹{cur_price:,.2f} (prev close: ₹{snapshot.get('previous_close', 0.0):,.2f})."
                
                # Deduplicate: check if similar alert created in the last 12 hours
                existing = db.query(Alert).filter(
                    Alert.ticker == item.ticker,
                    Alert.alert_type == "price_shock",
                    Alert.triggered_at >= now - timedelta(hours=12)
                ).first()

                if not existing:
                    alert = Alert(
                        ticker=item.ticker,
                        company_name=item.name,
                        alert_type="price_shock",
                        title=title,
                        message=msg,
                        priority="Critical" if pct_change >= 8.0 else "High",
                        threshold_info=f"Price Move: {snapshot.get('pct_change', 0.0):+.2f}% vs Threshold: ±{price_thresh}%",
                        triggered_at=now
                    )
                    db.add(alert)
                    created_alerts.append(alert)

            # Check volume spike trigger
            if spike_ratio >= vol_thresh:
                title = f"Unusual Volume Surge in {item.ticker} ({spike_ratio:.1f}x 20d Average)"
                msg = f"Trading volume reached {vol:,.0f} shares vs 20-day historical average of {avg_vol:,.0f} shares ({spike_ratio:.1f}x normal liquidity)."
                
                existing_vol = db.query(Alert).filter(
                    Alert.ticker == item.ticker,
                    Alert.alert_type == "volume_spike",
                    Alert.triggered_at >= now - timedelta(hours=12)
                ).first()

                if not existing_vol:
                    alert = Alert(
                        ticker=item.ticker,
                        company_name=item.name,
                        alert_type="volume_spike",
                        title=title,
                        message=msg,
                        priority="High",
                        threshold_info=f"Volume: {spike_ratio:.1f}x 20d Avg (Threshold: {vol_thresh:.1f}x)",
                        triggered_at=now
                    )
                    db.add(alert)
                    created_alerts.append(alert)

        if created_alerts:
            db.commit()

        return created_alerts

    @classmethod
    def seed_initial_alerts(cls, db: Session):
        """
        Seeds initial triggered alerts for demonstration so user sees both announcement
        and market-based alerts immediately.
        """
        if db.query(Alert).count() > 0:
            return

        now = datetime.utcnow()
        sample_alerts = [
            {
                "ticker": "TATAMOTORS",
                "company_name": "Tata Motors Ltd.",
                "alert_type": "volume_spike",
                "title": "Unusual Volume Surge in TATAMOTORS (2.6x 20d Average)",
                "message": "Traded volume reached 21.4M shares against 20-day average of 8.2M shares following new JLR CEO announcement.",
                "priority": "Critical",
                "category": "management_change",
                "threshold_info": "Volume: 2.6x 20d Avg (Threshold: 2.0x)",
                "is_read": False,
                "triggered_at": now - timedelta(hours=2)
            },
            {
                "ticker": "RELIANCE",
                "company_name": "Reliance Industries Ltd.",
                "alert_type": "announcement",
                "title": "Material Q2 Financial Results Filed",
                "message": "Q2 Consolidated PAT reported at ₹19,324 Cr (+11.4% YoY), driven by 18.7% EBITDA margin and Retail footprint expansion.",
                "priority": "Critical",
                "category": "results",
                "threshold_info": "Material Category: results",
                "is_read": False,
                "triggered_at": now - timedelta(hours=7)
            },
            {
                "ticker": "SUNPHARMA",
                "company_name": "Sun Pharmaceutical Industries Ltd.",
                "alert_type": "announcement",
                "title": "Material Cross-Border M&A: Checkpoint Therapeutics",
                "message": "Definitive agreement to acquire NASDAQ-listed Checkpoint Therapeutics for $570M to expand oncology portfolio.",
                "priority": "Critical",
                "category": "M&A",
                "threshold_info": "Material Category: M&A",
                "is_read": False,
                "triggered_at": now - timedelta(hours=15)
            },
            {
                "ticker": "BHARTIARTL",
                "company_name": "Bharti Airtel Ltd.",
                "alert_type": "announcement",
                "title": "Supreme Court Curative Petition on AGR Dues",
                "message": "Airtel files supplementary submission for correction of calculation discrepancies in statutory AGR liabilities.",
                "priority": "High",
                "category": "litigation",
                "threshold_info": "Material Category: litigation",
                "is_read": True,
                "triggered_at": now - timedelta(days=2)
            }
        ]

        for a in sample_alerts:
            db.add(Alert(**a))
        db.commit()

