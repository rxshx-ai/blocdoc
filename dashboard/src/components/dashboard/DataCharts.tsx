"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useEffect, useState } from "react";

const mockTemperatureData = Array.from({ length: 20 }, (_, i) => ({
    time: "10:" + (i < 10 ? '0' : '') + i + " AM",
    temp: 4.2 + (Math.random() * 0.8 - 0.4),
    target: 4.0
}));

const mockGnnScores = [
    { provider: "drv-001", score: 0.9992, eta: 0.85, price: 0.9 },
    { provider: "drv-002", score: 0.6120, eta: 0.60, price: 0.8 },
    { provider: "drv-003", score: 0.7300, eta: 0.95, price: 0.5 },
];

export function TemperatureTrendChart() {
    return (
        <div className="w-full h-[250px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockTemperatureData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} domain={['dataMin - 1', 'dataMax + 1']} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="temp" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" />
                    <Area type="step" dataKey="target" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" fill="none" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

export function GNNScoresChart() {
    return (
        <div className="w-full h-[250px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockGnnScores} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="provider" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} domain={[0, 1]} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" name="GNN Prob" />
                    <Area type="monotone" dataKey="eta" stroke="#10b981" strokeWidth={2} fillOpacity={0} name="ETA Score" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
