"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
  Thermometer,
  Route,
  Zap,
} from "lucide-react";

interface AIInsight {
  id: string;
  type: "prediction" | "anomaly" | "optimization" | "alert";
  category: string;
  title: string;
  description: string;
  confidence: number;
  impact: "high" | "medium" | "low";
  timestamp: Date;
  actionable: boolean;
  action?: string;
}

// Generate AI insights
const generateInsights = (): AIInsight[] => [
  {
    id: "1",
    type: "prediction",
    category: "Delay Prediction",
    title: "Potential Delay Detected",
    description: "Shipment TX-VAX-007 is predicted to be 15 minutes late due to traffic congestion on Route 66. Alternative route suggested.",
    confidence: 87,
    impact: "medium",
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    actionable: true,
    action: "Reroute via Highway 101",
  },
  {
    id: "2",
    type: "anomaly",
    category: "Temperature Analysis",
    title: "Temperature Pattern Anomaly",
    description: "ML model detected unusual temperature fluctuation pattern in cold storage unit CS-12. Recommend immediate inspection.",
    confidence: 94,
    impact: "high",
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    actionable: true,
    action: "Dispatch technician",
  },
  {
    id: "3",
    type: "optimization",
    category: "Route Optimization",
    title: "Fleet Route Optimized",
    description: "AI analysis suggests consolidating 3 shipments into a single route could reduce fuel costs by 23% and delivery time by 18%.",
    confidence: 91,
    impact: "medium",
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    actionable: true,
    action: "Apply optimization",
  },
  {
    id: "4",
    type: "prediction",
    category: "Demand Forecasting",
    title: "High Demand Predicted",
    description: "Neural network predicts 35% increase in vaccine transport requests next week due to seasonal flu vaccination drive.",
    confidence: 82,
    impact: "high",
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    actionable: false,
  },
  {
    id: "5",
    type: "alert",
    category: "Provider Performance",
    title: "Provider Score Drop",
    description: "Provider 'QuickMed' reputation score dropped by 12 points due to recent temperature violations. Recommend review.",
    confidence: 100,
    impact: "medium",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    actionable: true,
    action: "Review provider",
  },
  {
    id: "6",
    type: "optimization",
    category: "Inventory Management",
    title: "Smart Restock Alert",
    description: "Predictive analysis indicates Hospital X will run low on critical supplies in 3 days based on consumption patterns.",
    confidence: 88,
    impact: "high",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
    actionable: true,
    action: "Schedule delivery",
  },
];

export function AIInsightsPanel() {
  const [insights, setInsights] = useState<AIInsight[]>(generateInsights());
  const [selectedType, setSelectedType] = useState<string>("all");
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

  const filteredInsights = insights.filter(
    (i) => selectedType === "all" || i.type === selectedType
  );

  const getIcon = (type: string) => {
    switch (type) {
      case "prediction":
        return <Brain className="w-5 h-5 text-purple-500" />;
      case "anomaly":
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case "optimization":
        return <Zap className="w-5 h-5 text-yellow-500" />;
      case "alert":
        return <Sparkles className="w-5 h-5 text-blue-500" />;
      default:
        return <Sparkles className="w-5 h-5 text-gray-500" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "text-red-500 bg-red-50 dark:bg-red-900/20";
      case "medium":
        return "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20";
      default:
        return "text-green-500 bg-green-50 dark:bg-green-900/20";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "prediction":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400";
      case "anomaly":
        return "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400";
      case "optimization":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400";
      case "alert":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-600";
    }
  };

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "Just now";
    if (hours === 1) return "1 hour ago";
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">AI Insights</h3>
            <p className="text-sm text-gray-500">Powered by GraphSAGE & Neural Networks</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Last updated: 2m ago</span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {["all", "prediction", "anomaly", "optimization", "alert"].map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
              selectedType === type
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Insights List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {filteredInsights.map((insight, index) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer ${
              expandedInsight === insight.id ? "bg-gray-50 dark:bg-gray-800/50" : ""
            }`}
            onClick={() =>
              setExpandedInsight(expandedInsight === insight.id ? null : insight.id)
            }
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{getIcon(insight.type)}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeColor(
                      insight.type
                    )}`}
                  >
                    {insight.type}
                  </span>
                  <span className="text-xs text-gray-500">{insight.category}</span>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${getImpactColor(
                      insight.impact
                    )}`}
                  >
                    {insight.impact} impact
                  </span>
                </div>
                <h4 className="font-medium mt-2">{insight.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {insight.description}
                </p>

                {/* Expanded Content */}
                {expandedInsight === insight.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <span className="text-gray-500">
                          Confidence: <strong className="text-blue-500">{insight.confidence}%</strong>
                        </span>
                        <span className="text-gray-500">
                          Detected: {formatTime(insight.timestamp)}
                        </span>
                      </div>
                      {insight.actionable && (
                        <button className="px-4 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors">
                          {insight.action}
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Confidence Bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500">AI Confidence</span>
                    <span className="font-medium">{insight.confidence}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${insight.confidence}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className={`h-full rounded-full ${
                        insight.confidence > 90
                          ? "bg-green-500"
                          : insight.confidence > 75
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Model Status */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">AI Models Active</span>
          </div>
          <div className="flex gap-4 text-xs text-gray-500">
            <span>GraphSAGE: v2.1</span>
            <span>LSTM: v1.8</span>
            <span>Transformer: v3.0</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Quick Stats Card
export function AIQuickStats() {
  const stats = [
    { label: "Predictions Made", value: "1,247", change: "+12%", trend: "up" },
    { label: "Anomalies Detected", value: "23", change: "-5%", trend: "down" },
    { label: "Optimizations Applied", value: "89", change: "+28%", trend: "up" },
    { label: "Accuracy Rate", value: "94.2%", change: "+2.1%", trend: "up" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="glass-panel p-4"
        >
          <p className="text-xs text-gray-500 uppercase tracking-wide">{stat.label}</p>
          <div className="flex items-end justify-between mt-2">
            <span className="text-2xl font-bold">{stat.value}</span>
            <span
              className={`text-xs font-medium flex items-center gap-0.5 ${
                stat.trend === "up" ? "text-green-500" : "text-red-500"
              }`}
            >
              {stat.trend === "up" ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {stat.change}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
