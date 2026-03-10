"""
Real-time Notification Service for Healthcare Logistics
Handles alerts, push notifications, and email alerts for critical events
"""

import asyncio
from datetime import UTC, datetime
from enum import Enum
from typing import Any, Callable


class NotificationPriority(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class NotificationType(Enum):
    SHIPMENT_CREATED = "shipment_created"
    BID_RECEIVED = "bid_received"
    PROVIDER_SELECTED = "provider_selected"
    PICKUP_CONFIRMED = "pickup_confirmed"
    DELIVERY_CONFIRMED = "delivery_confirmed"
    TEMPERATURE_ALERT = "temperature_alert"
    ROUTE_DEVIATION = "route_deviation"
    DELAY_WARNING = "delay_warning"
    DISPUTE_CREATED = "dispute_created"
    DISPUTE_RESOLVED = "dispute_resolved"
    PAYMENT_RELEASED = "payment_released"
    SYSTEM_ALERT = "system_alert"


class NotificationService:
    """Service for managing and dispatching notifications."""
    
    def __init__(self) -> None:
        self._subscribers: dict[str, list[Callable]] = {}
        self._notification_history: list[dict] = []
        self._user_preferences: dict[str, dict] = {}
        self._max_history = 1000
        
    def subscribe(self, event_type: str, callback: Callable) -> None:
        """Subscribe to a notification event type."""
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        self._subscribers[event_type].append(callback)
    
    def unsubscribe(self, event_type: str, callback: Callable) -> None:
        """Unsubscribe from a notification event type."""
        if event_type in self._subscribers:
            self._subscribers[event_type] = [cb for cb in self._subscribers[event_type] if cb != callback]
    
    async def notify(
        self,
        notification_type: NotificationType,
        title: str,
        message: str,
        recipients: list[str],
        priority: NotificationPriority = NotificationPriority.MEDIUM,
        data: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Send a notification to specified recipients."""
        notification = {
            "id": f"notif_{datetime.now(UTC).timestamp()}_{hash(title) % 10000}",
            "type": notification_type.value,
            "title": title,
            "message": message,
            "recipients": recipients,
            "priority": priority.value,
            "data": data or {},
            "created_at": datetime.now(UTC).isoformat(),
            "read_by": [],
        }
        
        # Store in history
        self._notification_history.append(notification)
        if len(self._notification_history) > self._max_history:
            self._notification_history = self._notification_history[-self._max_history:]
        
        # Dispatch to subscribers
        await self._dispatch(notification)
        
        return notification
    
    async def _dispatch(self, notification: dict) -> None:
        """Dispatch notification to all subscribers."""
        event_type = notification["type"]
        
        # Dispatch to type-specific subscribers
        if event_type in self._subscribers:
            for callback in self._subscribers[event_type]:
                try:
                    if asyncio.iscoroutinefunction(callback):
                        await callback(notification)
                    else:
                        callback(notification)
                except Exception as e:
                    print(f"Error dispatching notification: {e}")
        
        # Dispatch to wildcard subscribers
        if "*" in self._subscribers:
            for callback in self._subscribers["*"]:
                try:
                    if asyncio.iscoroutinefunction(callback):
                        await callback(notification)
                    else:
                        callback(notification)
                except Exception as e:
                    print(f"Error dispatching notification: {e}")
    
    def get_notifications(
        self,
        recipient: str | None = None,
        notification_type: str | None = None,
        priority: str | None = None,
        unread_only: bool = False,
        limit: int = 50,
    ) -> list[dict]:
        """Get notifications with optional filters."""
        results = self._notification_history
        
        if recipient:
            results = [n for n in results if recipient in n["recipients"]]
        
        if notification_type:
            results = [n for n in results if n["type"] == notification_type]
        
        if priority:
            results = [n for n in results if n["priority"] == priority]
        
        if unread_only and recipient:
            results = [n for n in results if recipient not in n.get("read_by", [])]
        
        return sorted(results, key=lambda x: x["created_at"], reverse=True)[:limit]
    
    def mark_as_read(self, notification_id: str, recipient: str) -> bool:
        """Mark a notification as read by a recipient."""
        for notification in self._notification_history:
            if notification["id"] == notification_id:
                if recipient not in notification["read_by"]:
                    notification["read_by"].append(recipient)
                return True
        return False
    
    def get_unread_count(self, recipient: str) -> int:
        """Get count of unread notifications for a recipient."""
        return len([
            n for n in self._notification_history
            if recipient in n["recipients"] and recipient not in n.get("read_by", [])
        ])
    
    # ============ Convenience Methods ============
    
    async def notify_shipment_created(self, shipment_id: str, creator: str, cargo_type: str) -> dict:
        """Notify when a new shipment is created."""
        return await self.notify(
            notification_type=NotificationType.SHIPMENT_CREATED,
            title="New Shipment Request",
            message=f"A new {cargo_type} shipment ({shipment_id}) has been created and is open for bidding.",
            recipients=["all_providers"],
            priority=NotificationPriority.MEDIUM,
            data={"shipment_id": shipment_id, "creator": creator, "cargo_type": cargo_type},
        )
    
    async def notify_bid_received(self, shipment_id: str, shipper: str, provider: str, price: int) -> dict:
        """Notify when a bid is received."""
        return await self.notify(
            notification_type=NotificationType.BID_RECEIVED,
            title="New Bid Received",
            message=f"Provider {provider[:10]}... has bid {price} wei on shipment {shipment_id}.",
            recipients=[shipper],
            priority=NotificationPriority.LOW,
            data={"shipment_id": shipment_id, "provider": provider, "price": price},
        )
    
    async def notify_provider_selected(self, shipment_id: str, provider: str, shipper: str) -> dict:
        """Notify when a provider is selected."""
        return await self.notify(
            notification_type=NotificationType.PROVIDER_SELECTED,
            title="Provider Selected",
            message=f"You have been selected for shipment {shipment_id}. Please proceed to pickup.",
            recipients=[provider],
            priority=NotificationPriority.HIGH,
            data={"shipment_id": shipment_id, "shipper": shipper},
        )
    
    async def notify_pickup_confirmed(self, shipment_id: str, shipper: str, provider: str) -> dict:
        """Notify when pickup is confirmed."""
        return await self.notify(
            notification_type=NotificationType.PICKUP_CONFIRMED,
            title="Shipment Picked Up",
            message=f"Shipment {shipment_id} has been picked up and is now in transit.",
            recipients=[shipper, provider],
            priority=NotificationPriority.MEDIUM,
            data={"shipment_id": shipment_id, "status": "IN_TRANSIT"},
        )
    
    async def notify_delivery_confirmed(
        self,
        shipment_id: str,
        shipper: str,
        provider: str,
        payment_amount: int,
    ) -> dict:
        """Notify when delivery is confirmed."""
        await self.notify(
            notification_type=NotificationType.DELIVERY_CONFIRMED,
            title="Delivery Completed",
            message=f"Shipment {shipment_id} has been delivered successfully.",
            recipients=[shipper],
            priority=NotificationPriority.MEDIUM,
            data={"shipment_id": shipment_id},
        )
        
        return await self.notify(
            notification_type=NotificationType.PAYMENT_RELEASED,
            title="Payment Released",
            message=f"Payment of {payment_amount} wei has been released for shipment {shipment_id}.",
            recipients=[provider],
            priority=NotificationPriority.HIGH,
            data={"shipment_id": shipment_id, "amount": payment_amount},
        )
    
    async def notify_temperature_alert(
        self,
        shipment_id: str,
        recipients: list[str],
        temperature: float,
        required_range: list[float],
        severity: str = "WARNING",
    ) -> dict:
        """Notify about temperature violations."""
        priority = NotificationPriority.CRITICAL if severity == "CRITICAL" else NotificationPriority.HIGH
        
        return await self.notify(
            notification_type=NotificationType.TEMPERATURE_ALERT,
            title=f"🌡️ Temperature Alert - {severity}",
            message=f"Shipment {shipment_id} temperature ({temperature}°C) is outside required range ({required_range[0]}-{required_range[1]}°C).",
            recipients=recipients,
            priority=priority,
            data={
                "shipment_id": shipment_id,
                "temperature": temperature,
                "required_min": required_range[0],
                "required_max": required_range[1],
                "severity": severity,
            },
        )
    
    async def notify_route_deviation(
        self,
        shipment_id: str,
        recipients: list[str],
        deviation_meters: float,
        current_location: dict,
    ) -> dict:
        """Notify about route deviation."""
        return await self.notify(
            notification_type=NotificationType.ROUTE_DEVIATION,
            title="🚨 Route Deviation Detected",
            message=f"Shipment {shipment_id} has deviated {deviation_meters:.0f}m from planned route.",
            recipients=recipients,
            priority=NotificationPriority.HIGH,
            data={
                "shipment_id": shipment_id,
                "deviation_meters": deviation_meters,
                "current_location": current_location,
            },
        )
    
    async def notify_delay_warning(
        self,
        shipment_id: str,
        recipients: list[str],
        predicted_delay_minutes: int,
        eta: str,
    ) -> dict:
        """Notify about predicted delays."""
        return await self.notify(
            notification_type=NotificationType.DELAY_WARNING,
            title="⚠️ Delivery Delay Predicted",
            message=f"Shipment {shipment_id} is predicted to be delayed by {predicted_delay_minutes} minutes.",
            recipients=recipients,
            priority=NotificationPriority.MEDIUM,
            data={
                "shipment_id": shipment_id,
                "predicted_delay_minutes": predicted_delay_minutes,
                "estimated_arrival": eta,
            },
        )
    
    async def notify_dispute_created(
        self,
        shipment_id: str,
        initiator: str,
        respondent: str,
        reason: str,
    ) -> dict:
        """Notify when a dispute is created."""
        return await self.notify(
            notification_type=NotificationType.DISPUTE_CREATED,
            title="⚖️ Dispute Filed",
            message=f"A dispute has been filed for shipment {shipment_id}. Reason: {reason}",
            recipients=[initiator, respondent, "all_arbiters"],
            priority=NotificationPriority.CRITICAL,
            data={"shipment_id": shipment_id, "initiator": initiator, "reason": reason},
        )
    
    async def notify_dispute_resolved(
        self,
        shipment_id: str,
        resolution: str,
        refund_amount: int,
        parties: list[str],
    ) -> dict:
        """Notify when a dispute is resolved."""
        return await self.notify(
            notification_type=NotificationType.DISPUTE_RESOLVED,
            title="✅ Dispute Resolved",
            message=f"Dispute for shipment {shipment_id} has been resolved: {resolution}",
            recipients=parties,
            priority=NotificationPriority.HIGH,
            data={
                "shipment_id": shipment_id,
                "resolution": resolution,
                "refund_amount": refund_amount,
            },
        )
