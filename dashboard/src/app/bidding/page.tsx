"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, CheckCircle } from "lucide-react";
import { useApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function BiddingPage() {
    const { apiFetch } = useApi();
    const { user } = useAuth();
    const [shipments, setShipments] = useState<any[]>([]);
    const [biddingShipment, setBiddingShipment] = useState<string | null>(null);
    const [bidData, setBidData] = useState({ price: 500, estimated_delivery_time: 120, vehicle_type: "Refrigerated Van" });

    const fetchShipments = async () => {
        try {
            const data = await apiFetch("/shipments");
            setShipments(data.shipments || []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchShipments();
        const interval = setInterval(fetchShipments, 5000);
        return () => clearInterval(interval);
    }, []);

    const handlePlaceBid = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!biddingShipment) return;
        try {
            await apiFetch("/bid", {
                method: "POST",
                body: JSON.stringify({
                    shipment_id: biddingShipment,
                    provider_id: user?.actor_id || "prv-001",
                    provider_address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                    price: bidData.price,
                    estimated_delivery_time: bidData.estimated_delivery_time,
                    vehicle_type: bidData.vehicle_type,
                    driver_id: user?.actor_id || "prv-001",
                    signer_private_key: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
                })
            });
            setBiddingShipment(null);
            fetchShipments();
        } catch (err) {
            console.error(err);
        }
    };

    // Shipper selects provider AI
    const handleAISelect = async (shipment_id: string) => {
        try {
            await apiFetch("/shipment/select_provider", {
                method: "POST",
                body: JSON.stringify({ shipment_id })
            });
            fetchShipments();
        } catch (err) {
            console.error(err);
        }
    };

    const openBids = shipments.filter(s => s.status === "CREATED" || s.status === "BIDDING");
    const selectedBids = shipments.filter(s => s.status === "PROVIDER_SELECTED" && s.selected_provider);

    return (
        <div className="w-full h-full flex flex-col space-y-6">
            <header className="flex flex-col gap-1 pb-4 border-b border-black/5 dark:border-white/10">
                <h1 className="text-3xl font-bold tracking-tight">Provider Bidding Portal</h1>
                <p className="text-sm text-gray-500">Live on-chain order matching platform.</p>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Open Auctions */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300">Open Freight Auctions</h2>

                    {openBids.length === 0 && <p className="text-gray-400">No open bids available right now.</p>}

                    <motion.div className="grid gap-6">
                        <AnimatePresence>
                            {openBids.map(s => (
                                <motion.div key={s.shipment_id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="glass-panel p-6 flex flex-col gap-4 relative overflow-hidden group">
                                    <div className="flex justify-between items-center pb-3 border-b border-black/5 dark:border-white/10">
                                        <h2 className="text-lg font-bold">{s.shipment_id}</h2>
                                        <span className="text-xs px-2 py-1 bg-yellow-500/10 text-yellow-500 font-medium rounded-full animate-pulse">{s.status.replace("_", " ")}</span>
                                    </div>

                                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2 relative z-10 w-full">
                                        <p><strong>Cargo:</strong> <span className="text-blue-500 font-bold">{s.cargo_type}</span></p>
                                        <p><strong>Required Temp:</strong> <span className="text-red-500 font-bold font-mono bg-red-500/10 px-1 py-0.5 rounded">{s.temperature_requirement}°C</span></p>
                                        <p><strong>From:</strong> {s.pickup_location}</p>
                                        <p><strong>To:</strong> {s.delivery_location}</p>
                                    </div>

                                    {user?.role === 'provider' && s.status !== "PROVIDER_SELECTED" && (
                                        <div className="pt-3 mt-auto relative z-10">
                                            <button onClick={() => setBiddingShipment(s.shipment_id)} className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl shadow-lg transition-transform hover:scale-[1.02] font-semibold text-sm">
                                                <DollarSign size={16} /> Submit Cryptographic Bid
                                            </button>
                                        </div>
                                    )}

                                    {user?.role === 'shipper' && (
                                        <div className="pt-3 mt-auto relative z-10">
                                            <button onClick={() => handleAISelect(s.shipment_id)} className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.4)] font-semibold text-sm transition-all">
                                                Run AI Provider Selection
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                </div>

                {/* Selected Auctions */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-green-500">
                        <CheckCircle size={24} /> AI Selected Providers
                    </h2>

                    {selectedBids.length === 0 && <p className="text-gray-400">No active network allocations.</p>}

                    <motion.div className="grid gap-6">
                        <AnimatePresence>
                            {selectedBids.map(s => (
                                <motion.div key={s.shipment_id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-6 flex flex-col gap-4 relative overflow-hidden group border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.15)] bg-green-500/[0.02]">
                                    <div className="absolute inset-0 bg-green-500/5 pointer-events-none" />
                                    <div className="flex justify-between items-center pb-3 border-b border-green-500/20">
                                        <h2 className="text-lg font-bold">{s.shipment_id}</h2>
                                        <span className="text-xs px-2 py-1 bg-green-500/20 text-green-500 font-medium rounded-full flex items-center gap-1">
                                            <CheckCircle size={12} /> AI Allocated
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2 relative z-10 w-full">
                                        <p><strong>From:</strong> {s.pickup_location}</p>
                                        <p><strong>To:</strong> {s.delivery_location}</p>
                                        <p className="flex items-center gap-1 mt-4 p-3 bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10">
                                            <CheckCircle size={16} className="text-green-500 shrink-0" />
                                            <span className="text-green-500 font-bold truncate">Assigned: {s.selected_provider}</span>
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>

            {biddingShipment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
                    <div className="bg-white dark:bg-[#111318] p-8 rounded-3xl w-full max-w-sm border border-black/5 dark:border-white/10 shadow-2xl relative">
                        <button onClick={() => setBiddingShipment(null)} className="absolute top-4 right-4 text-gray-500">X</button>
                        <h2 className="text-xl font-bold mb-6">Configure Bid Parameters</h2>
                        <form onSubmit={handlePlaceBid} className="space-y-4">
                            <label className="flex flex-col gap-1 text-sm font-semibold">
                                Price Payload (Wei)
                                <input type="number" value={bidData.price} onChange={e => setBidData({ ...bidData, price: parseInt(e.target.value) })} className="bg-black/5 dark:bg-white/5 border-none rounded-xl px-4 py-3" />
                            </label>
                            <label className="flex flex-col gap-1 text-sm font-semibold">
                                ETA (Minutes)
                                <input type="number" value={bidData.estimated_delivery_time} onChange={e => setBidData({ ...bidData, estimated_delivery_time: parseInt(e.target.value) })} className="bg-black/5 dark:bg-white/5 border-none rounded-xl px-4 py-3" />
                            </label>
                            <button type="submit" className="w-full bg-blue-500 text-white rounded-xl py-4 font-bold tracking-wide mt-4 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                                Sign & Transmit Bid
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
