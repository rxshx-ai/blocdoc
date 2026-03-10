"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  LineChart,
  Legend,
} from "recharts";
import { useEffect, useState, useRef } from "react";

/* ─── helpers ─────────────────────────────────────────────── */
const rand = (min: number, max: number, dp = 2) =>
  parseFloat((Math.random() * (max - min) + min).toFixed(dp));

const genTemp = (len = 30) =>
  Array.from({ length: len }, (_, i) => {
    const now = new Date(Date.now() - (len - 1 - i) * 30_000);
    return {
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      temp: rand(3.1, 5.8),
      target: 4.0,
      humidity: rand(58, 72),
    };
  });

/* ─── Animated counter hook ─────────────────────────────────── */
function useCounter(end: number, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setVal(end); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);
  return val;
}

/* ─── 1. Live Temperature Trend ─────────────────────────────── */
export function TemperatureTrendChart() {
  const [data, setData] = useState(genTemp(30));

  useEffect(() => {
    const id = setInterval(() => {
      setData(prev => {
        const now = new Date();
        const next = {
          time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          temp: rand(3.0, 6.2),
          target: 4.0,
          humidity: rand(58, 72),
        };
        return [...prev.slice(-49), next];
      });
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const latest = data[data.length - 1]?.temp ?? 4;
  const isAlert = latest > 5.5 || latest < 3.5;

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${isAlert ? "bg-red-500 animate-pulse" : "bg-green-500"}`} />
          <span className={`text-xs font-semibold ${isAlert ? "text-red-500" : "text-green-500"}`}>
            {isAlert ? "⚠ THRESHOLD BREACH" : "✓ NOMINAL"}
          </span>
        </div>
        <span className={`text-2xl font-black font-mono ${isAlert ? "text-red-400" : "text-blue-400"}`}>
          {latest.toFixed(2)}°C
        </span>
      </div>
      <div className="w-full h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="gtTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gtHumid" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#6b7280" }} interval={9} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#6b7280" }} domain={[2, 8]} />
            <Tooltip
              contentStyle={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 11 }}
              labelStyle={{ color: "#94a3b8" }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
            <Area type="monotone" dataKey="temp" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#gtTemp)" name="Temp (°C)" dot={false} />
            <Area type="monotone" dataKey="humidity" stroke="#06b6d4" strokeWidth={1.5} fillOpacity={1} fill="url(#gtHumid)" name="Humidity (%)" dot={false} />
            <Line type="step" dataKey="target" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="6 4" dot={false} name="Target (°C)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ─── 2. GNN Provider Radar ──────────────────────────────────── */
const radarProviders = [
  { metric: "Reliability", "MediFleet": 97, "RapidMed": 83, "ColdChainPro": 90 },
  { metric: "On-Time %", "MediFleet": 94, "RapidMed": 78, "ColdChainPro": 88 },
  { metric: "Cold Chain", "MediFleet": 99, "RapidMed": 85, "ColdChainPro": 95 },
  { metric: "Price Score", "MediFleet": 82, "RapidMed": 91, "ColdChainPro": 70 },
  { metric: "GNN Score", "MediFleet": 96, "RapidMed": 79, "ColdChainPro": 87 },
  { metric: "Coverage", "MediFleet": 88, "RapidMed": 95, "ColdChainPro": 80 },
];

export function GNNScoresChart() {
  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={radarProviders} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "#9ca3af" }} />
          <PolarRadiusAxis angle={30} domain={[60, 100]} tick={{ fontSize: 8, fill: "#6b7280" }} />
          <Radar name="MediFleet" dataKey="MediFleet" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} strokeWidth={2} />
          <Radar name="RapidMed" dataKey="RapidMed" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={2} />
          <Radar name="ColdChainPro" dataKey="ColdChainPro" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
          <Tooltip contentStyle={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 11 }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── 3. Shipment Status Donut ──────────────────────────────── */
const DONUT_COLORS = ["#3b82f6", "#f59e0b", "#8b5cf6", "#10b981", "#ef4444"];
const donutBase = [
  { name: "Created", value: 3 },
  { name: "Bidding", value: 5 },
  { name: "Assigned", value: 7 },
  { name: "In Transit", value: 12 },
  { name: "Delivered", value: 28 },
];

interface CustomLabelProps {
  cx: number;
  cy: number;
  total: number;
}

function CustomDonutLabel({ cx, cy, total }: CustomLabelProps) {
  return (
    <>
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#f8fafc" fontSize={28} fontWeight={800} fontFamily="'Outfit',sans-serif">{total}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#6b7280" fontSize={11} fontWeight={500}>Total</text>
    </>
  );
}

export function ShipmentStatusDonut({ shipments }: { shipments?: { status: string }[] }) {
  const data = shipments && shipments.length > 0
    ? [
      { name: "Created", value: shipments.filter(s => s.status === "CREATED").length || 0 },
      { name: "Bidding", value: shipments.filter(s => s.status === "BIDDING").length || 0 },
      { name: "Assigned", value: shipments.filter(s => s.status === "PROVIDER_SELECTED").length || 0 },
      { name: "In Transit", value: shipments.filter(s => s.status === "IN_TRANSIT").length || 0 },
      { name: "Delivered", value: shipments.filter(s => s.status === "DELIVERED").length || 0 },
    ]
    : donutBase;

  const total = data.reduce((a, b) => a + b.value, 0);

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={3}
              dataKey="value"
              animationBegin={0}
              animationDuration={1200}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
        {/* center label overlay */}
        <div className="flex flex-col items-center -mt-[135px] pointer-events-none">
          <span className="text-3xl font-black text-white">{total}</span>
          <span className="text-xs text-gray-500">Shipments</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 justify-center mt-6">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5 text-[10px] text-gray-400">
            <div className="w-2 h-2 rounded-full" style={{ background: DONUT_COLORS[i] }} />
            {d.name} ({d.value})
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── 4. Weekly Delivery Performance (Composed) ─────────────── */
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const weeklyData = DAYS.map(day => ({
  day,
  delivered: rand(8, 22, 0),
  failed: rand(0, 3, 0),
  successRate: rand(88, 99, 1),
}));

export function DeliverySuccessBar() {
  return (
    <div className="w-full h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#6b7280" }} />
          <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#6b7280" }} />
          <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#6b7280" }} domain={[80, 100]} unit="%" />
          <Tooltip contentStyle={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 11 }} />
          <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
          <Bar yAxisId="left" dataKey="delivered" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Delivered" fillOpacity={0.85} />
          <Bar yAxisId="left" dataKey="failed" fill="#ef4444" radius={[4, 4, 0, 0]} name="Failed" fillOpacity={0.75} />
          <Line yAxisId="right" type="monotone" dataKey="successRate" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: "#10b981" }} name="Success %" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── 5. Network Throughput Stacked Area ────────────────────── */
const throughputData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, "0")}:00`,
  pickups: rand(2, 18, 0),
  deliveries: rand(2, 15, 0),
  alerts: rand(0, 4, 0),
}));

export function NetworkThroughputChart() {
  return (
    <div className="w-full h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={throughputData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gPickup" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gDeliver" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gAlerts" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#6b7280" }} interval={5} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#6b7280" }} />
          <Tooltip contentStyle={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 11 }} />
          <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
          <Area type="monotone" dataKey="pickups" stroke="#3b82f6" strokeWidth={2} fill="url(#gPickup)" name="Pickups" stackId="1" />
          <Area type="monotone" dataKey="deliveries" stroke="#10b981" strokeWidth={2} fill="url(#gDeliver)" name="Deliveries" stackId="1" />
          <Area type="monotone" dataKey="alerts" stroke="#ef4444" strokeWidth={1.5} fill="url(#gAlerts)" name="Alerts" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── 6. Provider Leaderboard (Horizontal Bar) ──────────────── */
const leaderboardData = [
  { name: "MediFleet", score: 96.4, deliveries: 284, color: "#3b82f6" },
  { name: "ColdChainPro", score: 91.2, deliveries: 231, color: "#10b981" },
  { name: "RapidMed", score: 87.5, deliveries: 198, color: "#f59e0b" },
  { name: "HealthMove", score: 83.1, deliveries: 165, color: "#8b5cf6" },
  { name: "MedXpress", score: 74.8, deliveries: 122, color: "#ef4444" },
].sort((a, b) => b.score - a.score);

export function ProviderLeaderboard() {
  return (
    <div className="flex flex-col gap-2 w-full">
      {leaderboardData.map((p, i) => (
        <div key={p.name} className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-4 shrink-0">{i + 1}</span>
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-gray-300">{p.name}</span>
              <span className="font-mono text-gray-400">{p.score}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${p.score}%`, background: p.color }}
              />
            </div>
          </div>
          <span className="text-[10px] text-gray-500 w-12 text-right shrink-0">{p.deliveries} runs</span>
        </div>
      ))}
    </div>
  );
}

/* ─── 7. Mini Sparkline (inline SVG) ────────────────────────── */
export function Sparkline({ data, color = "#3b82f6", height = 36 }: { data: number[]; color?: string; height?: number }) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 100;
  const h = height;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  const polyline = pts.join(" ");
  const areaPath = `M ${pts[0]} L ${pts.join(" L ")} L ${w},${h} L 0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#sg-${color.replace("#", "")})`} />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ─── 8. SLA Compliance Radial ──────────────────────────────── */
export function SLAComplianceGauge({ value = 94.7 }: { value?: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const color = value > 90 ? "#10b981" : value > 75 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={130} height={130} viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
        <circle
          cx="65" cy="65" r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 65 65)"
          style={{ transition: "stroke-dashoffset 1.2s ease, stroke 0.5s ease" }}
        />
        <text x="65" y="60" textAnchor="middle" fill="white" fontSize="22" fontWeight="800" fontFamily="'Outfit',sans-serif">{value}%</text>
        <text x="65" y="78" textAnchor="middle" fill="#6b7280" fontSize="10">SLA</text>
      </svg>
      <span className="text-xs text-gray-500">Compliance Rate (30d)</span>
    </div>
  );
}

/* ─── 9. Temperature Histogram ──────────────────────────────── */
const tempHistData = [
  { range: "2-3°C", count: 12 }, { range: "3-4°C", count: 67 }, { range: "4-5°C", count: 98 },
  { range: "5-6°C", count: 43 }, { range: "6-7°C", count: 18 }, { range: "7-8°C", count: 6 },
];

export function TemperatureHistogram() {
  return (
    <div className="w-full h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={tempHistData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#6b7280" }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#6b7280" }} />
          <Tooltip contentStyle={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 11 }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Readings">
            {tempHistData.map((d, i) => (
              <Cell key={i} fill={d.range === "4-5°C" ? "#10b981" : d.range.startsWith("7") ? "#ef4444" : "#3b82f6"} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── 10. Live Block Activity timeline ───────────────────────── */
const blockData = Array.from({ length: 20 }, (_, i) => ({
  block: 1_847_280 + i,
  txns: rand(1, 12, 0),
  time: i,
}));

export function BlockActivityChart() {
  const [data, setData] = useState(blockData);
  useEffect(() => {
    const id = setInterval(() => {
      setData(prev => {
        const last = prev[prev.length - 1];
        return [...prev.slice(-29), { block: last.block + 1, txns: rand(1, 12, 0), time: last.time + 1 }];
      });
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="w-full h-[160px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#6b7280" }} />
          <Tooltip
            contentStyle={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 11 }}
            formatter={(v: number) => [`${v} txns`, "Block"]}
            labelFormatter={(l: number) => `Block #${blockData[0]?.block + Number(l)}`}
          />
          <Bar dataKey="txns" fill="#6366f1" radius={[3, 3, 0, 0]} fillOpacity={0.85} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
