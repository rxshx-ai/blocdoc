"""
Notifications API Routes for Real-time Alerts
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional

from app.dependencies import get_notification_service
from app.services.notification_service import (
    NotificationService,
    NotificationType,
    NotificationPriority,
)
from app.security.rbac import Principal, Role, require_roles

router = APIRouter(tags=["notifications"])


@router.get("/notifications")
def get_notifications(
    notification_type: Optional[str] = None,
    priority: Optional[str] = None,
    unread_only: bool = False,
    limit: int = 50,
    service: NotificationService = Depends(get_notification_service),
    principal: Principal = Depends(require_roles(Role.admin, Role.shipper, Role.provider)),
) -> List[dict]:
    """Get notifications for the current user."""
    try:
        return service.get_notifications(
            recipient=principal.actor_id or principal.username,
            notification_type=notification_type,
            priority=priority,
            unread_only=unread_only,
            limit=limit,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/notifications/unread-count")
def get_unread_count(
    service: NotificationService = Depends(get_notification_service),
    principal: Principal = Depends(require_roles(Role.admin, Role.shipper, Role.provider)),
) -> dict:
    """Get count of unread notifications."""
    try:
        count = service.get_unread_count(principal.actor_id or principal.username)
        return {"unread_count": count}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/notifications/{notification_id}/read")
def mark_as_read(
    notification_id: str,
    service: NotificationService = Depends(get_notification_service),
    principal: Principal = Depends(require_roles(Role.admin, Role.shipper, Role.provider)),
) -> dict:
    """Mark a notification as read."""
    try:
        success = service.mark_as_read(
            notification_id=notification_id,
            recipient=principal.actor_id or principal.username,
        )
        if not success:
            raise HTTPException(status_code=404, detail="Notification not found")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/notifications/mark-all-read")
def mark_all_as_read(
    service: NotificationService = Depends(get_notification_service),
    principal: Principal = Depends(require_roles(Role.admin, Role.shipper, Role.provider)),
) -> dict:
    """Mark all notifications as read for the current user."""
    try:
        notifications = service.get_notifications(
            recipient=principal.actor_id or principal.username,
            unread_only=True,
            limit=1000,
        )
        for notification in notifications:
            service.mark_as_read(
                notification_id=notification["id"],
                recipient=principal.actor_id or principal.username,
            )
        return {"success": True, "marked_count": len(notifications)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/notifications/subscribe")
def subscribe_to_notifications(
    event_types: List[str],
    service: NotificationService = Depends(get_notification_service),
    principal: Principal = Depends(require_roles(Role.admin, Role.shipper, Role.provider)),
) -> dict:
    """Subscribe to specific notification event types."""
    # In production, this would set up WebSocket connections
    return {
        "success": True,
        "subscribed_events": event_types,
        "connection_type": "websocket",
        "endpoint": "/ws/notifications",
    }


# Admin endpoints for testing/development
@router.post("/notifications/test")
def create_test_notification(
    title: str,
    message: str,
    notification_type: str = "info",
    priority: str = "medium",
    service: NotificationService = Depends(get_notification_service),
    principal: Principal = Depends(require_roles(Role.admin)),
) -> dict:
    """Create a test notification (admin only)."""
    import asyncio
    
    try:
        notification_type_enum = NotificationType(notification_type)
        priority_enum = NotificationPriority(priority)
        
        # Run async function
        loop = asyncio.get_event_loop()
        notification = loop.run_until_complete(
            service.notify(
                notification_type=notification_type_enum,
                title=title,
                message=message,
                recipients=[principal.actor_id or principal.username],
                priority=priority_enum,
                data={"test": True, "created_by": principal.username},
            )
        )
        return notification
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
