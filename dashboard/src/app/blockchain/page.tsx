"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link2, Clock, CheckCircle } from "lucide-react";
import { useApi } from "@/lib/api";

export default function BlockchainPage() {
    const { apiFetch } = useApi();
    const [blocks, setBlocks] = useState<any[]>([]);

    useEffect(() => {
        const fetchBlocks = async () => {
            try {
                const data = await apiFetch("/shipments");
                const shipments = data.shipments || [];

                const txs: any[] = [];
                shipments.forEach((s: any) => {
                    if (s.tx_hashes.create) txs.push({ id: s.shipment_id, hash: s.tx_hashes.create, type: "Shipment Created", time: s.pickup_time || new Date().toISOString() });
                    if (s.tx_hashes.select_provider) txs.push({ id: s.shipment_id, hash: s.tx_hashes.select_provider, type: "Provider Selected", time: new Date().toISOString() });
                    if (s.tx_hashes.pickup) txs.push({ id: s.shipment_id, hash: s.tx_hashes.pickup, type: "Pickup Verified", time: new Date().toISOString() });
                    if (s.tx_hashes.delivery) txs.push({ id: s.shipment_id, hash: s.tx_hashes.delivery, type: "Delivery Confirmed", time: new Date().toISOString() });
                    if (s.tx_hashes.telemetry) txs.push({ id: s.shipment_id, hash: s.tx_hashes.telemetry, type: "Telemetry Logged", time: new Date().toISOString() });
                });
                setBlocks(txs.reverse());
            } catch (err) {
                console.error(err);
            }
        };
        fetchBlocks();
        const interval = setInterval(fetchBlocks, 5000);
        return () => clearInterval(interval);
    }, [apiFetch]);

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.15 } },
    };

    const blockVariants = {
        hidden: { opacity: 0, scale: 0.9, y: 20 },
        show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, stiffness: 200 } },
    };

    return (
        <div className="w-full h-full flex flex-col items-center">
            <header className="flex w-full items-center justify-between pb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Blockchain Explorer</h1>
                    <p className="text-sm text-gray-500 mt-1">Immutable ledger visualization.</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-500 text-sm font-medium">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Network Syncing
                </div>
            </header>

            {blocks.length === 0 ? (
                <div className="w-full flex-1 flex items-center justify-center flex-col gap-4 text-gray-500">
                    <Link2 size={48} className="text-gray-300 dark:text-gray-700" />
                    No blocks mined yet. Create a shipment to start.
                </div>
            ) : (
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="relative flex flex-col items-center gap-6 w-full max-w-2xl py-8">
                    <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-gradient-to-b from-blue-500 to-transparent -translate-x-1/2" />

                    {blocks.map((b, i) => (
                        <motion.div variants={blockVariants} key={b.hash} className="relative w-full group">
                            <div className="glass-panel p-6 relative w-full flex justify-between items-center transition-all hover:bg-black/5 dark:hover:bg-white/10 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10">
                                <div className="absolute left-1/2 -translate-x-1/2 -top-6 bottom-0 flex flex-col items-center justify-center">
                                    <div className="w-4 h-4 bg-blue-500 rounded-full border-4 border-white dark:border-[#0f1115] z-10" />
                                </div>

                                <div className="flex-1 pr-8 text-right flex flex-col items-end gap-1">
                                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{b.type}</span>
                                    <span className="text-sm font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md">{b.id}</span>
                                </div>

                                <div className="flex-1 pl-8 flex flex-col items-start gap-2">
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 bg-black/5 dark:bg-white/5 px-2 py-1 rounded border border-black/10 dark:border-white/10 text-xs font-mono break-all w-[300px] overflow-hidden">
                                        <Link2 size={12} className="shrink-0 text-blue-500" />
                                        <span className="truncate">{b.hash}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-gray-400">
                                        <Clock size={12} /> Executed Recently
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    <motion.div variants={blockVariants} className="mt-4 p-4 rounded-full border border-dashed border-gray-300 dark:border-gray-700 text-gray-400 text-sm flex items-center gap-2 bg-transparent">
                        <CheckCircle size={16} /> Genesis Block
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}
