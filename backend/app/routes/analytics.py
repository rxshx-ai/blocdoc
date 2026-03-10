"""
Analytics API Routes for Healthcare Logistics Dashboard
Provides endpoints for KPIs, trends, and predictive analytics
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from datetime import datetime, timedelta

from app.dependencies import get_analytics_service, get_notification_service
from app.services.analytics_service import AnalyticsService
from app.services.notification_service import NotificationService
from app.security.rbac import Principal, Role, require_roles

router = APIRouter(tags=["analytics"])


@router.get("/analytics/kpis")
def get_dashboard_kpis(
    analytics: AnalyticsService = Depends(get_analytics_service),
    principal: Principal = Depends(require_roles(Role.admin, Role.shipper, Role.provider)),
) -> dict:
    """Get key performance indicators for the dashboard."""
    try:
        return analytics.get_dashboard_kpis()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/analytics/trends")
def get_shipment_trends(
    days: int = Query(default=30, ge=1, le=365),
    analytics: AnalyticsService = Depends(get_analytics_service),
    principal: Principal = Depends(require_roles(Role.admin, Role.shipper)),
) -> dict:
    """Get shipment trends over time."""
    try:
        return analytics.get_shipment_trends(days=days)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/analytics/providers/leaderboard")
def get_provider_leaderboard(
    analytics: AnalyticsService = Depends(get_analytics_service),
    principal: Principal = Depends(require_roles(Role.admin, Role.shipper)),
) -> list[dict]:
    """Get top performing providers leaderboard."""
    try:
        return analytics.get_provider_leaderboard()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/analytics/cargo")
def get_cargo_analytics(
    analytics: AnalyticsService = Depends(get_analytics_service),
    principal: Principal = Depends(require_roles(Role.admin)),
) -> dict:
    """Get analytics by cargo type."""
    try:
        return analytics.get_cargo_analytics()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/analytics/predict-delivery")
def predict_delivery_time(
    pickup_lat: float,
    pickup_lng: float,
    delivery_lat: float,
    delivery_lng: float,
    cargo_type: str,
    analytics: AnalyticsService = Depends(get_analytics_service),
) -> dict:
    """Predict delivery time for a route."""
    try:
        return analytics.predict_delivery_time(
            pickup_lat=pickup_lat,
            pickup_lng=pickup_lng,
            delivery_lat=delivery_lat,
            delivery_lng=delivery_lng,
            cargo_type=cargo_type,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/analytics/anomalies/{shipment_id}")
def detect_anomalies(
    shipment_id: str,
    analytics: AnalyticsService = Depends(get_analytics_service),
    notifications: NotificationService = Depends(get_notification_service),
    principal: Principal = Depends(require_roles(Role.admin, Role.shipper, Role.provider)),
) -> list[dict]:
    """Detect anomalies in shipment telemetry."""
    try:
        anomalies = analytics.detect_anomalies(shipment_id)
        
        # Send notifications for critical anomalies
        for anomaly in anomalies:
            if anomaly["severity"] == "CRITICAL":
                # This would be async in production
                pass
        
        return anomalies
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/analytics/compliance-report")
def generate_compliance_report(
    start_date: str,
    end_date: str,
    analytics: AnalyticsService = Depends(get_analytics_service),
    principal: Principal = Depends(require_roles(Role.admin)),
) -> dict:
    """Generate regulatory compliance report."""
    try:
        return analytics.generate_compliance_report(start_date, end_date)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/analytics/realtime")
def get_realtime_metrics(
    analytics: AnalyticsService = Depends(get_analytics_service),
    principal: Principal = Depends(require_roles(Role.admin, Role.shipper, Role.provider)),
) -> dict:
    """Get real-time metrics for live dashboard updates."""
    try:
        kpis = analytics.get_dashboard_kpis()
        
        # Get active shipments count by status
        # This would query blockchain in production
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "kpis": kpis,
            "active_shipments": kpis.get("active_shipments", 0),
            "temperature_alerts": 0,  # Would query from telemetry service
            "route_deviations": 0,
            "pending_ai_selections": kpis.get("pending_ai_selections", 0),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/analytics/heatmap")
def get_heatmap_data(
    analytics: AnalyticsService = Depends(get_analytics_service),
    principal: Principal = Depends(require_roles(Role.admin)),
) -> list[dict]:
    """Get heatmap data for logistics density visualization."""
    try:
        # Generate heatmap data from shipment locations
        # In production, this would aggregate real data
        return [
            {"lat": 12.9716, "lng": 77.5946, "intensity": 0.8},  # Bangalore center
            {"lat": 12.9352, "lng": 77.6245, "intensity": 0.6},
            {"lat": 12.9279, "lng": 77.6271, "intensity": 0.7},
            {"lat": 12.9988, "lng": 77.5513, "intensity": 0.5},
            {"lat": 12.9898, "lng": 77.5910, "intensity": 0.9},
        ]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
