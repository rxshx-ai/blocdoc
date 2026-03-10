"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Thermometer, Droplets, MapPin, Database } from "lucide-react";
import { useApi } from "@/lib/api";

export default function TelemetryPage() {
    const { apiFetch } = useApi();
    const [shipments, setShipments] = useState<any[]>([]);
    const [selectedShipment, setSelectedShipment] = useState<any>(null);
    const [telemetryEvent, setTelemetryEvent] = useState<any>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Fetch all shipments to select one
    useEffect(() => {
        const fn = async () => {
            try {
                const data = await apiFetch("/shipments");
                setShipments(data.shipments || []);
            } catch (err) {
                console.error(err);
            }
        };
        fn();
        const interval = setInterval(fn, 10000);
        return () => clearInterval(interval);
    }, [apiFetch]);

    // Fetch telemetry for selected
    useEffect(() => {
        if (!selectedShipment || !autoRefresh) return;
        const fetchTelemetry = async () => {
            try {
                const data = await apiFetch(`/telemetry/shipment/${selectedShipment.shipment_id}`);
                const evts = data.events || [];
                if (evts.length > 0) {
                    // get the latest event
                    const latest = evts[evts.length - 1];
                    setTelemetryEvent(latest);
                } else {
                    setTelemetryEvent(null);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchTelemetry();
        const interval = setInterval(fetchTelemetry, 3000);
        return () => clearInterval(interval);
    }, [selectedShipment, apiFetch, autoRefresh]);

    const inTransitShipments = shipments.filter(s => s.status === "IN_TRANSIT" || s.status === "DELIVERED");

    return (
        <div className="w-full h-full flex flex-col items-center space-y-6">
            <header className="flex w-full items-center justify-between pb-4 border-b border-black/5 dark:border-white/10">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">IoT Telemetry Engine</h1>
                    <p className="text-sm text-gray-500 mt-1">Live digital signature authenticated sensor streams.</p>
                </div>
                <div className="flex gap-4 items-center">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
                        <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} className="peer sr-only " />
                        <div className={`w-10 h-6 rounded-full transition-colors relative ${autoRefresh ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-700'}`}>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${autoRefresh ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                        Live Polling
                    </label>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 w-full">
                {/* Selector */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Database size={20} /> Active Tracking Nodes
                    </h2>
                    <div className="flex flex-col gap-3">
                        {inTransitShipments.length === 0 && <p className="text-gray-500 text-sm">No shipments are currently IN_TRANSIT.</p>}
                        {inTransitShipments.map(s => (
                            <button
                                key={s.shipment_id}
                                onClick={() => { setSelectedShipment(s); setTelemetryEvent(null); }}
                                className={`flex flex-col text-left p-4 rounded-xl border transition-all ${selectedShipment?.shipment_id === s.shipment_id
                                        ? 'bg-blue-500/10 border-blue-500 shadow-md transform scale-[1.02]'
                                        : 'bg-black/5 dark:bg-white/5 border-transparent hover:border-black/10 dark:hover:border-white/10'
                                    }`}
                            >
                                <div className="flex justify-between items-center w-full">
                                    <span className="font-bold text-lg">{s.shipment_id}</span>
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-500">{s.status.replace("_", " ")}</span>
                                </div>
                                <span className="text-sm font-semibold text-gray-500 mt-2">{s.cargo_type}</span>
                                <span className="text-xs text-gray-400 mt-1 font-mono">{s.pickup_location} → {s.delivery_location}</span>
                                <span className="text-xs mt-2 text-red-500 font-bold tracking-widest bg-red-500/10 w-fit px-1.5 rounded uppercase">Req: {s.temperature_requirement}°C</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Dashboard */}
                <div className="xl:col-span-2 flex flex-col gap-6 w-full">
                    {!selectedShipment ? (
                        <div className="w-full flex-1 min-h-[400px] glass-panel flex flex-col items-center justify-center gap-4 text-gray-400">
                            <Activity size={48} className="animate-pulse" />
                            Select an active shipment to view cryptographically verified IoT Telemetry.
                        </div>
                    ) : !telemetryEvent ? (
                        <div className="w-full flex-1 min-h-[400px] glass-panel flex flex-col items-center justify-center gap-4 text-yellow-500 border border-yellow-500/30">
                            <Activity size={48} />
                            Waiting for first telemetry pulse from Ed25519 authenticated device...
                        </div>
                    ) : (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full flex flex-col gap-6">
                            <div className="glass-panel p-6 flex items-center justify-between border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                                <div className="flex flex-col">
                                    <span className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-1">Authenticated Device</span>
                                    <span className="text-xl font-bold font-mono">{telemetryEvent.device_id}</span>
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-1">Last Sync Hash</span>
                                    <span className="text-[10px] sm:text-xs text-blue-500 font-mono break-all w-[150px] sm:w-[250px]">{telemetryEvent.digital_signature.slice(0, 48)}...</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                                <div className={`glass-panel p-8 flex flex-col items-center justify-center gap-4 border transition-colors ${telemetryEvent.temperature > selectedShipment.temperature_requirement + 2 ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'border-black/5 dark:border-white/10'}`}>
                                    <Thermometer size={48} className={telemetryEvent.temperature > selectedShipment.temperature_requirement + 2 ? 'text-red-500 animate-bounce' : 'text-blue-500'} />
                                    <div className="text-center">
                                        <h3 className="text-4xl font-extrabold tabular-nums tracking-tighter">
                                            {telemetryEvent.temperature.toFixed(1)}<span className="text-gray-400 text-2xl">°C</span>
                                        </h3>
                                        <p className="text-sm font-semibold mt-2 uppercase tracking-widest text-gray-400">Cargo Temp</p>
                                    </div>
                                </div>

                                <div className="glass-panel p-8 flex flex-col items-center justify-center gap-4">
                                    <Droplets size={48} className="text-cyan-500" />
                                    <div className="text-center">
                                        <h3 className="text-4xl font-extrabold tabular-nums tracking-tighter">
                                            {telemetryEvent.humidity.toFixed(1)}<span className="text-gray-400 text-2xl">%</span>
                                        </h3>
                                        <p className="text-sm font-semibold mt-2 uppercase tracking-widest text-gray-400">Humidity</p>
                                    </div>
                                </div>

                                <div className="glass-panel p-6 flex flex-col items-center justify-center sm:col-span-2">
                                    <MapPin size={32} className="text-red-500 mb-4" />
                                    <div className="grid grid-cols-2 gap-8 w-full text-center divide-x divide-gray-200 dark:divide-gray-800">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-semibold uppercase tracking-widest text-gray-400">LATITUDE</span>
                                            <span className="text-2xl font-bold font-mono text-gray-800 dark:text-gray-200">{telemetryEvent.latitude.toFixed(6)}</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-semibold uppercase tracking-widest text-gray-400">LONGITUDE</span>
                                            <span className="text-2xl font-bold font-mono text-gray-800 dark:text-gray-200">{telemetryEvent.longitude.toFixed(6)}</span>
                                        </div>
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/5 w-full flex justify-between items-center text-xs text-gray-500">
                                        <span>Sequence: #{telemetryEvent.sequence_number}</span>
                                        <span>Sync: {new Date(telemetryEvent.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
