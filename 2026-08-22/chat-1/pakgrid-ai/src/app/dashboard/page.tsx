"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Activity, TrendingDown, PiggyBank, Brain, AlertTriangle, CheckCircle,
  Battery, Sun, Home, Play, RotateCcw, Gauge, Shield, Clock, Cpu, Sparkles
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import WalkthroughTour from "@/components/WalkthroughTour";

const chartData = [
  { time: "6AM",  actual: 1.2, optimized: 1.2 },
  { time: "8AM",  actual: 1.8, optimized: 1.6 },
  { time: "10AM", actual: 2.1, optimized: 1.7 },
  { time: "12PM", actual: 2.5, optimized: 1.9 },
  { time: "2PM",  actual: 2.8, optimized: 2.0 },
  { time: "4PM",  actual: 3.2, optimized: 2.1 },
  { time: "5PM",  actual: 3.8, optimized: 2.3, peak: true },
  { time: "6PM",  actual: 4.1, optimized: 2.4, peak: true },
  { time: "7PM",  actual: 3.9, optimized: 2.2, peak: true },
  { time: "8PM",  actual: 3.5, optimized: 2.0, peak: true },
  { time: "9PM",  actual: 2.8, optimized: 1.8 },
  { time: "10PM", actual: 2.0, optimized: 1.5 },
  { time: "11PM", actual: 1.4, optimized: 1.2 },
];

const baseAlerts = [
  { text: "Grid stable — off-peak tariff active", type: "success" },
  { text: "Solar generation: 1.2 kW",             type: "info" },
  { text: "Battery at 72% — charging from solar", type: "info" },
];

const scenarios = [
  {
    id: "evening",
    name: "Evening Peak Rush",
    city: "Lahore",
    tariff: "PKR 58/unit",
    startLoad: 2.1,
    spikeLoad: 3.8,
    finalLoad: 2.4,
    outageRisk: 78,
    solar: 1.2,
    battery: 72,
    finalSaving: 6550,
    focus: "AC eco mode + pump shift + phantom kill",
  },
  {
    id: "blackout",
    name: "Blackout Guardian",
    city: "Karachi",
    tariff: "PKR 60/unit",
    startLoad: 2.4,
    spikeLoad: 3.4,
    finalLoad: 2.0,
    outageRisk: 91,
    solar: 0.7,
    battery: 58,
    finalSaving: 7200,
    focus: "Battery reserve + essential load isolation",
  },
  {
    id: "phantom",
    name: "Night Phantom Hunt",
    city: "Islamabad",
    tariff: "PKR 52/unit",
    startLoad: 1.5,
    spikeLoad: 2.7,
    finalLoad: 1.4,
    outageRisk: 34,
    solar: 0.0,
    battery: 82,
    finalSaving: 4850,
    focus: "Standby detection + sleep-cycle AC tuning",
  },
] as const;

const actionPlaybook = [
  "Forecast tariff and outage window",
  "Classify essential vs delayable loads",
  "Apply AC eco setpoint during peak hours",
  "Move pump and laundry to off-peak schedule",
  "Open relays for standby sockets",
  "Reserve battery for lights, fan, router, fridge",
];

type ScenarioId = typeof scenarios[number]["id"];
type DemoStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// Animated count-up component
function AnimatedValue({ value, prefix = "", suffix = "" }: { value: number | string; prefix?: string; suffix?: string }) {
  const prev = useRef(value);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      setKey((k) => k + 1);
    }
  }, [value]);

  return (
    <motion.span
      key={key}
      initial={{ y: 8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {prefix}{typeof value === "number" ? value.toLocaleString() : value}{suffix}
    </motion.span>
  );
}

export default function DashboardPage() {
  const [demoStep, setDemoStep] = useState<DemoStep>(0);
  const [running, setRunning] = useState(false);
  const [load, setLoad] = useState(2.1);
  const [consumption, setConsumption] = useState(14.6);
  const [savedToday, setSavedToday] = useState(0);
  const [savedMonthly, setSavedMonthly] = useState(0);
  const [phantomW, setPhantomW] = useState(143);
  const [outageRisk, setOutageRisk] = useState(12);
  const [alertsList, setAlertsList] = useState(baseAlerts);
  const [showDecision, setShowDecision] = useState(false);
  const [scenarioId, setScenarioId] = useState<ScenarioId>("evening");
  const [activeActions, setActiveActions] = useState<string[]>([]);
  const [batteryReserve, setBatteryReserve] = useState(72);
  const [automationScore, setAutomationScore] = useState(42);

  const scenario = scenarios.find((s) => s.id === scenarioId) || scenarios[0];

  const addAlert = useCallback((text: string, type: string) => {
    setAlertsList((prev) => [{ text, type }, ...prev].slice(0, 8));
  }, []);

  const runDemo = useCallback(async () => {
    setRunning(true);
    setDemoStep(0);
    setLoad(scenario.startLoad);
    setSavedToday(0); setSavedMonthly(0); setPhantomW(143);
    setConsumption(14.6); setOutageRisk(12); setShowDecision(false);
    setBatteryReserve(scenario.battery); setAutomationScore(42); setActiveActions([]);
    setAlertsList([
      { text: `${scenario.name} loaded for ${scenario.city}`, type: "info" },
      { text: `Tariff signal: ${scenario.tariff}`, type: "warning" },
      ...baseAlerts,
    ]);

    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

    // Step 1
    await wait(500);
    setDemoStep(1);
    setLoad(scenario.spikeLoad);
    setConsumption((p) => Number((p + 1.1).toFixed(1)));
    setActiveActions((p) => [...p, actionPlaybook[0]]);
    addAlert(`⚡ High load detected — ${scenario.spikeLoad.toFixed(1)} kW`, "warning");
    await wait(2000);

    // Step 2
    setDemoStep(2);
    setAutomationScore(58);
    setActiveActions((p) => [...p, actionPlaybook[1]]);
    addAlert("🧠 PakGrid AI analyzing tariff, outage risk, occupancy, and appliance priority...", "info");
    await wait(2200);

    // Step 3
    setDemoStep(3);
    setShowDecision(true);
    setAutomationScore(68);
    setActiveActions((p) => [...p, actionPlaybook[3]]);
    addAlert("✅ AI Decision: Shift water pump to 10:42 PM", "success");
    setSavedMonthly(480);
    await wait(2500);

    // Step 4
    setDemoStep(4);
    setLoad(Number(Math.max(scenario.finalLoad + 0.6, scenario.startLoad).toFixed(1)));
    addAlert("❄️ Bedroom AC switched to Eco Mode", "success");
    setActiveActions((p) => [...p, actionPlaybook[2]]);
    setAutomationScore(76);
    setSavedToday((p) => p + 127);
    setSavedMonthly((p) => p + 650);
    await wait(2000);

    // Step 5
    setDemoStep(5);
    addAlert("👻 Phantom standby load detected: 143W", "warning");
    await wait(2000);

    // Step 6
    setDemoStep(6);
    for (let w = 143; w >= 0; w -= 7) { setPhantomW(w); await wait(45); }
    addAlert("✅ Phantom load eliminated — 143W saved", "success");
    setActiveActions((p) => [...p, actionPlaybook[4]]);
    setAutomationScore(86);
    setSavedMonthly((p) => p + 1050);
    setSavedToday((p) => p + 85);
    await wait(1500);

    // Step 7
    setDemoStep(7);
    setOutageRisk(scenario.outageRisk);
    setBatteryReserve((p) => Math.max(45, p - 8));
    addAlert(
      `⚠️ Outage risk: ${scenario.outageRisk}% — ${scenario.outageRisk > 60 ? "HIGH" : "MEDIUM"}`,
      scenario.outageRisk > 60 ? "danger" : "warning"
    );
    await wait(2000);

    // Step 8
    setDemoStep(8);
    setLoad(scenario.finalLoad);
    setBatteryReserve((p) => Math.min(96, p + 15));
    setAutomationScore(96);
    setActiveActions((p) => [...p, actionPlaybook[5]]);
    addAlert("🔋 Battery protection activated — essential loads secured", "success");
    addAlert(`💰 Total projected monthly saving: Rs. ${scenario.finalSaving.toLocaleString()}`, "success");
    setSavedMonthly(scenario.finalSaving);
    setSavedToday(Math.round(scenario.finalSaving / 5.2));
    await wait(1000);
    setRunning(false);
  }, [addAlert, scenario]);

  const resetDemo = () => {
    setDemoStep(0); setRunning(false); setLoad(scenario.startLoad);
    setConsumption(14.6); setSavedToday(0); setSavedMonthly(0);
    setPhantomW(143); setOutageRisk(12); setShowDecision(false);
    setAlertsList(baseAlerts); setActiveActions([]);
    setBatteryReserve(scenario.battery); setAutomationScore(42);
  };

  const loadColor = load > 3.5 ? "text-warning" : "text-main";
  const loadBg    = demoStep >= 1 && demoStep <= 3 ? "border-warning/40" : "border-orange-electric/10";

  return (
    <div className="pt-20 pb-16 px-4 max-w-7xl mx-auto min-h-screen">

      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="live-dot" />
            <span className="text-xs text-green-savings font-medium">AI Optimizing</span>
          </div>
          <h1 className="font-heading text-3xl font-bold">AI Control Room</h1>
          <p className="text-muted text-sm">Autonomous tariff, outage, and appliance optimization</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={runDemo}
            disabled={running}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {running
              ? <><span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Running...</>
              : <><Play size={15} /> Run AI Optimization Demo</>
            }
          </button>
          <button onClick={resetDemo} className="btn-secondary inline-flex items-center gap-2 px-4" title="Reset">
            <RotateCcw size={15} />
          </button>
          <button
            onClick={() => {
              try { localStorage.removeItem("pakgrid_tour_done"); } catch { /* ignore */ }
              const fn = (window as unknown as Record<string, unknown>).__pakgridStartTour;
              if (typeof fn === "function") fn();
            }}
            className="btn-secondary inline-flex items-center gap-2 px-4 text-xs"
            title="Replay guided tour"
          >
            <Sparkles size={13} /> Tour
          </button>
        </div>
      </div>

      {/* Scenario Selector */}
      <div data-tour="scenarios" className="grid md:grid-cols-3 gap-3 mb-8">
        {scenarios.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (!running) {
                setScenarioId(item.id);
                setLoad(item.startLoad);
                setBatteryReserve(item.battery);
                setSavedMonthly(0); setSavedToday(0); setOutageRisk(12);
                setActiveActions([]); setAutomationScore(42);
                setAlertsList([{ text: `${item.name} scenario selected`, type: "info" }, ...baseAlerts]);
              }
            }}
            disabled={running}
            className={`glass-card text-left p-4 transition-all duration-300 disabled:opacity-50 ${
              scenarioId === item.id
                ? "border-orange-electric/60 glow-orange bg-orange-electric/5"
                : "hover:-translate-y-0.5 hover:border-orange-electric/25"
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-heading font-semibold text-sm">{item.name}</span>
              <span className="badge-ai text-[10px] px-2 py-0.5 rounded-full">{item.city}</span>
            </div>
            <p className="text-muted text-xs mt-1 leading-relaxed">{item.focus}</p>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-warning font-mono-num">{item.tariff}</span>
              <span className="text-green-savings font-mono-num font-medium">Rs. {item.finalSaving.toLocaleString()}/mo</span>
            </div>
            {scenarioId === item.id && (
              <motion.div layoutId="scenario-indicator" className="mt-2 h-0.5 bg-gradient-to-r from-orange-electric to-transparent rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Metric Cards */}
      <div data-tour="metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard icon={Zap}       label="Current Load"   value={`${load.toFixed(1)} kW`}              color={loadColor}       bg={loadBg} alert={demoStep === 1} />
        <MetricCard icon={Gauge}     label="AI Autonomy"    value={`${automationScore}%`}                color="text-ai"         sub={`${scenario.city} profile`} />
        <MetricCard icon={TrendingDown} label="Today's Saving" value={`Rs. ${savedToday.toLocaleString()}`} color="text-green-savings" glow={savedToday > 0} />
        <MetricCard icon={PiggyBank} label="Monthly Saving" value={`Rs. ${savedMonthly.toLocaleString()}`} color="text-green-savings" glow={savedMonthly > 500} sub="Projected / Demo" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Center: Chart + Energy Flow + Phantom */}
        <div className="lg:col-span-2 space-y-6">

          {/* Consumption Chart */}
          <div data-tour="chart" className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold">Actual vs AI Optimized</h3>
              <div className="flex gap-2 text-xs">
                <span className="chip">Today</span>
                <span className="text-muted px-2 py-1">Week</span>
                <span className="text-muted px-2 py-1">Month</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="actual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="opt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#16F08B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16F08B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" stroke="#555" fontSize={11} tick={{ fill: "#666" }} />
                <YAxis stroke="#555" fontSize={11} unit=" kW" tick={{ fill: "#666" }} />
                <Tooltip
                  contentStyle={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#F8FAFC", fontWeight: 600 }}
                />
                <ReferenceLine x="5PM" stroke="rgba(245,158,11,0.3)" strokeDasharray="4 4" label={{ value: "Peak", fill: "#F59E0B", fontSize: 10 }} />
                <ReferenceLine x="9PM" stroke="rgba(245,158,11,0.3)" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="actual"    stroke="#EF4444" fill="url(#actual)" strokeWidth={2} name="Actual" />
                <Area type="monotone" dataKey="optimized" stroke="#16F08B" fill="url(#opt)"    strokeWidth={2} name="AI Optimized" />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-3 text-xs text-muted">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-danger inline-block rounded" /> Actual Usage</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-green-savings inline-block rounded" /> AI Optimized</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-warning/15 inline-block rounded border border-warning/30" /> Peak Hours (5–9 PM)</span>
            </div>
          </div>

          {/* Energy Flow */}
          <div className="glass-card p-5">
            <h3 className="font-heading font-semibold mb-4">Energy Flow</h3>
            <div className="flex flex-wrap items-center justify-center gap-3 py-3">
              {[
                { icon: Zap,     label: "Grid",    sub: "2.1 kW",                                                                                    color: "text-warning" },
                null,
                { icon: Sun,     label: "Solar",   sub: `${scenario.solar.toFixed(1)} kW`,                                                           color: "text-orange-golden" },
                null,
                { icon: Battery, label: "Battery", sub: demoStep >= 8 ? "Protected" : `${batteryReserve}%`, color: demoStep >= 8 ? "text-green-savings" : "text-ai" },
                null,
                { icon: Home,    label: "Home",    sub: `${load.toFixed(1)} kW`,                                                                     color: loadColor },
              ].map((item, i) =>
                item === null ? (
                  <svg key={i} width="36" height="10">
                    <line x1="0" y1="5" x2="36" y2="5" stroke="#FF8A00" strokeWidth="2" className="energy-line" opacity="0.5" />
                  </svg>
                ) : (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <motion.div
                      className="w-12 h-12 rounded-xl glass-card flex items-center justify-center"
                      whileHover={{ scale: 1.1 }}
                    >
                      <item.icon size={20} className={item.color} />
                    </motion.div>
                    <span className="text-[10px] text-muted">{item.label}</span>
                    <span className={`text-xs font-mono-num font-medium ${item.color}`}>{item.sub}</span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Phantom Load */}
          <div className={`glass-card p-5 transition-all duration-500 ${
            demoStep >= 5 ? (demoStep >= 6 ? "border-green-savings/35 glow-green" : "border-danger/35 glow-red") : ""
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-semibold">Phantom Load Detector</h3>
                <p className="text-muted text-xs">Standby power waste from idle devices</p>
              </div>
              <div className="text-right">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={phantomW}
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`font-mono-num text-3xl font-bold block ${phantomW > 0 ? "text-danger" : "text-green-savings"}`}
                  >
                    {phantomW}W
                  </motion.span>
                </AnimatePresence>
                <p className="text-muted text-xs">Monthly waste: Rs. {(phantomW * 7.3).toFixed(0)}</p>
              </div>
            </div>
            {/* Phantom bar */}
            <div className="mt-4 w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full transition-colors duration-500 ${phantomW > 0 ? "bg-danger" : "bg-green-savings"}`}
                animate={{ width: `${(phantomW / 143) * 100}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            {demoStep >= 6 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="mt-3 flex items-center gap-2 text-green-savings text-sm font-medium"
              >
                <CheckCircle size={15} /> Phantom Load Eliminated — Rs. 1,050/month saved
              </motion.div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-5">

          {/* AI Status */}
          <div data-tour="ai-status" className={`glass-card p-5 transition-all duration-300 ${running ? "border-orange-electric/50 glow-orange" : ""} ${running ? "agent-scan" : ""}`}>
            <div className="flex items-center gap-3 mb-3">
              <motion.div
                className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-electric to-orange-deep flex items-center justify-center"
                animate={running ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Brain size={20} className="text-white" />
              </motion.div>
              <div>
                <h3 className="font-heading font-semibold text-sm">PakGrid AI</h3>
                <p className={`text-xs ${running ? "text-orange-electric" : "text-green-savings"}`}>
                  {running ? "Analyzing..." : "Actively optimizing"}
                </p>
              </div>
              {running && <Sparkles size={14} className="text-orange-electric ml-auto animate-pulse" />}
            </div>
            {demoStep === 2 && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-ai bg-ai/10 rounded-btn p-2 mb-3">
                Analyzing tariff, load, occupancy and appliance priority...
              </motion.p>
            )}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/5 rounded-btn p-2">
                <span className="text-muted block">Decisions</span>
                <span className="font-mono-num font-bold">{demoStep >= 8 ? 4 : demoStep >= 3 ? 1 : 0}</span>
              </div>
              <div className="bg-white/5 rounded-btn p-2">
                <span className="text-muted block">Optimized</span>
                <span className="font-mono-num font-bold">{demoStep >= 4 ? 2 : 0}</span>
              </div>
              <div className="bg-white/5 rounded-btn p-2">
                <span className="text-muted block">Energy Saved</span>
                <span className="font-mono-num font-bold text-green-savings">{demoStep >= 6 ? "2.4 kWh" : "0"}</span>
              </div>
              <div className="bg-white/5 rounded-btn p-2">
                <span className="text-muted block">Outage Risk</span>
                <span className={`font-mono-num font-bold ${outageRisk > 50 ? "text-danger" : outageRisk > 25 ? "text-warning" : "text-green-savings"}`}>
                  {outageRisk}%
                </span>
              </div>
            </div>
            {/* Automation Score Bar */}
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-muted mb-1">
                <span>Automation Score</span>
                <span className="text-orange-electric font-mono-num">{automationScore}%</span>
              </div>
              <div className="confidence-bar">
                <motion.div className="confidence-fill" animate={{ width: `${automationScore}%` }} />
              </div>
            </div>
          </div>

          {/* Autopilot Stack */}
          <div data-tour="autopilot" className={`glass-card p-5 ${running ? "agent-scan" : ""}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Cpu size={14} className="text-orange-electric" />
                <h3 className="font-heading text-sm font-semibold">Autopilot Stack</h3>
              </div>
              <span className="font-mono-num text-xs text-ai">{automationScore}%</span>
            </div>
            <div className="space-y-1.5">
              {actionPlaybook.map((action, i) => {
                const complete = activeActions.includes(action);
                const current  = running && activeActions.length === i;
                return (
                  <motion.div
                    key={action}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`flex items-center gap-2 rounded-btn px-3 py-2 text-xs transition-all ${
                      complete ? "bg-green-savings/10 text-green-savings" :
                      current  ? "bg-ai/10 text-ai border border-ai/20" :
                                 "bg-white/5 text-muted"
                    }`}
                  >
                    {complete ? <CheckCircle size={12} /> : current ? <Clock size={12} className="animate-pulse" /> : <Shield size={12} />}
                    <span>{action}</span>
                    {current && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-ai animate-pulse" />}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* AI Decision Card */}
          <AnimatePresence>
            {showDecision && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass-card p-4 border-orange-electric/40 border-glow-anim"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Brain size={14} className="text-orange-electric" />
                  <span className="text-xs font-medium text-orange-electric">AI Decision</span>
                  <span className="ml-auto text-[10px] text-green-savings bg-green-savings/10 px-2 py-0.5 rounded-full">91% confidence</span>
                </div>
                <p className="text-sm mb-1.5">Peak load approaching. Shift water pump to <strong>10:42 PM</strong>.</p>
                <p className="text-green-savings text-xs font-mono-num font-medium mb-3">Est. saving: Rs. 480/month</p>
                <div className="flex gap-2">
                  <button className="flex-1 text-xs py-1.5 rounded-btn bg-green-savings/15 text-green-savings border border-green-savings/30 hover:bg-green-savings/25 transition-colors">Accept</button>
                  <button className="flex-1 text-xs py-1.5 rounded-btn bg-white/5 text-muted border border-white/10 hover:bg-white/10 transition-colors">Reject</button>
                  <button className="flex-1 text-xs py-1.5 rounded-btn bg-orange-electric/15 text-orange-electric border border-orange-electric/30 hover:bg-orange-electric/25 transition-colors">Automate</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Outage Risk */}
          <div className={`glass-card p-4 transition-all duration-500 ${outageRisk > 50 ? "border-danger/40 glow-red" : ""}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading text-sm font-semibold">Outage Risk</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${outageRisk > 50 ? "badge-danger" : outageRisk > 25 ? "badge-warning" : "badge-success"}`}>
                {outageRisk > 50 ? "HIGH" : outageRisk > 25 ? "MEDIUM" : "LOW"}
              </span>
            </div>
            <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${outageRisk > 50 ? "bg-danger" : outageRisk > 25 ? "bg-warning" : "bg-green-savings"}`}
                animate={{ width: `${outageRisk}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
            <p className="text-xs text-muted mt-2">
              {outageRisk > 50 ? "Battery protection active — essential loads secured" : "Grid stable — no outage predicted"}
            </p>
          </div>

          {/* Live Alerts */}
          <div data-tour="alerts" className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="live-dot" />
              <h3 className="font-heading text-sm font-semibold">Live Alerts</h3>
            </div>
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              <AnimatePresence>
                {alertsList.map((a, i) => (
                  <motion.div
                    key={a.text + i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-start gap-2 text-xs rounded-btn px-2 py-1.5 ${
                      a.type === "success" ? "alert-success" :
                      a.type === "warning" ? "alert-warning" :
                      a.type === "danger"  ? "alert-danger"  : "alert-info"
                    }`}
                  >
                    {a.type === "success" ? <CheckCircle size={11} className="text-green-savings mt-0.5 shrink-0" /> :
                     a.type === "warning" ? <AlertTriangle size={11} className="text-warning mt-0.5 shrink-0" /> :
                     a.type === "danger"  ? <AlertTriangle size={11} className="text-danger mt-0.5 shrink-0" /> :
                     <Activity size={11} className="text-ai mt-0.5 shrink-0" />}
                    <span className="text-muted leading-relaxed">{a.text}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Guided walkthrough overlay */}
      <WalkthroughTour />
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color, bg, glow, alert, sub }: {
  icon: React.ElementType; label: string; value: string; color: string;
  bg?: string; glow?: boolean; alert?: boolean; sub?: string;
}) {
  return (
    <motion.div
      layout
      className={`glass-card p-4 transition-all duration-300 hover-lift ${bg || ""} ${glow ? "glow-green" : ""} ${alert ? "glow-amber" : ""}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={color} />
        <span className="text-muted text-xs">{label}</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.span
          key={value}
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -8, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={`font-mono-num text-2xl font-bold ${color} block`}
        >
          {value}
        </motion.span>
      </AnimatePresence>
      {sub && <p className="text-[10px] text-muted mt-1">{sub}</p>}
    </motion.div>
  );
}
