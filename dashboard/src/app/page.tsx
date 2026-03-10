"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PackageSearch, Activity, BrainCircuit, Link as LinkIcon, Link2, MapPin, Search } from "lucide-react";
import { useApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import LiveMapWrapper from "@/components/dashboard/LiveMapWrapper";
import { TemperatureTrendChart, GNNScoresChart } from "@/components/dashboard/DataCharts";

export default function Dashboard() {
  const { apiFetch } = useApi();
  const { user } = useAuth();
  const [shipments, setShipments] = useState<any[]>([]);

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const data = await apiFetch("/shipments");
        setShipments(data.shipments || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchShipments();
    const interval = setInterval(fetchShipments, 5000);
    return () => clearInterval(interval);
  }, [apiFetch]);

  const activeShipmentsCount = shipments.filter(s => s.status !== "DELIVERED").length;
  const pendingAI = shipments.filter(s => s.status === "BIDDING").length;
  const inTransitCount = shipments.filter(s => s.status === "IN_TRANSIT").length;

  const recentTxs = shipments.flatMap(s => {
    const events = [];
    if (s.tx_hashes.create) events.push({ id: s.shipment_id, hash: s.tx_hashes.create, type: "Shipment Created" });
    if (s.tx_hashes.select_provider) events.push({ id: s.shipment_id, hash: s.tx_hashes.select_provider, type: "Provider Selected" });
    if (s.tx_hashes.pickup) events.push({ id: s.shipment_id, hash: s.tx_hashes.pickup, type: "Pickup Verified" });
    if (s.tx_hashes.delivery) events.push({ id: s.shipment_id, hash: s.tx_hashes.delivery, type: "Delivery Confirmed" });
    if (s.tx_hashes.telemetry) events.push({ id: s.shipment_id, hash: s.tx_hashes.telemetry, type: "Telemetry Logged" });
    return events;
  });

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } } };

  const renderRoleSpecificContent = () => {
    if (user?.role === 'shipper') {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <motion.div variants={itemVariants} className="glass-panel p-6 flex flex-col overflow-hidden">
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><MapPin size={18} className="text-blue-500" /> Live Outbound Fleet</h3>
            <LiveMapWrapper shipments={shipments} userRole={user?.role} />
          </motion.div>
          <motion.div variants={itemVariants} className="glass-panel p-6 flex flex-col overflow-hidden gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><BrainCircuit size={18} className="text-purple-500" /> AI GraphSAGE Edge Scores</h3>
              <p className="text-xs text-gray-500 mb-2">Real-time GNN Provider Selection node inferences (Confidence vs Pricing mapping).</p>
              <GNNScoresChart />
            </div>
          </motion.div>
        </div>
      );
    }

    if (user?.role === 'provider') {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <motion.div variants={itemVariants} className="glass-panel p-6 flex flex-col overflow-hidden">
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><Activity size={18} className="text-red-500" /> My Active Route Telemetry</h3>
            <p className="text-xs text-gray-500 mb-2">Simulating live progression and OSRM generated routes.</p>
            <LiveMapWrapper shipments={shipments} userRole={user?.role} />
          </motion.div>
          <motion.div variants={itemVariants} className="glass-panel p-6 flex flex-col overflow-hidden gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><PackageSearch size={18} className="text-blue-500" /> Cargo Sensor Stream (Simulated)</h3>
              <p className="text-xs text-gray-500 mb-2">Real-time dynamic temperature stability of the active cargo.</p>
              <TemperatureTrendChart />
            </div>
          </motion.div>
        </div>
      );
    }

    if (user?.role === 'receiver') {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <motion.div variants={itemVariants} className="glass-panel p-6 flex flex-col overflow-hidden">
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><MapPin size={18} className="text-green-500" /> Inbound Delivery ETA</h3>
            <LiveMapWrapper shipments={shipments} userRole={user?.role} />
          </motion.div>
          <motion.div variants={itemVariants} className="glass-panel p-6 flex flex-col overflow-hidden gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><Activity size={18} className="text-blue-500" /> Incoming Quality Metrics</h3>
              <p className="text-xs text-gray-500 mb-2">Pre-arrival custody cold-chain guarantees.</p>
              <TemperatureTrendChart />
            </div>
          </motion.div>
        </div>
      );
    }

    // Default Admin view
    return (
      <div className="grid grid-cols-1 gap-6 mt-6">
        <motion.div variants={itemVariants} className="glass-panel p-6 flex flex-col overflow-hidden">
          <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><Search size={18} className="text-gray-500" /> Global Network Map</h3>
          <LiveMapWrapper shipments={shipments} userRole={user?.role} />
        </motion.div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-y-auto pr-2 pb-8">
      <header className="flex items-center justify-between pb-6 border-b border-black/5 dark:border-white/5 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white capitalize">{user?.role || 'Admin'} Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time predictive insights & supply chain metrics.</p>
        </div>
      </header>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <motion.div variants={itemVariants} className="glass-panel p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm font-semibold tracking-wide">Active Shipments</span>
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 relative">
              <PackageSearch size={18} />
              <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping" />
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-black text-gray-800 dark:text-gray-100">{activeShipmentsCount}</h2>
            <p className="text-xs text-green-500 mt-2 font-medium flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Live On-Chain Tracking</p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-panel p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm font-semibold tracking-wide">In Transit</span>
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500">
              <Activity size={18} />
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-black text-gray-800 dark:text-gray-100">{inTransitCount}</h2>
            <p className="text-xs text-gray-400 mt-2 font-medium">IoT Sensors Active</p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-panel p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm font-semibold tracking-wide">Pending Bids</span>
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-500">
              <BrainCircuit size={18} />
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-black text-gray-800 dark:text-gray-100">{pendingAI}</h2>
            <p className="text-xs text-yellow-500 mt-2 font-medium">GNN Evaluation Queue</p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-panel p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm font-semibold tracking-wide">Confirmed Blocks</span>
            <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-500">
              <LinkIcon size={18} />
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-black text-gray-800 dark:text-gray-100 w-full truncate">{recentTxs.length}</h2>
            <p className="text-xs text-green-500 mt-2 font-medium">Synced Events</p>
          </div>
        </motion.div>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="show">
        {renderRoleSpecificContent()}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, type: "spring", stiffness: 300 }} className="glass-panel p-6 flex flex-col overflow-hidden max-h-[400px]">
          <h3 className="font-semibold text-lg mb-4 text-gray-800 dark:text-gray-200">Global Shipment Ledger</h3>
          <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3 relative">
            <div className="absolute top-0 bottom-0 left-5 w-px bg-gray-200 dark:bg-gray-800 hidden sm:block"></div>
            {shipments.slice(0, 10).map((s, i) => {
              let color = s.status === 'DELIVERED' ? 'bg-green-500' :
                s.status === 'IN_TRANSIT' ? 'bg-blue-500' :
                  s.status === 'PROVIDER_SELECTED' ? 'bg-purple-500' : 'bg-yellow-500';

              return (
                <motion.div whileHover={{ scale: 1.01, x: 5 }} key={s.shipment_id} className="relative flex items-center gap-4 p-3 rounded-2xl bg-white dark:bg-[#15171e] shadow-sm border border-black/5 dark:border-white/5 mx-1 group cursor-pointer hover:border-blue-500/30">
                  <div className={`w-3 h-3 rounded-full z-10 hidden sm:block shadow-[0_0_10px_rgba(0,0,0,0.2)] ${color}`} />
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex justify-between w-full items-center mb-1">
                      <strong className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{s.shipment_id}</strong>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 font-bold tracking-wider shrink-0 ml-2`}>{s.status.replace("_", " ")}</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{s.pickup_location} → {s.delivery_location}</span>
                  </div>
                </motion.div>
              )
            })}
            {shipments.length === 0 && <p className="text-sm text-gray-400 italic">No ledger activity.</p>}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, type: "spring", stiffness: 300 }} className="glass-panel p-6 flex flex-col overflow-hidden max-h-[400px]">
          <h3 className="font-semibold text-lg mb-4 text-gray-800 dark:text-gray-200">Decentralized Event Feed</h3>
          <div className="flex flex-col gap-3 overflow-y-auto pr-2">
            {recentTxs.reverse().slice(0, 20).map((tx, i) => (
              <div key={i} className="p-3 rounded-2xl bg-white dark:bg-[#15171e] border border-black/5 dark:border-white/5 flex flex-col gap-1.5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-white bg-blue-500 px-2 py-0.5 rounded-full">{tx.type}</span>
                  <span className="text-[10px] text-gray-400 font-medium">{tx.id}</span>
                </div>
                <span className="text-xs text-blue-500/80 font-mono break-all leading-relaxed mt-1"><Link2 size={12} className="inline mr-1" />{tx.hash}</span>
              </div>
            ))}
            {recentTxs.length === 0 && <p className="text-sm text-gray-400 italic">No network events observed.</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
