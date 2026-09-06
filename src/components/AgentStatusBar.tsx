"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Zap, TrendingDown, Shield, Cpu, ChevronUp, ChevronDown, Activity } from "lucide-react";
import Link from "next/link";

const agentStatuses = [
  { text: "Monitoring tariff signals", icon: Activity },
  { text: "Analyzing appliance patterns", icon: Brain },
  { text: "Optimizing load schedule", icon: Zap },
  { text: "Guarding battery reserve", icon: Shield },
  { text: "Tracking phantom loads", icon: Cpu },
];

export function AgentStatusBar() {
  const [expanded, setExpanded] = useState(false);
  const [statusIdx, setStatusIdx] = useState(0);
  const [savings, setSavings] = useState(0);

  // Cycle through agent statuses
  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIdx((prev) => (prev + 1) % agentStatuses.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Animate savings counter
  useEffect(() => {
    const target = 6550;
    const duration = 2000;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setSavings(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);

  const current = agentStatuses[statusIdx];
  const CurrentIcon = current.icon;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="bg-bg-deep/95 backdrop-blur-xl border-t border-white/5 px-4 py-4">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Link href="/dashboard" className="flex items-center gap-3 p-3 rounded-card bg-bg-surface border border-white/5 hover:border-orange-electric/30 transition-all group">
                    <div className="w-9 h-9 rounded-lg bg-orange-electric/10 flex items-center justify-center">
                      <TrendingDown size={16} className="text-orange-electric" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted">AI Control Room</p>
                      <p className="text-xs font-semibold text-main group-hover:text-orange-electric transition-colors">Run Optimization</p>
                    </div>
                  </Link>
                  <Link href="/ai-agent" className="flex items-center gap-3 p-3 rounded-card bg-bg-surface border border-white/5 hover:border-ai/30 transition-all group">
                    <div className="w-9 h-9 rounded-lg bg-ai/10 flex items-center justify-center">
                      <Brain size={16} className="text-ai" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted">AI Agent</p>
                      <p className="text-xs font-semibold text-main group-hover:text-ai transition-colors">Chat with AI</p>
                    </div>
                  </Link>
                  <Link href="/bill-doctor" className="flex items-center gap-3 p-3 rounded-card bg-bg-surface border border-white/5 hover:border-green-savings/30 transition-all group">
                    <div className="w-9 h-9 rounded-lg bg-green-savings/10 flex items-center justify-center">
                      <Zap size={16} className="text-green-savings" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted">Bill Doctor</p>
                      <p className="text-xs font-semibold text-main group-hover:text-green-savings transition-colors">Diagnose Bill</p>
                    </div>
                  </Link>
                  <Link href="/hardware" className="flex items-center gap-3 p-3 rounded-card bg-bg-surface border border-white/5 hover:border-warning/30 transition-all group">
                    <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center">
                      <Cpu size={16} className="text-warning" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted">Hardware Lab</p>
                      <p className="text-xs font-semibold text-main group-hover:text-warning transition-colors">ESP32 Bridge</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main status bar */}
      <div className="bg-bg-deep/90 backdrop-blur-xl border-t border-white/8 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Agent status */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-electric to-orange-deep flex items-center justify-center">
                <Brain size={13} className="text-white" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-savings border-2 border-bg-deep animate-pulse" />
            </div>
            <div className="min-w-0 hidden sm:block">
              <AnimatePresence mode="wait">
                <motion.div
                  key={statusIdx}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-1.5"
                >
                  <CurrentIcon size={11} className="text-orange-electric shrink-0" />
                  <span className="text-xs text-muted truncate">{current.text}</span>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Center: Savings counter */}
          <div className="flex items-center gap-2">
            <TrendingDown size={12} className="text-green-savings" />
            <span className="text-[10px] text-muted hidden sm:inline">Projected savings:</span>
            <span className="font-mono-num text-sm font-bold text-green-savings">
              Rs. {savings.toLocaleString()}<span className="text-[10px] text-muted font-normal">/mo</span>
            </span>
          </div>

          {/* Right: Expand/collapse + chip */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-orange-electric/10 text-orange-electric border border-orange-electric/20 hidden md:inline-flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-orange-electric animate-pulse" />
              PakGrid AI v2.0
            </span>
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
              title={expanded ? "Collapse" : "Quick nav"}
            >
              {expanded ? <ChevronDown size={13} className="text-muted" /> : <ChevronUp size={13} className="text-muted" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
