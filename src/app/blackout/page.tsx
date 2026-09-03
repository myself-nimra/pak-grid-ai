"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Battery, Zap, AlertTriangle, CheckCircle, Sun, Snowflake, Droplets, Lightbulb, Wifi, Wind, Shirt, Clock, Activity, Cpu } from "lucide-react";

const essential = [
  { icon: Wind, name: "Ceiling Fan", watts: 70 },
  { icon: Lightbulb, name: "Lights", watts: 40 },
  { icon: Snowflake, name: "Refrigerator", watts: 180 },
  { icon: Wifi, name: "Router", watts: 12 },
];

const nonEssential = [
  { icon: Snowflake, name: "AC", watts: 1420, action: "Reduce" },
  { icon: Droplets, name: "Water Pump", watts: 1100, action: "Delay" },
  { icon: Shirt, name: "Iron", watts: 1200, action: "Delay" },
  { icon: Zap, name: "Washing Machine", watts: 500, action: "Delay" },
];

export default function BlackoutPage() {
  const [risk, setRisk] = useState(78);
  const [batteryPct, setBatteryPct] = useState(64);
  const [simulating, setSimulating] = useState(false);
  const [gridState, setGridState] = useState<"stable" | "warning" | "blackout">("warning");

  const riskLevel = risk > 60 ? "HIGH" : risk > 30 ? "MEDIUM" : "LOW";
  const riskColor = risk > 60 ? "text-danger" : risk > 30 ? "text-warning" : "text-green-savings";
  const riskBadge = risk > 60 ? "badge-danger" : risk > 30 ? "badge-warning" : "badge-success";
  
  const essentialWatts = essential.reduce((s, e) => s + e.watts, 0);
  const nonEssentialWatts = nonEssential.reduce((s, e) => s + e.watts, 0);
  const backupHours = ((batteryPct / 100) * 5000 / essentialWatts / 1000).toFixed(1);

  const simulateHigh = async () => {
    setSimulating(true);
    setGridState("warning");
    for (let r = 12; r <= 88; r += 4) {
      setRisk(Math.min(88, r));
      await new Promise((res) => setTimeout(res, 50));
    }
    setGridState("blackout");
    setSimulating(false);
  };

  const simulateLow = async () => {
    setSimulating(true);
    for (let r = risk; r >= 15; r -= 4) {
      setRisk(Math.max(15, r));
      await new Promise((res) => setTimeout(res, 50));
    }
    setGridState("stable");
    setSimulating(false);
  };

  return (
    <div className="pt-20 pb-16 px-4 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={gridState === "blackout" ? "live-dot-orange" : "live-dot"} />
            <span className={`text-xs font-medium ${gridState === "blackout" ? "text-danger" : "text-green-savings"}`}>
              {gridState === "blackout" ? "Outage Protection Active" : "Grid Monitoring Online"}
            </span>
          </div>
          <h1 className="font-heading text-3xl font-bold flex items-center gap-2">
            <Shield className="text-orange-electric" size={28} />
            Blackout Guardian
          </h1>
          <p className="text-muted text-sm">Load-shedding prediction, pre-charging algorithms & battery preservation</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={simulateHigh}
            disabled={simulating}
            className="btn-primary text-sm inline-flex items-center gap-2 disabled:opacity-50"
          >
            <AlertTriangle size={15} /> {simulating ? "Simulating..." : "Simulate Blackout Risk"}
          </button>
          <button
            onClick={simulateLow}
            disabled={simulating}
            className="btn-secondary text-sm inline-flex items-center gap-2 disabled:opacity-50"
          >
            <CheckCircle size={15} /> Reset Grid Stability
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Outage Risk Circular Gauge */}
        <div className="glass-card p-6 flex flex-col items-center justify-between hover-lift">
          <h3 className="font-heading font-semibold mb-2">Predicted Outage Risk</h3>
          <p className="text-muted text-xs mb-4 text-center">Based on neighborhood grid patterns & weather</p>
          
          <div className="relative w-48 h-48 my-2">
            <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
              <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
              <motion.circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke={risk > 60 ? "#EF4444" : risk > 30 ? "#F59E0B" : "#16F08B"}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${(risk / 100) * 502.65} 502.65`}
                transition={{ duration: 0.6 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className={`font-mono-num text-4xl font-bold ${riskColor}`}>{risk}%</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${riskBadge} mt-1`}>{riskLevel} RISK</span>
            </div>
          </div>

          <p className="text-muted text-xs text-center mt-4 leading-relaxed">
            {risk > 60
              ? "High load-shedding probability detected. Pre-charging solar battery reserve automatically."
              : risk > 30
              ? "Moderate risk. Monitoring neighborhood transformer fluctuations."
              : "Grid stable — normal operation authorized."}
          </p>
        </div>

        {/* Battery Status Panel */}
        <div className="glass-card p-6 hover-lift">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Battery size={20} className="text-ai" />
              <h3 className="font-heading font-semibold">Battery Reserve</h3>
            </div>
            <span className="badge-ai text-xs px-2 py-0.5 rounded-full">5 kWh LFP</span>
          </div>

          <div className="flex items-center gap-6 mb-6">
            {/* Battery Vertical Gauge */}
            <div className="relative w-16 h-36 border-2 border-white/20 rounded-xl overflow-hidden p-1 bg-black/40">
              <motion.div
                className="absolute bottom-1 left-1 right-1 bg-gradient-to-t from-ai to-cyan-300 rounded-lg"
                animate={{ height: `${batteryPct}%` }}
                transition={{ duration: 0.5 }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-mono-num text-lg font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {batteryPct}%
                </span>
              </div>
            </div>

            <div className="space-y-3 text-sm flex-1">
              <div>
                <span className="text-muted text-xs">Available Backup</span>
                <br />
                <span className="font-mono-num font-bold text-main text-lg">{((batteryPct / 100) * 5).toFixed(1)} kWh</span>
              </div>
              <div>
                <span className="text-muted text-xs">Protected Runtime</span>
                <br />
                <span className="font-mono-num font-bold text-green-savings text-lg">{backupHours} Hours</span>
              </div>
              <div>
                <span className="text-muted text-xs">Solar Pre-Charge</span>
                <br />
                <span className="font-mono-num font-semibold text-orange-golden">1.2 kW Active</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-bg-surface rounded-btn p-2.5 border border-white/5">
              <span className="text-muted text-[10px]">Essential Load</span>
              <br />
              <span className="font-mono-num font-bold text-green-savings text-sm">{essentialWatts}W</span>
            </div>
            <div className="bg-bg-surface rounded-btn p-2.5 border border-white/5">
              <span className="text-muted text-[10px]">Isolated Load</span>
              <br />
              <span className="font-mono-num font-bold text-danger text-sm">{nonEssentialWatts.toLocaleString()}W</span>
            </div>
          </div>
        </div>

        {/* Protection Strategy */}
        <div className="space-y-4">
          {/* Essential Loads */}
          <div className="glass-card p-5 border-green-savings/20">
            <h3 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2">
              <CheckCircle size={15} className="text-green-savings" /> Protected Essential Circuits
            </h3>
            <div className="space-y-2">
              {essential.map((e) => (
                <div key={e.name} className="flex items-center justify-between text-sm p-2 rounded-btn bg-green-savings/5 border border-green-savings/10">
                  <span className="flex items-center gap-2">
                    <e.icon size={14} className="text-green-savings" />
                    <span className="font-medium text-xs">{e.name}</span>
                  </span>
                  <span className="font-mono-num text-xs text-green-savings font-semibold">{e.watts}W</span>
                </div>
              ))}
            </div>
          </div>

          {/* Non-Essential */}
          <div className={`glass-card p-5 transition-all ${risk > 60 ? "border-danger/30" : ""}`}>
            <h3 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2">
              <AlertTriangle size={15} className={risk > 60 ? "text-danger animate-pulse" : "text-muted"} /> Non-Essential — Shed & Shift
            </h3>
            <div className="space-y-2">
              {nonEssential.map((e) => (
                <div key={e.name} className={`flex items-center justify-between text-sm p-2 rounded-btn transition-all ${risk > 60 ? "bg-danger/10 border border-danger/20 opacity-70" : "bg-white/5"}`}>
                  <span className="flex items-center gap-2">
                    <e.icon size={14} className={risk > 60 ? "text-danger" : "text-muted"} />
                    <span className="font-medium text-xs">{e.name}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-num text-xs text-muted">{(e.watts / 1000).toFixed(1)}kW</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${risk > 60 ? "badge-danger" : "badge-warning"}`}>{e.action}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Protection Strategy active alert banner */}
      <AnimatePresence>
        {risk > 60 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card p-5 mt-6 border-danger/40 glow-red"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-danger/20 flex items-center justify-center shrink-0">
                <Shield size={20} className="text-danger" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-sm text-danger flex items-center gap-2">
                  <span>Blackout Guardian Strategy Deployed</span>
                  <span className="text-[10px] bg-danger/20 text-danger px-2 py-0.5 rounded-full">HIGH RISK</span>
                </h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  PakGrid AI has locked the battery reserve for essential appliances only. High-demand appliances (AC & Water Pump) have been isolated at the ESP32 relay level to guarantee +2.1 hours of extra backup duration.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
