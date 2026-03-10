"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation, MapPin, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/lib/api";

export default function ProviderPage() {
    const { user } = useAuth();
    const { apiFetch } = useApi();
    const [shipments, setShipments] = useState<any[]>([]);

    // Simulator states
    const [simMode, setSimMode] = useState<"far" | "exact">("exact");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchShipments = async () => {
        try {
            const data = await apiFetch("/shipments");
            const assigned = data.shipments?.filter((s: any) => s.assigned_driver_id === user?.actor_id) || [];
            setShipments(assigned);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchShipments();
        const interval = setInterval(fetchShipments, 5000);
        return () => clearInterval(interval);
    }, [apiFetch, user]);

    const handleArrival = async (shipment_id: string, stage: "pickup" | "delivery") => {
        setError("");
        setSuccess("");
        try {
            const endpoint = stage === "pickup" ? "/shipment/arrived_pickup" : "/shipment/arrived_delivery";

            // Actual static targets defined in our demo
            const targetLat = stage === "pickup" ? 40.7128 : 40.7306;
            const targetLng = stage === "pickup" ? -74.0060 : -73.9866;

            // Offset by ~0.005 degrees if "far", which is ~500 meters. 
            // If "exact", it matches precisely.
            const fakeLat = simMode === "exact" ? targetLat : targetLat + 0.005;
            const fakeLng = simMode === "exact" ? targetLng : targetLng + 0.005;

            await apiFetch(endpoint, {
                method: "POST",
                body: JSON.stringify({
                    driver_id: user?.actor_id,
                    shipment_id,
                    driver_latitude: fakeLat,
                    driver_longitude: fakeLng
                })
            });
            setSuccess(`Proximity verified! Within 15m radius. ${stage === 'pickup' ? 'Pickup' : 'Delivery'} QR unlocked.`);
            fetchShipments();
        } catch (err: any) {
            setError(err.message || "GPS Validation Failed: Driver outside 15m geofence.");
        }
    };

    const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const } } };

    if (shipments.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-gray-500">
                <MapPin size={48} className="text-gray-300 dark:text-gray-700" />
                No active assignments. Start bidding to acquire shipments.
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col space-y-6">
            <header className="flex items-center justify-between pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Active Assignment</h1>
                    <p className="text-sm text-gray-500 mt-1">Driver navigation portal.</p>
                </div>
            </header>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl flex items-center gap-3 w-full shadow-sm font-medium">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-500 px-4 py-3 rounded-xl flex items-center gap-3 w-full shadow-sm font-medium">
                    <CheckCircle2 size={20} />
                    {success}
                </div>
            )}

            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
                <AnimatePresence>
                    {shipments.map((s: any) => {
                        const navUrl = `https://www.google.com/maps/dir/?api=1&origin=Current+Location&destination=${encodeURIComponent(s.delivery_location)}`;

                        return (
                            <motion.div variants={itemVariants} key={s.shipment_id} className="glass-panel p-6 flex flex-col gap-6 relative overflow-hidden h-fit w-full lg:col-span-2 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                                <div className="flex justify-between items-center pb-4 border-b border-black/5 dark:border-white/10 relative z-10 w-full">
                                    <h2 className="text-xl font-extrabold">{s.shipment_id}</h2>
                                    <span className="text-sm px-3 py-1 bg-blue-500/10 text-blue-500 font-bold rounded-full">{s.status.replace("_", " ")}</span>
                                </div>

                                <div className="flex flex-col gap-4 text-sm text-gray-600 dark:text-gray-300 z-10 w-full relative">
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                            <MapPin size={16} className="text-blue-500" /> Pickup Location
                                        </p>
                                        <p className="mt-1 font-mono text-gray-500">{s.pickup_location}</p>
                                    </div>

                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                            <MapPin size={16} className="text-green-500" /> Delivery Location
                                        </p>
                                        <p className="mt-1 font-mono text-gray-500">{s.delivery_location}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col xl:flex-row gap-6 relative z-10 border-t border-black/5 dark:border-white/10 pt-4">
                                    <div className="flex flex-col gap-3 text-sm flex-1">
                                        <p><strong>Cargo Type:</strong> {s.cargo_type}</p>
                                        <p className="text-red-500 font-semibold mt-2 border border-red-500/20 bg-red-500/10 p-2 rounded-lg inline-block w-fit uppercase text-xs tracking-widest">
                                            REQUIRED: {s.temperature_requirement}°C Strict Cold Chain
                                        </p>
                                    </div>

                                    {/* SIMULATOR WIDGET */}
                                    <div className="flex-1 flex flex-col justify-center bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10 p-4 shadow-inner">
                                        <div className="flex items-center gap-2 mb-3">
                                            <MapPin size={18} className="text-blue-500" />
                                            <div>
                                                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">GPS Proximity Simulator</h3>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Test 15m Geofence rules</p>
                                            </div>
                                        </div>
                                        <div className="flex bg-black/10 dark:bg-white/10 rounded-lg p-1 w-full relative z-20">
                                            <button
                                                onClick={() => setSimMode("far")}
                                                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${simMode === 'far' ? 'bg-red-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                                            >
                                                500m Away
                                            </button>
                                            <button
                                                onClick={() => setSimMode("exact")}
                                                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${simMode === 'exact' ? 'bg-green-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                                            >
                                                At Target (15m)
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="z-10 w-full flex flex-col md:flex-row gap-4 mt-auto pt-4 relative">
                                    <a
                                        href={navUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-3 px-4 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-transform hover:scale-[1.02] active:scale-95"
                                    >
                                        <Navigation size={18} /> GPS Navigation
                                    </a>

                                    {s.status === "PROVIDER_SELECTED" && (
                                        <button
                                            onClick={() => handleArrival(s.shipment_id, "pickup")}
                                            className="flex-1 flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-4 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-transform hover:scale-[1.02] active:scale-95"
                                        >
                                            Submit Arrival (Pickup)
                                        </button>
                                    )}
                                    {s.status === "IN_TRANSIT" && (
                                        <button
                                            onClick={() => handleArrival(s.shipment_id, "delivery")}
                                            className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-transform hover:scale-[1.02] active:scale-95"
                                        >
                                            Submit Arrival (Delivery)
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
