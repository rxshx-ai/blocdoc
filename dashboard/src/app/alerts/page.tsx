"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    AlertTriangle, Thermometer, MapPin, Clock, CheckCircle2,
    XCircle, Bell, Filter, RefreshCw, ChevronRight
} from "lucide-react";

type Severity = "critical" | "warning" | "info";

interface Alert {
    id: string;
    severity: Severity;
    type: string;
    shipmentId: string;
    message: string;
    detail: string;
    time: string;
    acknowledged: boolean;
    icon: "temp" | "location" | "time" | "system";
}

const seedAlerts: Alert[] = [
    {
        id: "ALT-001", severity: "critical", type: "Temperature Breach", shipmentId: "REQ-2001",
        message: "Temperature exceeded safe threshold at 8.9°C", detail: "Cargo: COVID Vaccines | Duration: 4m 17s | Driver notified",
        time: "2 min ago", acknowledged: false, icon: "temp"
    },
    {
        id: "ALT-002", severity: "critical", type: "Route Deviation", shipmentId: "REQ-2003",
        message: "Vehicle deviated 3.2 km from approved route", detail: "Driver: Amit Sharma | Current speed: 72 km/h | Geofence breached",
        time: "7 min ago", acknowledged: false, icon: "location"
    },
    {
        id: "ALT-003", severity: "warning", type: "Delivery Delay Predicted", shipmentId: "REQ-2005",
        message: "AI predicts 47 min delay due to traffic on NH-48", detail: "ETA revised: 3:45 PM → 4:32 PM | Hospital notified automatically",
        time: "12 min ago", acknowledged: false, icon: "time"
    },
    {
        id: "ALT-004", severity: "warning", type: "Temperature Warning", shipmentId: "REQ-2007",
        message: "Temperature approaching upper limit at 7.6°C", detail: "Cargo: Blood Samples | Trend: Rising 0.3°C per 10 min",
        time: "18 min ago", acknowledged: true, icon: "temp"
    },
    {
        id: "ALT-005", severity: "info", type: "Pickup Confirmed", shipmentId: "REQ-2009",
        message: "Shipment picked up and blockchain event logged", detail: "Block #1,847,293 | Hash: 0xa4f8c3d2... | Driver: Priya K.",
        time: "25 min ago", acknowledged: true, icon: "system"
    },
    {
        id: "ALT-006", severity: "info", type: "Smart Contract Executed", shipmentId: "REQ-1998",
        message: "Payment of ₹28,500 auto-settled to MediFleet", detail: "Block #1,847,290 | Delivery confirmed by 2 parties",
        time: "1 hr ago", acknowledged: true, icon: "system"
    },
    {
        id: "ALT-007", severity: "warning", type: "Tamper Seal Alert", shipmentId: "REQ-2004",
        message: "Tamper seal status uncertain — sensor battery low", detail: "Device: IOT-07821 | Battery: 4% | Last valid reading: 28 min ago",
        time: "33 min ago", acknowledged: false, icon: "system"
    },
    {
        id: "ALT-008", severity: "critical", type: "SLA Breach", shipmentId: "REQ-2000",
        message: "Delivery SLA window expired — 2h 14m overdue", detail: "Hospital: Eastern Medical Center | Admin escalation triggered",
        time: "2 hr ago", acknowledged: false, icon: "time"
    },
];

const severityConfig: Record<Severity, { bg: string; text: string; border: string; dot: string; label: string }> = {
    critical: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30", dot: "bg-red-500", label: "Critical" },
    warning: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/30", dot: "bg-yellow-500", label: "Warning" },
    info: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30", dot: "bg-blue-400", label: "Info" },
};

const iconMap: Record<string, typeof Thermometer> = {
    temp: Thermometer,
    location: MapPin,
    time: Clock,
    system: Bell,
};

export default function AlertsPage() {
    const [alerts, setAlerts] = useState<Alert[]>(seedAlerts);
    const [filter, setFilter] = useState<"all" | Severity>("all");

    const acknowledge = (id: string) => {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
    };

    const dismiss = (id: string) => {
        setAlerts(prev => prev.filter(a => a.id !== id));
    };

    const filtered = filter === "all" ? alerts : alerts.filter(a => a.severity === filter);
    const unread = alerts.filter(a => !a.acknowledged).length;
    const critCount = alerts.filter(a => a.severity === "critical" && !a.acknowledged).length;
    const warnCount = alerts.filter(a => a.severity === "warning" && !a.acknowledged).length;

    return (
        <div className="w-full flex flex-col gap-6 font-sans overflow-y-auto pr-2 pb-12">
            {/* Header */}
            <header className="flex items-start justify-between pb-6 border-b border-black/5 dark:border-white/5">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
                        <Bell className="text-red-400" size={28} />
                        Alert Center
                        {unread > 0 && (
                            <span className="text-sm font-bold text-white bg-red-500 px-2.5 py-0.5 rounded-full animate-bounce">
                                {unread}
                            </span>
                        )}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Real-time IoT and logistics anomaly alerts</p>
                </div>
                <button
                    onClick={() => setAlerts(seedAlerts)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                >
                    <RefreshCw size={12} /> Refresh
                </button>
            </header>

            {/* Summary strip */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Critical", count: critCount, severity: "critical" as Severity, icon: XCircle },
                    { label: "Warning", count: warnCount, severity: "warning" as Severity, icon: AlertTriangle },
                    { label: "Info", count: alerts.filter(a => a.severity === "info" && !a.acknowledged).length, severity: "info" as Severity, icon: Bell },
                ].map(({ label, count, severity, icon: Icon }) => {
                    const cfg = severityConfig[severity];
                    return (
                        <button
                            key={label}
                            onClick={() => setFilter(filter === severity ? "all" : severity)}
                            className={`glass-panel p-4 flex items-center gap-3 transition-all hover:-translate-y-0.5 ${filter === severity ? `${cfg.border} ring-1 ring-inset ${cfg.border}` : ""}`}
                        >
                            <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center`}>
                                <Icon size={18} className={cfg.text} />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-white">{count}</div>
                                <div className="text-xs text-gray-500">{label} Unread</div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Filter bar */}
            <div className="flex items-center gap-2">
                <Filter size={13} className="text-gray-500" />
                <span className="text-xs text-gray-500 mr-1">Filter:</span>
                {(["all", "critical", "warning", "info"] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all capitalize ${filter === f
                                ? "bg-blue-500 text-white"
                                : "bg-white/5 text-gray-400 hover:bg-white/10"
                            }`}
                    >
                        {f}
                    </button>
                ))}
                <span className="ml-auto text-xs text-gray-600">{filtered.length} alerts shown</span>
            </div>

            {/* Alert list */}
            <AnimatePresence mode="popLayout">
                {filtered.map((alert, i) => {
                    const cfg = severityConfig[alert.severity];
                    const Icon = iconMap[alert.icon];
                    return (
                        <motion.div
                            key={alert.id}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: alert.acknowledged ? 0.55 : 1, x: 0 }}
                            exit={{ opacity: 0, x: 20, height: 0 }}
                            transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 28 }}
                            className={`glass-panel p-5 flex items-start gap-4 border ${cfg.border} ${!alert.acknowledged ? cfg.bg : "opacity-60"
                                } relative overflow-hidden`}
                        >
                            {/* Severity indicator stripe */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.dot}`} style={{ borderRadius: "4px 0 0 4px" }} />
                            {!alert.acknowledged && alert.severity === "critical" && (
                                <div className="absolute inset-0 pointer-events-none"
                                    style={{ background: "radial-gradient(ellipse at left center, rgba(239,68,68,0.04) 0%, transparent 60%)" }} />
                            )}

                            <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                                <Icon size={18} className={cfg.text} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                                            {cfg.label}
                                        </span>
                                        <span className="text-xs font-semibold text-gray-300">{alert.type}</span>
                                        <span className="text-[10px] font-mono text-gray-500">{alert.shipmentId}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-600 shrink-0">{alert.time}</span>
                                </div>
                                <p className="text-sm font-medium text-white mb-1">{alert.message}</p>
                                <p className="text-xs text-gray-500">{alert.detail}</p>
                            </div>

                            <div className="flex flex-col gap-2 shrink-0">
                                {!alert.acknowledged ? (
                                    <button
                                        onClick={() => acknowledge(alert.id)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-xs font-semibold hover:bg-green-500/30 transition-all"
                                    >
                                        <CheckCircle2 size={12} /> Acknowledge
                                    </button>
                                ) : (
                                    <span className="flex items-center gap-1.5 text-xs text-green-500 font-medium">
                                        <CheckCircle2 size={12} /> Acknowledged
                                    </span>
                                )}
                                <button
                                    onClick={() => dismiss(alert.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-gray-500 text-xs hover:bg-red-500/10 hover:text-red-400 transition-all"
                                >
                                    <XCircle size={12} /> Dismiss
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>

            {filtered.length === 0 && (
                <div className="glass-panel p-12 flex flex-col items-center gap-3 text-center">
                    <CheckCircle2 size={40} className="text-green-500" />
                    <h3 className="text-lg font-semibold text-white">All Clear</h3>
                    <p className="text-sm text-gray-500">No {filter !== "all" ? filter : ""} alerts at this time.</p>
                </div>
            )}
        </div>
    );
}
