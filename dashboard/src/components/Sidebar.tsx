"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Package,
    Link as LinkIcon,
    Activity,
    Gavel,
    QrCode,
    Truck
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { motion } from "framer-motion";

const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/shipments", label: "Shipments", icon: Package },
    { href: "/blockchain", label: "Blockchain Activity", icon: LinkIcon },
    { href: "/telemetry", label: "Telemetry", icon: Activity },
    { href: "/bidding", label: "Bidding Panel", icon: Gavel },
    { href: "/qr-verification", label: "QR Verification", icon: QrCode },
    { href: "/provider", label: "Provider Portal", icon: Truck },
];

import { useAuth } from "@/contexts/AuthContext";

export default function Sidebar() {
    const pathname = usePathname();
    const { user } = useAuth();

    if (pathname === '/login') return null;

    return (
        <aside className="w-64 h-full hidden lg:flex flex-col glass-panel m-4 overflow-hidden border">
            <div className="flex items-center justify-between p-6">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                    HALO
                </h1>
                <ThemeToggle />
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all relative ${isActive ? "text-blue-500 font-medium" : "text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5"
                                }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="active-indicator"
                                    className="absolute inset-0 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                            <Icon size={20} className="relative z-10" />
                            <span className="relative z-10">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {user && (
                <div className="p-6">
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs uppercase">
                            {user.username.charAt(0)}
                        </div>
                        <div className="flex flex-col flex-1 overflow-hidden truncate">
                            <span className="text-sm font-medium leading-none truncate">{user.username}</span>
                            <span className="text-xs text-gray-500 capitalize mt-1 block truncate">{user.role}</span>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}
