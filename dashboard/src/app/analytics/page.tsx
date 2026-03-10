"use client";

import { motion } from "framer-motion";
import {
  ShipmentTrendsChart,
  ProviderPerformanceChart,
  CargoDistributionChart,
  DelayPredictionChart,
  ReputationRadarChart,
  TemperatureTrendChart,
} from "@/components/dashboard/DataCharts";
import { AIInsightsPanel, AIQuickStats } from "@/components/dashboard/AIInsights";
import {
  BarChart3,
  TrendingUp,
  Users,
  Package,
  Calendar,
  Download,
  Filter,
} from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="w-full h-full overflow-y-auto pb-8">
      {/* Header */}
      <header className="flex items-center justify-between pb-6 border-b border-gray-200 dark:border-gray-800 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text">
            Advanced Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Deep insights powered by AI and blockchain data
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Last 30 Days</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            <Filter className="w-4 h-4" />
            <span className="text-sm">Filter</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            <Download className="w-4 h-4" />
            <span className="text-sm">Export Report</span>
          </button>
        </div>
      </header>

      {/* AI Quick Stats */}
      <section className="mb-8">
        <AIQuickStats />
      </section>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ShipmentTrendsChart />
        <TemperatureTrendChart />
        <ProviderPerformanceChart />
        <CargoDistributionChart />
        <DelayPredictionChart />
        <ReputationRadarChart />
      </div>

      {/* AI Insights */}
      <section className="mb-8">
        <AIInsightsPanel />
      </section>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            icon: Package,
            label: "Total Shipments",
            value: "1,284",
            change: "+12.5%",
            color: "blue",
          },
          {
            icon: Users,
            label: "Active Providers",
            value: "47",
            change: "+3",
            color: "green",
          },
          {
            icon: TrendingUp,
            label: "On-Time Rate",
            value: "94.2%",
            change: "+2.1%",
            color: "purple",
          },
          {
            icon: BarChart3,
            label: "Avg Delivery Time",
            value: "4.2h",
            change: "-0.3h",
            color: "orange",
          },
        ].map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className="glass-panel p-6 hover-lift"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`p-3 rounded-lg bg-${metric.color}-100 dark:bg-${metric.color}-900/30`}
              >
                <metric.icon
                  className={`w-5 h-5 text-${metric.color}-500`}
                />
              </div>
              <span
                className={`text-xs font-medium ${
                  metric.change.startsWith("+")
                    ? "text-green-500"
                    : metric.change.startsWith("-")
                    ? "text-green-500"
                    : "text-gray-500"
                }`}
              >
                {metric.change}
              </span>
            </div>
            <p className="text-2xl font-bold">{metric.value}</p>
            <p className="text-sm text-gray-500 mt-1">{metric.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
