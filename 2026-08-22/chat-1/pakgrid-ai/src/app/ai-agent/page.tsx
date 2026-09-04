"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Zap, Snowflake, Tv, Droplets, Wind, Refrigerator, Ghost,
  CheckCircle, XCircle, RotateCcw, Clock, Power, Sparkles, TrendingDown, MessageSquare, Loader2, Send
} from "lucide-react";

const appliances = [
  { id: "ac",     name: "Bedroom AC",     icon: Snowflake,   watts: 1420, status: "ON",        mode: "Eco Mode",     priority: "Medium",    cost: 430, color: "from-blue-400 to-cyan-300",         saving: 650 },
  { id: "fridge", name: "Refrigerator",   icon: Refrigerator,watts: 180,  status: "ON",        mode: "Protected",    priority: "Essential", cost: 86,  color: "from-green-savings to-green-success",saving: 0 },
  { id: "fan",    name: "Ceiling Fan",    icon: Wind,        watts: 70,   status: "ON",        mode: "Normal",       priority: "Essential", cost: 34,  color: "from-ai to-blue-300",               saving: 0 },
  { id: "tv",     name: "LED TV",         icon: Tv,          watts: 40,   status: "Standby",   mode: "Phantom Risk", priority: "Low",       cost: 19,  color: "from-danger to-orange-deep",         saving: 320 },
  { id: "pump",   name: "Water Pump",     icon: Droplets,    watts: 0,    status: "Scheduled", mode: "Off-Peak",     priority: "Medium",    cost: 0,   color: "from-ai to-orange-electric",         saving: 480 },
];

const decisions = [
  { time: "08:10 PM", text: "AC switched to Eco Mode",          saving: "Rs. 650/month projected",    icon: Snowflake,   color: "text-ai" },
  { time: "08:15 PM", text: "Water pump shifted to 10:42 PM",   saving: "Rs. 480/month projected",    icon: Droplets,    color: "text-blue-400" },
  { time: "08:20 PM", text: "Phantom load removed",             saving: "Rs. 1,050/month projected",  icon: Ghost,       color: "text-danger" },
  { time: "08:25 PM", text: "Battery protection activated",     saving: "Backup extended 1.8 hours",  icon: Zap,         color: "text-orange-electric" },
];

const chips = [
  { label: "Load: 3.8 kW",       active: true  },
  { label: "Tariff: Peak",       active: true  },
  { label: "Weather: 38°C",      active: true  },
  { label: "Occupancy: Medium",  active: true  },
  { label: "Battery: 64%",       active: true  },
  { label: "Solar: Low",         active: false },
  { label: "Priority: AC > Pump",active: true  },
];

export default function AIAgentPage() {
  const [phantomKilled, setPhantomKilled] = useState(false);
  const [phantomW, setPhantomW] = useState(143);
  const [killing, setKilling] = useState(false);
  const [applianceStates, setApplianceStates] = useState<Record<string, boolean>>({
    ac: true, fridge: true, fan: true, tv: true, pump: false,
  });

  // AI API integration state
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [userQuestion, setUserQuestion] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [recommendationStatus, setRecommendationStatus] = useState<"pending" | "accepted" | "rejected" | "automated">("pending");
  const [decisionTimeline, setDecisionTimeline] = useState(decisions);

  const handleAccept = () => {
    setRecommendationStatus("accepted");
    setApplianceStates((p) => ({ ...p, pump: false }));
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setDecisionTimeline((prev) => [
      {
        time: now,
        text: "Water pump shifted to 10:42 PM (Accepted by User)",
        saving: "Rs. 480/month saved",
        icon: Droplets,
        color: "text-green-savings",
      },
      ...prev,
    ]);
  };

  const handleReject = () => {
    setRecommendationStatus("rejected");
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setDecisionTimeline((prev) => [
      {
        time: now,
        text: "Water pump recommendation dismissed",
        saving: "Manual schedule active",
        icon: XCircle,
        color: "text-muted",
      },
      ...prev,
    ]);
  };

  const handleAutomate = () => {
    setRecommendationStatus("automated");
    setApplianceStates((p) => ({ ...p, pump: false, ac: true }));
    if (!phantomKilled) {
      killPhantom();
    }
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setDecisionTimeline((prev) => [
      {
        time: now,
        text: "Autonomous AI optimization active (Pump shifted + Phantom eliminated)",
        saving: "Rs. 1,530/month saved",
        icon: Brain,
        color: "text-orange-electric",
      },
      ...prev,
    ]);
  };

  const handleResetRecommendation = () => {
    setRecommendationStatus("pending");
  };

  const killPhantom = async () => {
    setKilling(true);
    for (let w = 143; w >= 0; w -= 4) {
      setPhantomW(Math.max(0, w));
      await new Promise((r) => setTimeout(r, 35));
    }
    setPhantomKilled(true);
    setKilling(false);
    setApplianceStates((p) => ({ ...p, tv: false }));
  };

  const toggleAppliance = (id: string) => {
    setApplianceStates((p) => ({ ...p, [id]: !p[id] }));
  };

  const totalSavings = appliances.reduce((s, a) => s + a.saving, 0);

  /** Trigger AI-powered energy analysis via the backend Qwen API */
  const analyzeEnergy = async () => {
    setAiLoading(true);
    setAiError("");
    const context = appliances
      .map((a) => `${a.name}: ${a.watts}W, Status: ${applianceStates[a.id] ? "ON" : "OFF"}, Mode: ${a.mode}, Priority: ${a.priority}, Daily cost: Rs. ${a.cost}`)
      .join("\n");
    try {
      const res = await fetch("/api/ai-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message:
            "Analyze the current energy usage of this Pakistani home and provide 3-4 actionable recommendations to reduce the electricity bill. Mention specific appliances, time windows, and PKR savings.",
          applianceContext: context,
          history: chatMessages,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details || "API request failed");
      setAiAnalysis(data.content);
      setChatMessages((p) => [
        ...p,
        { role: "user", content: "Analyze current energy usage and provide recommendations." },
        { role: "assistant", content: data.content },
      ]);
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : "Failed to connect to AI service");
    } finally {
      setAiLoading(false);
    }
  };

  /** Send a follow-up question to the AI */
  const askFollowUp = async () => {
    if (!userQuestion.trim() || aiLoading) return;
    const q = userQuestion.trim();
    setUserQuestion("");
    setChatMessages((p) => [...p, { role: "user", content: q }]);
    setAiLoading(true);
    setAiError("");
    try {
      const res = await fetch("/api/ai-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, history: chatMessages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details || "API request failed");
      setAiAnalysis(data.content);
      setChatMessages((p) => [...p, { role: "assistant", content: data.content }]);
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : "Failed to connect to AI service");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="pt-20 pb-16 px-4 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="live-dot" />
            <span className="text-xs text-green-savings font-medium">Agent Active</span>
          </div>
          <h1 className="font-heading text-3xl font-bold">AI Agent & Appliances</h1>
          <p className="text-muted text-sm">Explainable AI decisions with real-time appliance control</p>
        </div>
        <div className="glass-card px-4 py-3 text-right">
          <p className="text-[10px] text-muted">Projected Monthly Saving</p>
          <p className="font-mono-num text-xl font-bold text-green-savings">Rs. {totalSavings.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: AI Recommendation + Chips + Appliances */}
        <div className="lg:col-span-2 space-y-6">

          {/* AI Recommendation */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 border-orange-electric/25 border-glow-anim"
          >
            <div className="flex items-center gap-2 mb-4">
              <motion.div
                className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-electric to-orange-deep flex items-center justify-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Brain size={16} className="text-white" />
              </motion.div>
              <h3 className="font-heading font-semibold">Active AI Recommendation</h3>
              <span className="ml-auto chip text-[10px]">
                <Sparkles size={9} /> 91% confidence
              </span>
            </div>

            <div className="bg-bg-surface rounded-card p-4 mb-4 border border-white/5">
              <p className="text-lg font-medium mb-3">
                Peak load approaching. Move water pump to{" "}
                <strong className="text-orange-electric">10:42 PM</strong>.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-muted mb-3">
                {[
                  { label: "Load",       val: "3.8 kW",  color: "text-warning" },
                  { label: "Tariff",     val: "Peak",    color: "text-danger" },
                  { label: "Occupancy",  val: "Medium",  color: "text-main" },
                  { label: "Battery",    val: "64%",     color: "text-ai" },
                  { label: "Solar",      val: "Low",     color: "text-muted" },
                  { label: "Confidence", val: "91%",     color: "text-green-savings" },
                ].map((item) => (
                  <div key={item.label}>
                    <span className="text-muted">{item.label}: </span>
                    <strong className={item.color}>{item.val}</strong>
                  </div>
                ))}
              </div>

              {/* Confidence bar */}
              <div className="confidence-bar mb-1">
                <motion.div
                  className="confidence-fill"
                  initial={{ width: 0 }}
                  animate={{ width: "91%" }}
                  transition={{ duration: 1.2, delay: 0.3 }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted">
                <span>AI Confidence</span><span className="text-green-savings font-mono-num">91%</span>
              </div>
              <p className="text-green-savings font-mono-num font-medium mt-3">Estimated saving: Rs. 480/month</p>
            </div>

            {recommendationStatus === "pending" ? (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleAccept}
                  className="btn-primary text-sm py-2 px-5 inline-flex items-center gap-1.5"
                >
                  <CheckCircle size={15} /> Accept
                </button>
                <button
                  onClick={handleReject}
                  className="btn-secondary text-sm py-2 px-5 inline-flex items-center gap-1.5"
                >
                  <XCircle size={15} /> Reject
                </button>
                <button
                  onClick={handleAutomate}
                  className="text-sm py-2 px-5 rounded-btn bg-orange-electric/15 text-orange-electric border border-orange-electric/30 font-medium hover:bg-orange-electric/25 transition-all inline-flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,138,0,0.15)]"
                >
                  <Sparkles size={14} /> Automate
                </button>
              </div>
            ) : recommendationStatus === "accepted" ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-card bg-green-savings/10 border border-green-savings/25"
              >
                <div className="flex items-center gap-2 text-sm text-green-savings font-medium">
                  <CheckCircle size={16} />
                  <span>Recommendation accepted — Water pump shifted to off-peak 10:42 PM</span>
                </div>
                <button
                  onClick={handleResetRecommendation}
                  className="text-xs px-3 py-1 rounded-btn bg-white/5 text-muted hover:text-main transition-colors inline-flex items-center gap-1"
                >
                  <RotateCcw size={11} /> Reset
                </button>
              </motion.div>
            ) : recommendationStatus === "rejected" ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-card bg-white/5 border border-white/10"
              >
                <div className="flex items-center gap-2 text-sm text-muted">
                  <XCircle size={16} className="text-danger" />
                  <span>Recommendation dismissed — Manual control active</span>
                </div>
                <button
                  onClick={handleResetRecommendation}
                  className="text-xs px-3 py-1 rounded-btn bg-white/5 text-muted hover:text-main transition-colors inline-flex items-center gap-1"
                >
                  <RotateCcw size={11} /> Re-evaluate
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-card bg-orange-electric/10 border border-orange-electric/30 glow-orange"
              >
                <div className="flex items-center gap-2 text-sm text-orange-electric font-semibold">
                  <Brain size={16} className="animate-pulse" />
                  <span>Autonomous AI Agent Active — Auto-optimizing peak tariff & phantom load</span>
                </div>
                <button
                  onClick={handleResetRecommendation}
                  className="text-xs px-3 py-1 rounded-btn bg-orange-electric/20 text-orange-electric hover:bg-orange-electric/30 transition-colors inline-flex items-center gap-1"
                >
                  <RotateCcw size={11} /> Pause Auto
                </button>
              </motion.div>
            )}
          </motion.div>

          {/* AI Reasoning Chips */}
          <div className="glass-card p-5">
            <h3 className="font-heading font-semibold text-sm mb-3">AI Reasoning Factors</h3>
            <div className="flex flex-wrap gap-2">
              {chips.map((c, i) => (
                <motion.span
                  key={c.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.07, type: "spring", stiffness: 300 }}
                  className={`chip ${
                    c.active
                      ? "border-orange-electric/45 bg-orange-electric/10 text-orange-electric"
                      : "border-white/8 bg-white/5 text-muted"
                  }`}
                >
                  {c.label}
                </motion.span>
              ))}
            </div>
          </div>

          {/* ── AI-POWERED ANALYSIS (Qwen via Alibaba Cloud) ── */}
          <div className="glass-card p-5 border-ai/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold flex items-center gap-2">
                <MessageSquare size={18} className="text-ai" />
                AI-Powered Analysis
              </h3>
              <span className="chip text-[10px]">
                <Sparkles size={9} /> Powered by Qwen
              </span>
            </div>

            {/* Trigger buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={analyzeEnergy}
                disabled={aiLoading}
                className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {aiLoading ? (
                  <><Loader2 size={13} className="animate-spin" /> Analyzing...</>
                ) : (
                  <><Brain size={13} /> Analyze with AI</>
                )}
              </button>
            </div>

            {/* Error */}
            {aiError && (
              <div className="mb-4 p-3 rounded-card bg-danger/10 border border-danger/30 text-danger text-xs flex items-start gap-2">
                <Zap size={13} className="shrink-0 mt-0.5" />
                <span>{aiError}</span>
              </div>
            )}

            {/* Quick ask buttons */}
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                "How can I reduce AC costs during peak hours?",
                "What appliances waste the most standby power?",
                "Best time to run the water pump?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => { setUserQuestion(q); }}
                  disabled={aiLoading}
                  className="text-[11px] px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-muted hover:text-orange-electric hover:border-orange-electric/30 transition-colors disabled:opacity-40"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && askFollowUp()}
                placeholder="Ask PakGrid AI anything about energy optimization..."
                className="input-field text-xs flex-1"
                disabled={aiLoading}
              />
              <button
                onClick={askFollowUp}
                disabled={aiLoading || !userQuestion.trim()}
                className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                aria-label="Send question"
              >
                {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              </button>
            </div>

            {/* AI Response */}
            {aiAnalysis && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-bg-surface rounded-card p-4 border border-ai/20"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Brain size={14} className="text-ai" />
                  <span className="text-xs font-semibold text-ai">PakGrid AI Response</span>
                </div>
                <div className="text-sm text-main/90 leading-relaxed whitespace-pre-wrap">
                  {aiAnalysis}
                </div>
              </motion.div>
            )}

            {/* Chat history */}
            {chatMessages.filter((m) => m.role === "user").length > 1 && (
              <div className="mt-3 border-t border-white/5 pt-3">
                <p className="text-[10px] text-muted mb-2">
                  Conversation history ({chatMessages.filter((m) => m.role === "user").length} messages)
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {chatMessages.slice(0, -2).map((msg, i) => (
                    <div key={i} className={`text-xs p-2 rounded-btn ${
                      msg.role === "user" ? "bg-orange-electric/10 text-orange-electric" : "bg-white/5 text-muted"
                    }`}>
                      <span className="font-semibold text-[10px] block mb-0.5">
                        {msg.role === "user" ? "You" : "PakGrid AI"}
                      </span>
                      {msg.content.slice(0, 120)}{msg.content.length > 120 ? "..." : ""}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Appliance Control */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold">Appliance Control</h3>
              <span className="text-xs text-muted">{appliances.filter((a) => applianceStates[a.id]).length} active</span>
            </div>
            <div className="space-y-2">
              {appliances.map((a, i) => {
                const isOn = applianceStates[a.id];
                return (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={`flex items-center gap-4 p-3 rounded-card transition-all ${
                      isOn ? "bg-bg-surface hover:bg-bg-panel" : "bg-white/3 opacity-60"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center opacity-${isOn ? "90" : "40"} transition-opacity`}>
                      <a.icon size={18} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{a.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          a.mode === "Eco Mode"     ? "badge-ai" :
                          a.mode === "Protected"    ? "badge-success" :
                          a.mode === "Phantom Risk" ? "badge-danger" :
                          a.mode === "Off-Peak"     ? "badge-warning" : "badge-success"
                        }`}>{a.mode}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted mt-0.5">
                        <span className="font-mono-num">{a.watts > 0 ? `${(a.watts / 1000).toFixed(2)} kW` : "Scheduled"}</span>
                        <span>Priority: {a.priority}</span>
                        {a.cost > 0 && <span className="font-mono-num">Rs. {a.cost}/day</span>}
                        {a.saving > 0 && <span className="text-green-savings font-mono-num">-Rs. {a.saving}/mo</span>}
                      </div>
                    </div>
                    {/* Toggle */}
                    <button
                      onClick={() => toggleAppliance(a.id)}
                      className={`toggle-track ${isOn ? "on" : "off"} shrink-0`}
                      title={isOn ? "Turn Off" : "Turn On"}
                    >
                      <div className="toggle-thumb" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Phantom Killer + Decision Feed */}
        <div className="space-y-6">

          {/* Phantom Killer */}
          <div className={`glass-card p-5 transition-all duration-500 ${
            phantomKilled ? "border-green-savings/35 glow-green" : "border-danger/25"
          }`}>
            <div className="flex items-center gap-2 mb-4">
              <Ghost size={18} className={phantomKilled ? "text-green-savings" : "text-danger"} />
              <h3 className="font-heading font-semibold text-sm">Phantom Killer</h3>
              {!phantomKilled && <span className="ml-auto badge-danger text-[10px] px-2 py-0.5 rounded-full">Active</span>}
            </div>

            <div className="text-center py-4">
              <AnimatePresence mode="wait">
                <motion.span
                  key={phantomW}
                  initial={{ scale: 0.9, opacity: 0.7 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`font-mono-num text-5xl font-bold block ${phantomW > 0 ? "text-danger" : "text-green-savings"}`}
                >
                  {phantomW}<span className="text-2xl">W</span>
                </motion.span>
              </AnimatePresence>
              <p className="text-muted text-xs mt-1">standby waste detected</p>
            </div>

            {/* Phantom progress bar */}
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-4">
              <motion.div
                className={`h-full rounded-full ${phantomW > 0 ? "bg-danger" : "bg-green-savings"}`}
                animate={{ width: `${(phantomW / 143) * 100}%` }}
                transition={{ duration: 0.08 }}
              />
            </div>

            <div className="space-y-2 mb-4 text-xs">
              {[
                { label: "TV Standby",        val: "65W" },
                { label: "Phone Charger",      val: "38W" },
                { label: "Idle Router Adapter",val: "40W" },
              ].map((item) => (
                <div key={item.label} className={`flex justify-between transition-opacity ${phantomKilled ? "opacity-30 line-through" : ""}`}>
                  <span className="text-muted">{item.label}</span>
                  <span className="text-danger font-mono-num">{item.val}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-white/6 pt-2">
                <span className="text-muted">Monthly waste</span>
                <span className="font-mono-num font-medium text-danger">Rs. {(143 * 7.3).toFixed(0)}</span>
              </div>
            </div>

            {!phantomKilled ? (
              <button
                onClick={killPhantom}
                disabled={killing}
                className="w-full py-3 rounded-btn bg-gradient-to-r from-danger to-orange-deep text-white font-bold text-sm hover:shadow-[0_0_25px_rgba(239,68,68,0.4)] transition-all disabled:opacity-60 relative overflow-hidden"
              >
                {killing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Eliminating...
                  </span>
                ) : (
                  "⚡ KILL PHANTOM LOAD"
                )}
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-1 text-green-savings font-medium text-sm py-3 bg-green-savings/10 rounded-btn border border-green-savings/25"
              >
                <CheckCircle size={18} />
                <span>Load Eliminated!</span>
                <span className="font-mono-num text-xs font-bold">Rs. 1,050/month saved</span>
              </motion.div>
            )}
          </div>

          {/* Decision Timeline */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown size={15} className="text-orange-electric" />
              <h3 className="font-heading font-semibold text-sm">AI Decision Timeline</h3>
            </div>
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-4 top-4 bottom-4 w-px bg-gradient-to-b from-orange-electric/50 via-orange-electric/20 to-transparent" />
              <div className="space-y-5">
                {decisionTimeline.map((d, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.15 }}
                    className="flex gap-4 pl-1"
                  >
                    <div className="w-8 h-8 rounded-full bg-orange-electric/10 flex items-center justify-center shrink-0 relative z-10">
                      <d.icon size={14} className={d.color} />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted mb-0.5">{d.time}</p>
                      <p className="text-sm font-medium leading-snug">{d.text}</p>
                      <p className="text-xs text-green-savings font-mono-num mt-0.5">{d.saving}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
