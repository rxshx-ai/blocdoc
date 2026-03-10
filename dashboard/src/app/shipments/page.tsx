"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Search,
  Filter,
  Plus,
  MapPin,
  Thermometer,
  Truck,
  Clock,
  MoreVertical,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  QrCode,
  ArrowRight,
} from "lucide-react";
import { useApi } from "@/lib/api";

interface Shipment {
  shipment_id: string;
  cargo_type: string;
  pickup_location: string;
  delivery_location: string;
  status: string;
  temperature_requirement: number;
  selected_provider: string | null;
  created_at: string;
  pickup_time: string | null;
}

const statusColors: Record<string, { bg: string; text: string; icon: any }> = {
  CREATED: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600", icon: Package },
  BIDDING: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-600", icon: Clock },
  PROVIDER_SELECTED: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-600", icon: Truck },
  IN_TRANSIT: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600", icon: MapPin },
  DELIVERED: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-600", icon: CheckCircle },
  DISPUTED: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-600", icon: AlertTriangle },
};

export default function ShipmentsPage() {
  const { apiFetch } = useApi();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const data = await apiFetch("/shipments");
      setShipments(data.shipments || []);
    } catch (err) {
      console.error("Failed to fetch shipments:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredShipments = shipments.filter((s) => {
    const matchesSearch =
      s.shipment_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.cargo_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.pickup_location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-full h-full overflow-y-auto pb-8">
      {/* Header */}
      <header className="flex items-center justify-between pb-6 border-b border-gray-200 dark:border-gray-800 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text">Shipments</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and track all healthcare logistics shipments
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          <Plus className="w-4 h-4" />
          <span>New Shipment</span>
        </button>
      </header>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search shipments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Status</option>
            <option value="CREATED">Created</option>
            <option value="BIDDING">Bidding</option>
            <option value="PROVIDER_SELECTED">Provider Selected</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DELIVERED">Delivered</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Shipments", value: shipments.length, color: "blue" },
          { label: "In Transit", value: shipments.filter((s) => s.status === "IN_TRANSIT").length, color: "amber" },
          { label: "Delivered", value: shipments.filter((s) => s.status === "DELIVERED").length, color: "green" },
          { label: "Pending Bids", value: shipments.filter((s) => s.status === "BIDDING").length, color: "purple" },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-4"
          >
            <p className="text-xs text-gray-500 uppercase tracking-wide">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Shipments Table */}
      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
          </div>
        ) : filteredShipments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No shipments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Shipment ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Cargo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredShipments.map((shipment, index) => {
                  const statusConfig = statusColors[shipment.status] || statusColors.CREATED;
                  const StatusIcon = statusConfig.icon;

                  return (
                    <motion.tr
                      key={shipment.shipment_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium">{shipment.shipment_id}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span>{shipment.cargo_type}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                          <Thermometer className="w-3 h-3" />
                          <span>{shipment.temperature_requirement}°C</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="truncate max-w-[100px]">{shipment.pickup_location}</span>
                          <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span className="truncate max-w-[100px]">{shipment.delivery_location}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {shipment.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {shipment.selected_provider ? (
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-gray-400" />
                            <span className="text-sm truncate max-w-[120px]">
                              {shipment.selected_provider.slice(0, 10)}...
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
