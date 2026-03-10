"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  PackageSearch, Activity, BrainCircuit, Link as LinkIcon,
  Link2, MapPin, Search, TrendingUp, Shield, AlertTriangle
} from "lucide-react";
import { useApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import LiveMapWrapper from "@/components/dashboard/LiveMapWrapper";
import {
  TemperatureTrendChart, GNNScoresChart, ShipmentStatusDonut,
  NetworkThroughputChart, BlockActivityChart, Sparkline
} from "@/components/dashboard/DataCharts";

const containerV = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemV = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } } };

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const diff = value - prev.current;
    prev.current = value;
    let current = display;
    const step = diff / 20;
    let count = 0;
    const timer = setInterval(() => {
      current += step;
      count++;
      if (count >= 20) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.round(current));
    }, 30);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}</>;
}

export default function Dashboard() {
  const { apiFetch } = useApi();
  const { user } = useAuth();
  const [shipments, setShipments] = useState<any[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const data = await apiFetch("/shipments");
        setShipments(data.shipments || []);
      } catch { /* offline demo — use empty */ }
    };
    fetchShipments();
    const interval = setInterval(() => { fetchShipments(); setTick(t => t + 1); }, 5000);
    return () => clearInterval(interval);
  }, [apiFetch]);

  const activeCount = shipments.filter(s => s.status !== "DELIVERED").length;
  const pendingAI = shipments.filter(s => s.status === "BIDDING").length;
  const inTransit = shipments.filter(s => s.status === "IN_TRANSIT").length;
  const delivered = shipments.filter(s => s.status === "DELIVERED").length;

  const recentTxs = shipments.flatMap(s => {
    const events: { id: string; hash: string; type: string }[] = [];
    if (s.tx_hashes?.create) events.push({ id: s.shipment_id, hash: s.tx_hashes.create, type: "Shipment Created" });
    if (s.tx_hashes?.select_provider) events.push({ id: s.shipment_id, hash: s.tx_hashes.select_provider, type: "Provider Selected" });
    if (s.tx_hashes?.pickup) events.push({ id: s.shipment_id, hash: s.tx_hashes.pickup, type: "Pickup Verified" });
    if (s.tx_hashes?.delivery) events.push({ id: s.shipment_id, hash: s.tx_hashes.delivery, type: "Delivery Confirmed" });
    return events;
  });

  const kpis = [
    {
      label: "Active Shipments", value: activeCount || 8, icon: PackageSearch, color: "text-blue-400",
      bg: "from-blue-500/20 to-cyan-500/10", glow: "shadow-blue-500/20",
      spark: [5, 6, 7, 8, 9, 8, 8], sparkColor: "#3b82f6",
      badge: "Live On-Chain", badgeColor: "text-green-400",
    },
    {
      label: "In Transit", value: inTransit || 3, icon: Activity, color: "text-red-400",
      bg: "from-red-500/15 to-orange-500/5", glow: "shadow-red-500/20",
      spark: [1, 2, 2, 3, 4, 3, 3], sparkColor: "#ef4444",
      badge: "IoT Monitored", badgeColor: "text-orange-400",
    },
    {
      label: "Pending Bids", value: pendingAI || 2, icon: BrainCircuit, color: "text-purple-400",
      bg: "from-purple-500/15 to-violet-500/5", glow: "shadow-purple-500/20",
      spark: [0, 1, 3, 4, 2, 3, 2], sparkColor: "#8b5cf6",
      badge: "GNN Evaluating", badgeColor: "text-yellow-400",
    },
    {
      label: "Deliveries Confirmed", value: (delivered || 0) + recentTxs.filter(t => t.type === "Delivery Confirmed").length || 28,
      icon: LinkIcon, color: "text-cyan-400",
      bg: "from-cyan-500/15 to-teal-500/5", glow: "shadow-cyan-500/20",
      spark: [20, 22, 24, 25, 26, 27, 28], sparkColor: "#06b6d4",
      badge: "Blockchain Synced", badgeColor: "text-green-400",
    },
  ];

  const renderRoleContent = () => {
    if (user?.role === "shipper") return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <motion.div variants={itemV} className="glass-panel p-6 flex flex-col overflow-hidden">
          <h3 className="font-semibold text-base flex items-center gap-2 mb-2 dark:text-white"><MapPin size={16} className="text-blue-500" /> Live Outbound Fleet</h3>
          <LiveMapWrapper shipments={shipments} userRole={user?.role} />
        </motion.div>
        <motion.div variants={itemV} className="glass-panel p-6 flex flex-col overflow-hidden gap-3">
          <h3 className="font-semibold text-base flex items-center gap-2 dark:text-white"><BrainCircuit size={16} className="text-purple-500" /> AI Provider Evaluation Radar</h3>
          <p className="text-xs text-gray-500">Multi-axis GNN confidence scoring across providers</p>
          <GNNScoresChart />
        </motion.div>
      </div>
    );

    if (user?.role === "provider") return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <motion.div variants={itemV} className="glass-panel p-6 flex flex-col overflow-hidden">
          <h3 className="font-semibold text-base flex items-center gap-2 mb-2 dark:text-white"><Activity size={16} className="text-red-500" /> My Active Route Telemetry</h3>
          <LiveMapWrapper shipments={shipments} userRole={user?.role} />
        </motion.div>
        <motion.div variants={itemV} className="glass-panel p-6 flex flex-col overflow-hidden gap-3">
          <h3 className="font-semibold text-base flex items-center gap-2 dark:text-white"><PackageSearch size={16} className="text-blue-500" /> Live Cargo Sensor Stream</h3>
          <p className="text-xs text-gray-500">IoT temperature & humidity — auto-updates every 2s</p>
          <TemperatureTrendChart />
        </motion.div>
      </div>
    );

    if (user?.role === "receiver") return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <motion.div variants={itemV} className="glass-panel p-6 flex flex-col overflow-hidden">
          <h3 className="font-semibold text-base flex items-center gap-2 mb-2 dark:text-white"><MapPin size={16} className="text-green-500" /> Inbound Delivery ETA</h3>
          <LiveMapWrapper shipments={shipments} userRole={user?.role} />
        </motion.div>
        <motion.div variants={itemV} className="glass-panel p-6 flex flex-col gap-3 overflow-hidden">
          <h3 className="font-semibold text-base flex items-center gap-2 dark:text-white"><Activity size={16} className="text-blue-500" /> Cold Chain Quality Metrics</h3>
          <TemperatureTrendChart />
        </motion.div>
      </div>
    );

    // Admin / default
    return (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
        <motion.div variants={itemV} className="glass-panel p-6 flex flex-col overflow-hidden xl:col-span-2">
          <h3 className="font-semibold text-base flex items-center gap-2 mb-3 dark:text-white"><Search size={16} className="text-gray-400" /> Global Network Map</h3>
          <LiveMapWrapper shipments={shipments} userRole={user?.role} />
        </motion.div>
        <motion.div variants={itemV} className="glass-panel p-6 flex flex-col gap-4">
          <h3 className="font-semibold text-base flex items-center gap-2 dark:text-white"><TrendingUp size={16} className="text-blue-500" /> Shipment Status</h3>
          <ShipmentStatusDonut shipments={shipments} />
        </motion.div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-y-auto pr-2 pb-8">
      <header className="flex items-center justify-between pb-6 border-b border-black/5 dark:border-white/5 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white capitalize">
            {user?.role || "Admin"}{" "}
            <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">Dashboard</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Real-time blockchain insights & cold-chain supply metrics</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-semibold text-green-400">Live</span>
        </div>
      </header>

      {/* KPI Cards */}
      <motion.div variants={containerV} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              variants={itemV}
              className={`glass-panel p-5 flex flex-col gap-3 bg-gradient-to-br ${kpi.bg} shadow-lg ${kpi.glow} hover:-translate-y-1 transition-transform cursor-default relative overflow-hidden`}
            >
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-xs font-semibold tracking-wide">{kpi.label}</span>
                <div className={`w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center ${kpi.color} relative`}>
                  <Icon size={16} />
                  {kpi.label === "Active Shipments" && (
                    <div className="absolute top-0.5 right-0.5 w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                  )}
                </div>
              </div>
              <div>
                <h2 className="text-4xl font-black text-gray-800 dark:text-gray-100">
                  <AnimatedNumber value={kpi.value} />
                </h2>
                <p className={`text-xs mt-1.5 font-medium flex items-center gap-1 ${kpi.badgeColor}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${kpi.badgeColor.replace("text-", "bg-")}`} />
                  {kpi.badge}
                </p>
              </div>
              <div className="-mx-1 mt-auto opacity-70">
                <Sparkline data={kpi.spark} color={kpi.sparkColor} height={32} />
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Role-specific content */}
      <motion.div variants={containerV} initial="hidden" animate="show">
        {renderRoleContent()}
      </motion.div>

      {/* Bottom row — Ledger + Events + Block Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Shipment Ledger */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, type: "spring", stiffness: 260 }}
          className="glass-panel p-6 flex flex-col overflow-hidden max-h-[380px]"
        >
          <h3 className="font-semibold text-base mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <PackageSearch size={15} className="text-blue-400" /> Global Shipment Ledger
          </h3>
          <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
            {(shipments.length > 0 ? shipments : Array.from({ length: 5 }, (_, i) => ({
              shipment_id: `REQ-200${i + 1}`, status: ["CREATED", "BIDDING", "PROVIDER_SELECTED", "IN_TRANSIT", "DELIVERED"][i],
              pickup_location: "Mumbai Pharma Hub", delivery_location: "City General Hospital"
            }))).slice(0, 10).map((s: any) => {
              const colorMap: Record<string, string> = {
                DELIVERED: "bg-green-500", IN_TRANSIT: "bg-blue-500",
                PROVIDER_SELECTED: "bg-purple-500", BIDDING: "bg-yellow-500 animate-pulse", CREATED: "bg-gray-500"
              };
              return (
                <motion.div
                  whileHover={{ scale: 1.01, x: 4 }}
                  key={s.shipment_id}
                  className="relative flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-[#15171e] shadow-sm border border-black/5 dark:border-white/5 cursor-pointer hover:border-blue-500/30 transition-all"
                >
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${colorMap[s.status] ?? "bg-gray-500"}`} />
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex justify-between w-full items-center">
                      <strong className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">{s.shipment_id}</strong>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 font-bold tracking-wider shrink-0 ml-1">
                        {s.status?.replace(/_/g, " ")}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 truncate">{s.pickup_location} → {s.delivery_location}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Blockchain Event Feed */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, type: "spring", stiffness: 260 }}
          className="glass-panel p-6 flex flex-col overflow-hidden max-h-[380px]"
        >
          <h3 className="font-semibold text-base mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Link2 size={15} className="text-cyan-400" /> Decentralized Event Feed
          </h3>
          <div className="flex flex-col gap-2 overflow-y-auto pr-1 flex-1">
            {(recentTxs.length > 0 ? recentTxs : [
              { id: "REQ-2001", hash: "0xa4f8c3d2e1b9...", type: "Shipment Created" },
              { id: "REQ-2001", hash: "0x9c3d2e1b4f8...", type: "Provider Selected" },
              { id: "REQ-2001", hash: "0x3d2e9c4f8a1...", type: "Pickup Verified" },
              { id: "REQ-2002", hash: "0x1b9a4f8c3d2e...", type: "Delivery Confirmed" },
            ]).reverse().slice(0, 12).map((tx: any, i: number) => (
              <div key={i} className="p-3 rounded-xl bg-white dark:bg-[#15171e] border border-black/5 dark:border-white/5 flex flex-col gap-1.5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold text-white bg-blue-500 px-2 py-0.5 rounded-full">{tx.type}</span>
                  <span className="text-[9px] text-gray-500 font-medium">{tx.id}</span>
                </div>
                <span className="text-[10px] text-blue-500/80 font-mono break-all leading-relaxed">
                  <Link2 size={10} className="inline mr-1" />{tx.hash}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Block Activity */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, type: "spring", stiffness: 260 }}
          className="glass-panel p-6 flex flex-col gap-4"
        >
          <h3 className="font-semibold text-base text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Shield size={15} className="text-indigo-400" /> Live Block Activity
          </h3>
          <p className="text-xs text-gray-500 -mt-2">Hyperledger Fabric — tx count per block (auto-refresh 3s)</p>
          <BlockActivityChart />
          <div className="grid grid-cols-2 gap-3 mt-auto">
            {[
              { label: "Network", val: "Hyperledger Fabric", color: "text-blue-400" },
              { label: "Consensus", val: "RAFT", color: "text-green-400" },
              { label: "Finality", val: "< 2s", color: "text-cyan-400" },
              { label: "Throughput", val: "3,500 TPS", color: "text-purple-400" },
            ].map(m => (
              <div key={m.label} className="bg-white/5 rounded-xl p-2.5">
                <div className="text-[9px] text-gray-600">{m.label}</div>
                <div className={`text-xs font-bold ${m.color}`}>{m.val}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Network Throughput full-width */}
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65, type: "spring", stiffness: 260 }}
        className="glass-panel p-6 mt-6 flex flex-col gap-4"
      >
        <h3 className="font-semibold text-base text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <Activity size={15} className="text-blue-400" /> 24h Network Throughput
        </h3>
        <NetworkThroughputChart />
      </motion.div>
    </div>
  );
}
