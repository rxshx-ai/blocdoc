"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Package,
  Thermometer,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  Info,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface Notification {
  id: string;
  type: "info" | "warning" | "critical" | "success";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

// Generate mock notifications
const generateMockNotifications = (): Notification[] => [
  {
    id: "1",
    type: "critical",
    title: "Temperature Alert",
    message: "Shipment TX-VAX-001 temperature exceeded threshold (9.2°C)",
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    read: false,
    data: { shipmentId: "TX-VAX-001", temp: 9.2 },
  },
  {
    id: "2",
    type: "success",
    title: "Delivery Completed",
    message: "Shipment TX-BLD-002 delivered successfully at City Hospital",
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    read: false,
    data: { shipmentId: "TX-BLD-002" },
  },
  {
    id: "3",
    type: "warning",
    title: "Route Deviation",
    message: "Vehicle transporting TX-MED-003 deviated from planned route",
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    read: true,
    data: { shipmentId: "TX-MED-003", deviation: 150 },
  },
  {
    id: "4",
    type: "info",
    title: "New Bid Received",
    message: "MediFleet placed a bid on shipment TX-VAX-004",
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    read: true,
  },
  {
    id: "5",
    type: "success",
    title: "Provider Selected",
    message: "AI selected RapidMed for shipment TX-VAX-005",
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    read: true,
    data: { shipmentId: "TX-VAX-005", provider: "RapidMed" },
  },
];

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>(generateMockNotifications());
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "unread" | "critical">("all");

  const unreadCount = notifications.filter((n) => !n.read).length;
  const criticalCount = notifications.filter((n) => n.type === "critical" && !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (selectedFilter === "unread") return !n.read;
    if (selectedFilter === "critical") return n.type === "critical";
    return true;
  });

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case "warning":
        return <TrendingUp className="w-5 h-5 text-amber-500" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = (type: string, read: boolean) => {
    if (read) return "bg-gray-50 dark:bg-gray-800/50";
    switch (type) {
      case "critical":
        return "bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500";
      case "warning":
        return "bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500";
      case "success":
        return "bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500";
      default:
        return "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500";
    }
  };

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  // Simulate new notifications
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const newNotification: Notification = {
          id: Date.now().toString(),
          type: Math.random() > 0.8 ? "critical" : "info",
          title: "New Update",
          message: "System update notification",
          timestamp: new Date(),
          read: false,
        };
        setNotifications((prev) => [newNotification, ...prev].slice(0, 20));
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
          >
            {unreadCount}
          </motion.span>
        )}
        {criticalCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -bottom-1 -right-1 w-2 h-2 bg-red-600 rounded-full animate-ping"
          />
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-96 glass-panel z-50 max-h-[500px] overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Notifications</h3>
                  <p className="text-xs text-gray-500">{unreadCount} unread</p>
                </div>
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-500 hover:text-blue-600 font-medium"
                >
                  Mark all read
                </button>
              </div>

              {/* Filters */}
              <div className="flex gap-2 p-2 border-b border-gray-200 dark:border-gray-700">
                {(["all", "unread", "critical"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                      selectedFilter === filter
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>

              {/* Notification List */}
              <div className="overflow-y-auto max-h-[350px]">
                {filteredNotifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  filteredNotifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${getBgColor(
                        notification.type,
                        notification.read
                      )}`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{getIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-sm truncate">{notification.title}</h4>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                dismissNotification(notification.id);
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-400">
                              {formatTime(notification.timestamp)}
                            </span>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
                <button className="text-sm text-blue-500 hover:text-blue-600 font-medium">
                  View all notifications
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Toast notification component
export function ToastNotification({
  notification,
  onDismiss,
}: {
  notification: Notification;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const getColors = (type: string) => {
    switch (type) {
      case "critical":
        return "bg-red-500";
      case "warning":
        return "bg-amber-500";
      case "success":
        return "bg-green-500";
      default:
        return "bg-blue-500";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      className={`fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white ${getColors(
        notification.type
      )}`}
    >
      <div className="flex items-start gap-3">
        {getIcon(notification.type)}
        <div>
          <h4 className="font-semibold">{notification.title}</h4>
          <p className="text-sm opacity-90">{notification.message}</p>
        </div>
        <button onClick={onDismiss} className="text-white/70 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className={`h-1 bg-white/30 mt-3 rounded-full overflow-hidden`}>
        <motion.div
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: 5, ease: "linear" }}
          className="h-full bg-white"
        />
      </div>
    </motion.div>
  );
}
