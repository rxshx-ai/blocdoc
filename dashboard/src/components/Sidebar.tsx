"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  Truck,
  Activity,
  QrCode,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  Bell,
  Users,
  MapPin,
  Brain,
  FileText,
} from "lucide-react";
import { NotificationCenter } from "./dashboard/Notifications";
import { ThemeToggle } from "./ThemeToggle";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Package, label: "Shipments", href: "/shipments" },
  { icon: Truck, label: "Providers", href: "/provider" },
  { icon: Activity, label: "Telemetry", href: "/telemetry" },
  { icon: QrCode, label: "QR Verification", href: "/qr-verification" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: Brain, label: "AI Insights", href: "/ai" },
  { icon: MapPin, label: "Live Tracking", href: "/tracking" },
  { icon: Users, label: "Users", href: "/users" },
  { icon: FileText, label: "Reports", href: "/reports" },
];

const bottomItems = [
  { icon: Settings, label: "Settings", href: "/settings" },
  { icon: Shield, label: "Security", href: "/security" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
      className="w-72 h-full glass-panel border-r border-gray-200 dark:border-gray-800 flex flex-col z-50"
    >
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <motion.div
              className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 blur-lg opacity-50"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.3, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">BlocDoc</h1>
            <p className="text-xs text-gray-500">Healthcare Logistics</p>
          </div>
        </Link>
      </div>

      {/* Main Menu */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
          Main Menu
        </p>
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden ${
                isActive
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 bg-blue-500 rounded-lg"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon
                className={`w-5 h-5 relative z-10 ${
                  isActive ? "text-white" : "group-hover:text-blue-500 transition-colors"
                }`}
              />
              <span className="font-medium relative z-10">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-1">
        {bottomItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}

        {/* User Profile */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 px-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">Admin User</p>
              <p className="text-xs text-gray-500 truncate">admin@blocdoc.health</p>
            </div>
            <div className="flex items-center gap-1">
              <NotificationCenter />
              <ThemeToggle />
              <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                <LogOut className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
