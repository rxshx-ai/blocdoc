"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import {
  MapPin,
  Navigation,
  Clock,
  Thermometer,
  Truck,
  Package,
  Signal,
  Battery,
  AlertTriangle,
  Route,
  Speed,
} from "lucide-react";

const LiveMap = dynamic(() => import("@/components/dashboard/LiveMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] flex items-center justify-center glass-panel">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
    </div>
  ),
});

interface TrackingStats {
  activeVehicles: number;
  avgSpeed: number;
  tempViolations: number;
  routeDeviations: number;
}

export default function TrackingPage() {
  const [selectedShipment, setSelectedShipment] = useState<string | null>(null);

  const stats: TrackingStats = {
    activeVehicles: 12,
    avgSpeed: 45,
    tempViolations: 1,
    routeDeviations: 0,
  };

  return (
    <div className="w-full h-full overflow-y-auto pb-8">
      {/* Header */}
      <header className="flex items-center justify-between pb-6 border-b border-gray-200 dark:border-gray-800 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text">
            Live Tracking
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time fleet monitoring and telemetry
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 text-sm">
            <Signal className="w-4 h-4 animate-pulse" />
            <span>12 Active</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-sm">
            <Navigation className="w-4 h-4" />
            <span>Live</span>
          </div>
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Truck, label: "Active Vehicles", value: stats.activeVehicles, unit: "" },
          { icon: Speed, label: "Avg Speed", value: stats.avgSpeed, unit: "km/h" },
          { icon: Thermometer, label: "Temp Alerts", value: stats.tempViolations, unit: "", alert: stats.tempViolations > 0 },
          { icon: Route, label: "Route Deviations", value: stats.routeDeviations, unit: "", alert: stats.routeDeviations > 0 },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`glass-panel p-4 ${stat.alert ? "border-l-4 border-red-500" : ""}`}
          >
            <div className="flex items-center justify-between">
              <stat.icon className={`w-5 h-5 ${stat.alert ? "text-red-500" : "text-gray-400"}`} />
              {stat.alert && (
                <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
              )}
            </div>
            <p className="text-2xl font-bold mt-2">
              {stat.value}
              <span className="text-sm font-normal text-gray-500 ml-1">{stat.unit}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Map */}
      <div className="mb-6">
        <LiveMap userRole="admin" />
      </div>

      {/* Active Shipments List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shipment Cards */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold mb-4">Active Shipments</h3>
          {[
            {
              id: "TX-VAX-001",
              cargo: "Vaccines",
              temp: 4.2,
              status: "In Transit",
              progress: 65,
              eta: "12:30 PM",
              provider: "MediFleet",
              from: "BioPharm Center",
              to: "City General Hospital",
            },
            {
              id: "TX-BLD-002",
              cargo: "Blood Samples",
              temp: 3.8,
              status: "In Transit",
              progress: 80,
              eta: "11:45 AM",
              provider: "RapidMed",
              from: "Blood Bank",
              to: "Emergency Center",
            },
            {
              id: "TX-MED-003",
              cargo: "Medicines",
              temp: 22.0,
              status: "Provider Selected",
              progress: 0,
              eta: "02:00 PM",
              provider: "ColdChain",
              from: "Pharma Distribution",
              to: "Regional Hospital",
            },
          ].map((shipment, index) => (
            <motion.div
              key={shipment.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="glass-panel p-4 hover:border-blue-500/50 transition-colors cursor-pointer"
              onClick={() => setSelectedShipment(shipment.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Package className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">{shipment.id}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                        {shipment.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {shipment.from} → {shipment.to}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        {shipment.provider}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        ETA {shipment.eta}
                      </span>
                      <span className="flex items-center gap-1">
                        <Thermometer className="w-3 h-3" />
                        {shipment.temp}°C
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{shipment.progress}%</p>
                  <div className="w-16 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-1">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${shipment.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Telemetry Panel */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Live Telemetry</h3>
          <div className="glass-panel p-4 space-y-4">
            {[
              { label: "GPS Signal", value: "Strong", icon: MapPin, color: "green" },
              { label: "Battery", value: "87%", icon: Battery, color: "green" },
              { label: "Temperature", value: "4.2°C", icon: Thermometer, color: "green" },
              { label: "Humidity", value: "65%", icon: Package, color: "green" },
            ].map((metric) => (
              <div key={metric.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <metric.icon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{metric.label}</span>
                </div>
                <span className={`text-sm font-medium text-${metric.color}-500`}>
                  {metric.value}
                </span>
              </div>
            ))}
          </div>

          {/* Alerts Panel */}
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-4">Recent Alerts</h3>
            <div className="glass-panel p-4 space-y-3">
              <div className="flex items-start gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border-l-2 border-red-500">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-600">Temperature Alert</p>
                  <p className="text-xs text-gray-500">TX-VAX-001 exceeded threshold</p>
                  <p className="text-xs text-gray-400 mt-1">2 min ago</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border-l-2 border-amber-500">
                <Clock className="w-4 h-4 text-amber-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-600">Delay Warning</p>
                  <p className="text-xs text-gray-500">TX-BLD-002 predicted 15min late</p>
                  <p className="text-xs text-gray-400 mt-1">5 min ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
