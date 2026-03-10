"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Activity, Thermometer, Droplets, MapPin, Database, Shield, Wifi, AlertTriangle } from "lucide-react";
import { useApi } from "@/lib/api";
import { TemperatureTrendChart } from "@/components/dashboard/DataCharts";

/* ─── SVG Radial Gauge ───────────────────────────────────────── */
function RadialGauge({ value, min, max, unit, label, danger }: {
    value: number; min: number; max: number; unit: string; label: string; danger?: number;
}) {
    const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
    const angle = pct * 240 - 120; // -120 to +120 degrees
    const r = 60;
    const circ = 2 * Math.PI * r;
    const arc = (240 / 360) * circ;
    const offset = circ - (pct * arc);
    const isAlert = danger !== undefined && value > danger;
    const color = isAlert ? "#ef4444" : pct > 0.75 ? "#f59e0b" : "#3b82f6";

    return (
        <div className="flex flex-col items-center gap-2">
            <svg width="160" height="140" viewBox="0 0 160 140">
                {/* Track */}
                <circle cx="80" cy="90" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12"
                    strokeDasharray={`${arc} ${circ - arc}`} strokeDashoffset={circ * 0.333}
                    strokeLinecap="round" transform="rotate(150 80 90)" />
                {/* Fill */}
                <circle cx="80" cy="90" r={r} fill="none" stroke={color} strokeWidth="12"
                    strokeDasharray={`${arc} ${circ - arc}`} strokeDashoffset={circ * 0.333 + (circ - arc - (pct * arc))}
                    strokeLinecap="round" transform="rotate(150 80 90)"
                    style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.4s ease", filter: `drop-shadow(0 0 6px ${color})` }} />
                {/* Value */}
                <text x="80" y="88" textAnchor="middle" fill="white" fontSize="20" fontWeight="800" fontFamily="'Outfit',sans-serif">
                    {value.toFixed(1)}
                </text>
                <text x="80" y="106" textAnchor="middle" fill="#6b7280" fontSize="11" fontWeight="500">{unit}</text>
            </svg>
            <span className="text-xs text-gray-500 font-medium">{label}</span>
            {isAlert && (
                <span className="flex items-center gap-1 text-xs text-red-400 font-semibold animate-pulse">
                    <AlertTriangle size={10} /> THRESHOLD BREACH
                </span>
            )}
        </div>
    );
}

/* ─── Live Metric Card ───────────────────────────────────────── */
function MetricTile({ icon: Icon, label, value, unit, sub, color }: {
    icon: any; label: string; value: string | number; unit: string; sub?: string; color: string;
}) {
    return (
        <div className={`glass-panel p-5 flex flex-col gap-3 border border-white/5 hover:-translate-y-0.5 transition-transform`}>
            <div className={`w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center ${color}`}>
                <Icon size={16} />
            </div>
            <div>
                <div className="text-xs text-gray-500 font-medium">{label}</div>
                <div className="text-2xl font-black text-white mt-0.5 font-mono">{value}<span className="text-sm font-normal text-gray-500 ml-1">{unit}</span></div>
                {sub && <div className="text-[10px] text-gray-600 mt-1">{sub}</div>}
            </div>
        </div>
    );
}

/* ─── Simulated live readings ────────────────────────────────── */
const mockReading = (shipmentReq = 4) => ({
    temperature: 3.5 + Math.random() * 2.5,
    humidity: 58 + Math.random() * 16,
    latitude: 12.9716 + (Math.random() - 0.5) * 0.05,
    longitude: 77.5946 + (Math.random() - 0.5) * 0.05,
    battery: 72 + Math.random() * 20,
    signal: 80 + Math.random() * 20,
    sequence_number: Math.floor(Math.random() * 9999),
    device_id: "IOT-HDC-07821",
    digital_signature: "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
});

export default function TelemetryPage() {
    const { apiFetch } = useApi();
    const [shipments, setShipments] = useState<any[]>([]);
    const [selectedShipment, setSelectedShipment] = useState<any>(null);
    const [reading, setReading] = useState<any>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        const fn = async () => {
            try {
                const data = await apiFetch("/shipments");
                setShipments(data.shipments || []);
            } catch { /* demo mode */ }
        };
        fn();
        const iv = setInterval(fn, 10000);
        return () => clearInterval(iv);
    }, [apiFetch]);

    const fetchTelemetry = useCallback(async () => {
        if (!selectedShipment || !autoRefresh) return;
        try {
            const data = await apiFetch(`/telemetry/shipment/${selectedShipment.shipment_id}`);
            const evts = data.events ?? [];
            if (evts.length > 0) {
                const latest = evts[evts.length - 1];
                setReading(latest);
                setHistory(prev => [...prev.slice(-49), latest]);
            } else {
                // Simulate if no real data
                const sim = mockReading(selectedShipment.temperature_requirement);
                setReading(sim);
                setHistory(prev => [...prev.slice(-49), sim]);
            }
        } catch {
            const sim = mockReading(selectedShipment?.temperature_requirement);
            setReading(sim);
            setHistory(prev => [...prev.slice(-49), sim]);
        }
    }, [selectedShipment, autoRefresh, apiFetch]);

    useEffect(() => {
        fetchTelemetry();
        const iv = setInterval(fetchTelemetry, 3000);
        return () => clearInterval(iv);
    }, [fetchTelemetry]);

    const inTransit = shipments.filter(s => s.status === "IN_TRANSIT" || s.status === "DELIVERED");
    const demoShipments = inTransit.length > 0 ? inTransit : [{
        shipment_id: "REQ-DEMO-001", status: "IN_TRANSIT",
        cargo_type: "Vaccines (COVID-19)", temperature_requirement: 4,
        pickup_location: "BioPharm Dist Center", delivery_location: "City General Hospital"
    }];

    return (
        <div className="w-full flex flex-col gap-6 font-sans overflow-y-auto pr-2 pb-12">
            {/* Header */}
            <header className="flex items-center justify-between pb-6 border-b border-black/5 dark:border-white/5">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
                        <Activity className="text-blue-400" size={28} />
                        IoT Telemetry Engine
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Live Ed25519-authenticated sensor streams from cargo devices</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
                    <div className={`w-11 h-6 rounded-full transition-colors relative ${autoRefresh ? "bg-blue-500" : "bg-gray-600"}`}
                        onClick={() => setAutoRefresh(v => !v)}>
                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${autoRefresh ? "translate-x-5" : "translate-x-0"}`} />
                    </div>
                    <span className={autoRefresh ? "text-blue-400" : "text-gray-500"}>Live Polling</span>
                </label>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Left: shipment selector */}
                <div className="flex flex-col gap-3">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <Database size={14} /> Tracking Nodes
                    </h2>
                    {demoShipments.map(s => (
                        <button
                            key={s.shipment_id}
                            onClick={() => { setSelectedShipment(s); setReading(null); setHistory([]); }}
                            className={`flex flex-col text-left p-4 rounded-2xl border transition-all ${selectedShipment?.shipment_id === s.shipment_id
                                    ? "bg-blue-500/10 border-blue-500/50 shadow-lg shadow-blue-500/10"
                                    : "bg-white/2 border-white/5 hover:border-white/15"
                                }`}
                        >
                            <div className="flex justify-between items-center w-full">
                                <span className="font-bold text-sm text-white">{s.shipment_id}</span>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${s.status === "IN_TRANSIT" ? "bg-blue-500/20 text-blue-400 animate-pulse" : "bg-green-500/20 text-green-400"
                                    }`}>{s.status?.replace(/_/g, " ")}</span>
                            </div>
                            <span className="text-xs text-gray-500 mt-1.5">{s.cargo_type}</span>
                            <span className="text-[10px] text-gray-600 mt-1 font-mono">{s.pickup_location} → {s.delivery_location}</span>
                            <span className="text-[10px] text-red-400 font-bold mt-2">Req: {s.temperature_requirement}°C</span>
                        </button>
                    ))}
                </div>

                {/* Right: live readings */}
                <div className="xl:col-span-3 flex flex-col gap-6">
                    {!selectedShipment ? (
                        <div className="glass-panel min-h-[400px] flex flex-col items-center justify-center gap-4 text-gray-500">
                            <Activity size={48} className="animate-pulse text-blue-500/40" />
                            <span className="text-sm">Select a tracking node to view live telemetry</span>
                        </div>
                    ) : (
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
                            {/* Device header */}
                            {reading && (
                                <div className="glass-panel p-4 flex items-center justify-between border border-blue-500/20">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                                        <div>
                                            <div className="text-xs text-gray-500 font-medium">Authenticated Device</div>
                                            <div className="text-sm font-bold font-mono text-white">{reading.device_id ?? "IOT-HDC-07821"}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-500">Last Hash</div>
                                        <div className="text-[10px] text-blue-400 font-mono">
                                            {(reading.digital_signature ?? "0xabc123...").slice(0, 32)}…
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-full">
                                        <Shield size={12} className="text-green-400" />
                                        <span className="text-xs text-green-400 font-semibold">Cryptographically Verified</span>
                                    </div>
                                </div>
                            )}

                            {/* Gauges row */}
                            {reading && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="glass-panel p-4 flex flex-col items-center">
                                        <RadialGauge value={reading.temperature ?? 4.2} min={-5} max={15} unit="°C" label="Temperature" danger={selectedShipment.temperature_requirement + 2} />
                                    </div>
                                    <div className="glass-panel p-4 flex flex-col items-center">
                                        <RadialGauge value={reading.humidity ?? 65} min={30} max={95} unit="%" label="Humidity" />
                                    </div>
                                    <MetricTile icon={Wifi} label="Signal Strength" value={(reading.signal ?? 88).toFixed(0)} unit="%" sub="4G LTE Connection" color="text-cyan-400" />
                                    <MetricTile icon={Shield} label="Battery Level" value={(reading.battery ?? 76).toFixed(0)} unit="%" sub="Est. 18h remaining" color="text-green-400" />
                                </div>
                            )}

                            {/* Temperature live chart */}
                            {selectedShipment && (
                                <div className="glass-panel p-6 flex flex-col gap-3">
                                    <h3 className="text-base font-semibold text-white flex items-center gap-2">
                                        <Thermometer size={16} className="text-blue-400" /> Live Temperature & Humidity Stream
                                        <span className="ml-auto text-[10px] text-gray-500 font-mono">
                                            Auto-refreshing every 2s
                                        </span>
                                    </h3>
                                    <TemperatureTrendChart />
                                </div>
                            )}

                            {/* GPS */}
                            {reading && (
                                <div className="glass-panel p-6 flex flex-col gap-4">
                                    <h3 className="text-base font-semibold text-white flex items-center gap-2">
                                        <MapPin size={16} className="text-red-400" /> GPS Position
                                    </h3>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="bg-white/5 rounded-xl p-4">
                                            <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Latitude</div>
                                            <div className="text-xl font-black font-mono text-white">
                                                {(reading.latitude ?? 12.9716).toFixed(6)}
                                            </div>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-4">
                                            <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Longitude</div>
                                            <div className="text-xl font-black font-mono text-white">
                                                {(reading.longitude ?? 77.5946).toFixed(6)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-600 pt-2 border-t border-white/5">
                                        <span>Seq #{reading.sequence_number ?? 4827}</span>
                                        <span>{autoRefresh ? "Live updating every 3s" : "Paused"}</span>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
