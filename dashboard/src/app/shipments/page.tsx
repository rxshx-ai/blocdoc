"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Plus, X } from "lucide-react";
import { useApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function ShipmentsPage() {
    const { apiFetch } = useApi();
    const { user } = useAuth();

    const [shipments, setShipments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState("");

    // Form State
    const [formData, setFormData] = useState({
        shipment_id: `SHP-${Math.floor(1000 + Math.random() * 9000)}`,
        pickup_location: "PharmaCorp Warehouse, NY",
        delivery_location: "City General Hospital, NY",
        pickup_latitude: 40.7128,
        pickup_longitude: -74.0060,
        delivery_latitude: 40.7306,
        delivery_longitude: -73.9866,
        cargo_type: "Vaccines",
        temperature_requirement: -20,
    });

    const fetchShipments = async () => {
        setIsLoading(true);
        try {
            const data = await apiFetch("/shipments");
            setShipments(data.shipments || []);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchShipments();
        // Poll every 5s for updates
        const interval = setInterval(fetchShipments, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleCreateRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            await apiFetch("/shipment/create", {
                method: "POST",
                body: JSON.stringify({
                    ...formData,
                    sender_entity: "PHARMACEUTICAL_MANUFACTURER", // Mapping from backend EntityType
                    receiver_entity: "HOSPITAL",
                    escrow_amount_wei: 1000000000000,
                })
            });
            setIsModalOpen(false);
            // Fetch immediately after creation
            fetchShipments();
        } catch (err: any) {
            setError(err.message || "Failed to create shipment");
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0, transition: { type: "spring" as const } },
    };

    const renderShipmentCard = (s: any, dir: string) => {
        // Generate mapped progress width based on status
        const statusMap: Record<string, number> = {
            CREATED: 10,
            BIDDING: 30,
            PROVIDER_SELECTED: 50,
            IN_TRANSIT: 75,
            DELIVERED: 100,
        };
        const progress = statusMap[s.status] || 0;

        return (
            <motion.div variants={itemVariants} key={s.shipment_id} className="glass-panel p-5 flex flex-col gap-3 group">
                <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">{s.shipment_id}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${dir === 'Outbound' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                        {dir}
                    </span>
                </div>
                <div className="text-sm text-gray-500 space-y-1">
                    <p><strong className="text-gray-900 dark:text-gray-200">Cargo:</strong> {s.cargo_type}</p>
                    <p><strong className="text-gray-900 dark:text-gray-200">Status:</strong> {s.status}</p>
                    {s.selected_provider && <p><strong className="text-gray-900 dark:text-gray-200">Provider:</strong> {s.selected_provider.slice(0, 10)}...</p>}
                    <p><strong className="text-gray-900 dark:text-gray-200">Destination:</strong> {s.delivery_location}</p>
                </div>
                <div className="mt-2 w-full h-1 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden relative">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className={`h-full rounded-full transition-all duration-1000 ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                    />
                </div>
            </motion.div>
        );
    };

    // Basic mock determination of outbound vs inbound. If shipper, it's outbound. If receiver, inbound.
    // We can just filter on the frontend for simplicity of demonstration based on user role.
    const outbound = shipments.filter(s => user?.role === 'shipper' || user?.role === 'admin');
    const inbound = shipments.filter(s => user?.role === 'receiver' || user?.role === 'admin');

    return (
        <div className="w-full h-full flex flex-col space-y-6 relative">
            <header className="flex items-center justify-between pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Shipment Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Live tracking on the ledger.</p>
                </div>
                {user?.role === 'shipper' && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30 transition-all font-medium"
                    >
                        <Plus size={18} />
                        Create Request
                    </button>
                )}
            </header>

            {isLoading && shipments.length === 0 ? (
                <div className="w-full flex justify-center py-20">
                    <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
                    {user?.role !== 'receiver' && (
                        <div className="flex flex-col gap-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Package size={20} className="text-blue-500" />
                                Outbound Shipments
                            </h2>
                            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid gap-4">
                                {outbound.length === 0 ? (
                                    <p className="text-sm text-gray-500 py-4">No outbound shipments found.</p>
                                ) : outbound.map(s => renderShipmentCard(s, "Outbound"))}
                            </motion.div>
                        </div>
                    )}

                    {user?.role !== 'shipper' && (
                        <div className="flex flex-col gap-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Package size={20} className="text-green-500" />
                                Inbound Shipments
                            </h2>
                            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid gap-4">
                                {inbound.length === 0 ? (
                                    <p className="text-sm text-gray-500 py-4">No inbound shipments found.</p>
                                ) : inbound.map(s => renderShipmentCard(s, "Inbound"))}
                            </motion.div>
                        </div>
                    )}
                </div>
            )}

            {/* Create Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-[#111318] p-6 rounded-3xl shadow-2xl w-full max-w-lg relative border border-black/5 dark:border-white/10"
                        >
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
                            >
                                <X size={20} />
                            </button>

                            <h2 className="text-2xl font-bold mb-4">New Shipment Request</h2>

                            <form onSubmit={handleCreateRequest} className="space-y-4">
                                {error && <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">{error}</div>}

                                <div className="space-y-3">
                                    <label className="flex flex-col gap-1 text-sm font-semibold">
                                        Cargo Type
                                        <input
                                            type="text" required
                                            value={formData.cargo_type}
                                            onChange={e => setFormData({ ...formData, cargo_type: e.target.value })}
                                            className="bg-black/5 dark:bg-white/5 border-none rounded-xl px-4 py-2"
                                        />
                                    </label>

                                    <div className="grid grid-cols-2 gap-3">
                                        <label className="flex flex-col gap-1 text-sm font-semibold">
                                            Pickup Location
                                            <input
                                                type="text" required
                                                value={formData.pickup_location}
                                                onChange={e => setFormData({ ...formData, pickup_location: e.target.value })}
                                                className="bg-black/5 dark:bg-white/5 border-none rounded-xl px-4 py-2"
                                            />
                                        </label>
                                        <label className="flex flex-col gap-1 text-sm font-semibold">
                                            Delivery Location
                                            <input
                                                type="text" required
                                                value={formData.delivery_location}
                                                onChange={e => setFormData({ ...formData, delivery_location: e.target.value })}
                                                className="bg-black/5 dark:bg-white/5 border-none rounded-xl px-4 py-2"
                                            />
                                        </label>
                                    </div>

                                    <label className="flex flex-col gap-1 text-sm font-semibold">
                                        Temperature Req (°C)
                                        <input
                                            type="number" required
                                            value={formData.temperature_requirement}
                                            onChange={e => setFormData({ ...formData, temperature_requirement: parseInt(e.target.value) })}
                                            className="bg-black/5 dark:bg-white/5 border-none rounded-xl px-4 py-2"
                                        />
                                    </label>
                                </div>

                                <div className="pt-4">
                                    <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-3 font-semibold transition-all">
                                        Register on Blockchain
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
