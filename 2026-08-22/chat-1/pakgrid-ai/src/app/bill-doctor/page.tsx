"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Stethoscope, TrendingDown, ArrowRight, CheckCircle, Calculator, Percent, DollarSign, AlertCircle, Award, Sparkles, Brain, Loader2, Upload, X, FileImage, Pencil, Zap, Check, XCircle, Clock, Eye } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, ReferenceLine } from "recharts";

const billData = [
  { name: "AC Peak", value: 8200, color: "#EF4444" },
  { name: "Water Pump", value: 3400, color: "#F59E0B" },
  { name: "Phantom Load", value: 4100, color: "#FF6A00" },
  { name: "Evening Load", value: 5800, color: "#FF8A00" },
  { name: "Other", value: 3350, color: "#38BDF8" },
];

const prescriptions = [
  { problem: "AC running during peak tariff (5-9 PM)", action: "Switch to Eco Mode from 7 PM to 10 PM", saving: 2100, confidence: 87 },
  { problem: "Water pump runs during expensive period", action: "Schedule after 10:30 PM automatically", saving: 480, confidence: 91 },
  { problem: "143W phantom standby waste detected", action: "Cut standby sockets when occupancy is low", saving: 1050, confidence: 94 },
  { problem: "High evening household demand peak", action: "Stagger heavy appliance usage windows", saving: 720, confidence: 82 },
  { problem: "Battery not charged before outage window", action: "Pre-charge during off-peak solar hours", saving: 1120, confidence: 78 },
];

const monthlyBills = [
  { month: "Jan", bill: 12400 }, { month: "Feb", bill: 11800 }, { month: "Mar", bill: 14200 },
  { month: "Apr", bill: 18600 }, { month: "May", bill: 24850 }, { month: "Jun", bill: 27420 },
  { month: "Jul", bill: 26100 }, { month: "Aug", bill: 24850 },
];

export default function BillDoctorPage() {
  const [acHours, setAcHours] = useState(2);
  const [peakShift, setPeakShift] = useState(40);
  const [phantomW, setPhantomW] = useState(100);
  const [batteryKwh, setBatteryKwh] = useState(3);
  const [monthlyBill, setMonthlyBill] = useState(24850);
  const [appliedRx, setAppliedRx] = useState<number[]>([]);

  // AI API integration state
  const [aiPrescriptions, setAiPrescriptions] = useState<{
    problem: string; action: string; saving: number; confidence: number; category: string;
  }[]>([]);
  const [aiAnalysisText, setAiAnalysisText] = useState("");
  const [aiHealthRating, setAiHealthRating] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // ── Feature 4: Prescription action state ──
  type Decision = "accepted" | "rejected" | "automated";
  type DecisionMap = Record<string, { status: Decision; timestamp: string; reason?: string }>;
  const [decisions, setDecisions] = useState<DecisionMap>({});
  const [rejectModalIdx, setRejectModalIdx] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);
  const [automatingIdx, setAutomatingIdx] = useState<number | null>(null);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: "success" | "error" | "info" }[]>([]);

  // ── Feature 6: Upload & OCR state ──
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState("");
  const [ocrFields, setOcrFields] = useState<{ label: string; value: string }[]>([]);
  const [ocrConfidence, setOcrConfidence] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleRx = (index: number) => {
    setAppliedRx((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const savings = useMemo(() => {
    const acSaved = acHours * 1.5 * 55 * 0.7; // hours * kW * rate * factor
    const peakSaved = (peakShift / 100) * monthlyBill * 0.15;
    const phantomSaved = phantomW * 0.001 * 24 * 30 * 0.65; // kW * hours * days * rate
    const rxBonus = appliedRx.reduce((acc, idx) => acc + prescriptions[idx].saving, 0) * 0.15;
    const totalMonthly = Math.round(acSaved + peakSaved + phantomSaved + rxBonus);
    return {
      acSaved: Math.round(acSaved),
      peakSaved: Math.round(peakSaved),
      phantomSaved: Math.round(phantomSaved),
      rxBonus: Math.round(rxBonus),
      totalMonthly,
      annual: totalMonthly * 12,
      kwhSaved: Math.round(totalMonthly / 55),
      optimized: Math.max(0, monthlyBill - totalMonthly),
    };
  }, [acHours, peakShift, phantomW, batteryKwh, monthlyBill, appliedRx]);

  const totalBillWaste = billData.reduce((acc, b) => acc + b.value, 0);

  /** Call Alibaba Cloud Qwen AI to generate dynamic bill prescriptions */
  const analyzeBillWithAI = async () => {
    setAiLoading(true);
    setAiError("");
    setAiPrescriptions([]);
    try {
      const res = await fetch("/api/bill-doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyBill,
          city: "Lahore",
          billBreakdown: billData,
          acHours,
          solar: false,
          battery: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details || "API request failed");
      if (data.prescriptions?.length > 0) {
        setAiPrescriptions(data.prescriptions);
      }
      setAiAnalysisText(data.analysis || "");
      setAiHealthRating(data.healthRating || "");
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : "Failed to connect to AI service");
    } finally {
      setAiLoading(false);
    }
  };

  /* ── Feature 4 handlers ── */
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };
  const dismissToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const getRxKey = (index: number, isAi: boolean) => `${isAi ? "ai" : "static"}-${index}`;

  const handleAccept = (index: number, isAi: boolean) => {
    const key = getRxKey(index, isAi);
    setDecisions((prev) => ({ ...prev, [key]: { status: "accepted", timestamp: new Date().toISOString() } }));
    const list = isAi ? aiPrescriptions : prescriptions;
    showToast(`Prescription accepted — saving Rs. ${list[index].saving.toLocaleString()}/mo`);
    try {
      const stored = JSON.parse(localStorage.getItem("pakgrid_rx_decisions") || "{}");
      stored[key] = { status: "accepted", timestamp: new Date().toISOString() };
      localStorage.setItem("pakgrid_rx_decisions", JSON.stringify(stored));
    } catch { /* ignore */ }
  };

  const handleRejectOpen = (index: number) => {
    setRejectModalIdx(index);
    setRejectReason("");
  };

  const handleRejectConfirm = async (index: number) => {
    const key = getRxKey(index, true);
    setRejectLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    setDecisions((prev) => ({ ...prev, [key]: { status: "rejected", timestamp: new Date().toISOString(), reason: rejectReason || "No reason given" } }));
    try {
      const stored = JSON.parse(localStorage.getItem("pakgrid_rx_decisions") || "{}");
      stored[key] = { status: "rejected", timestamp: new Date().toISOString(), reason: rejectReason || "No reason given" };
      localStorage.setItem("pakgrid_rx_decisions", JSON.stringify(stored));
    } catch { /* ignore */ }
    setRejectLoading(false);
    setRejectModalIdx(null);
    showToast("Prescription rejected", "info");
  };

  const handleAutomate = async (index: number, isAi: boolean) => {
    const key = getRxKey(index, isAi);
    setAutomatingIdx(index);
    await new Promise((r) => setTimeout(r, 1500));
    setDecisions((prev) => ({ ...prev, [key]: { status: "automated", timestamp: new Date().toISOString() } }));
    try {
      const stored = JSON.parse(localStorage.getItem("pakgrid_rx_decisions") || "{}");
      stored[key] = { status: "automated", timestamp: new Date().toISOString() };
      localStorage.setItem("pakgrid_rx_decisions", JSON.stringify(stored));
    } catch { /* ignore */ }
    setAutomatingIdx(null);
    showToast("Automation enabled — ESP32 edge node will execute this prescription automatically", "success");
  };

  /* ── Feature 6 handlers ── */
  const SUPPORTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!SUPPORTED_TYPES.includes(file.type)) {
      setOcrError("Unsupported file type. Please upload a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setOcrError("File too large. Maximum size is 10 MB.");
      return;
    }
    setOcrError("");
    setUploadedFile(file);
    setOcrFields([]);
    setOcrConfidence(0);
    try {
      const reader = new FileReader();
      reader.onload = () => setUploadedImageSrc(reader.result as string);
      reader.readAsDataURL(file);
    } catch {
      setOcrError("Could not read file. Please try again.");
    }
  };

  const submitForOCR = async () => {
    if (!uploadedImageSrc) return;
    setOcrLoading(true);
    setOcrError("");
    try {
      const res = await fetch("/api/bill-ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData: uploadedImageSrc, mimeType: uploadedFile?.type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "OCR extraction failed");
      if (data.success && data.fields?.length > 0) {
        setOcrFields(data.fields);
        setOcrConfidence(data.confidence || 85);
        showToast(`Bill data extracted with ${data.confidence || 85}% confidence`);
      } else {
        throw new Error(data.error || "No data extracted");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "OCR extraction failed";
      setOcrError(msg);
      setOcrFields(buildFallbackFields());
      showToast("Switched to manual entry mode", "info");
    } finally {
      setOcrLoading(false);
    }
  };

  const buildFallbackFields = () => [
    { label: "Provider / DISCO Name", value: "" },
    { label: "Total Amount (PKR)", value: "" },
    { label: "Due Date", value: "" },
    { label: "Bill Month", value: "" },
    { label: "Consumer Name", value: "" },
    { label: "Units Consumed (kWh)", value: "" },
  ];

  const updateOcrField = (idx: number, val: string) => {
    setOcrFields((prev) => prev.map((f, i) => (i === idx ? { ...f, value: val } : f)));
  };

  const applyOcrToSimulator = () => {
    const amt = ocrFields.find((f) => f.label.includes("Total Amount"));
    if (amt?.value) {
      const num = parseInt(amt.value.replace(/[^0-9]/g, ""), 10);
      if (!isNaN(num) && num > 0) setMonthlyBill(num);
    }
    showToast("Extracted data applied to simulator", "success");
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setUploadedImageSrc("");
    setOcrFields([]);
    setOcrConfidence(0);
    setOcrError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="pt-20 pb-16 px-4 max-w-7xl mx-auto min-h-screen">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="live-dot" />
            <span className="text-xs text-orange-electric font-medium">Diagnostic Engine Active</span>
          </div>
          <h1 className="font-heading text-3xl font-bold flex items-center gap-2">
            <Stethoscope className="text-orange-electric" size={28} />
            Bill Doctor
          </h1>
          <p className="text-muted text-sm">AI financial diagnosis and automated prescriptions for your electricity bill</p>
        </div>
        <div className="glass-card px-4 py-2.5 flex items-center gap-3">
          <Award className="text-green-savings" size={20} />
          <div>
            <div className="text-[10px] text-muted uppercase tracking-wider">Health Rating</div>
            <div className="text-sm font-bold text-green-savings">B+ (Optimizable)</div>
          </div>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <BillCard label="Current Bill" value={monthlyBill} color="text-danger" sub="Baseline expense" />
        <BillCard label="Projected Trend" value={Math.round(monthlyBill * 1.08)} color="text-warning" sub="Next month estimate" />
        <BillCard label="Optimized Bill" value={savings.optimized} color="text-orange-electric" sub="With PakGrid AI" />
        <BillCard
          label="Estimated Saving"
          value={savings.totalMonthly}
          color="text-green-savings"
          sub={`${((savings.totalMonthly / monthlyBill) * 100).toFixed(0)}% bill reduction`}
          glow
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pie Breakdown */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-heading font-semibold">Cost Diagnosis</h3>
            <span className="text-xs text-muted font-mono-num">Rs. {totalBillWaste.toLocaleString()}</span>
          </div>
          <p className="text-muted text-xs mb-4">Where your bill amount is actually spent</p>
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={billData} dataKey="value" cx="50%" cy="50%" outerRadius={80} innerRadius={48} strokeWidth={0}>
                {billData.map((e, i) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => `Rs. ${v.toLocaleString()}`}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {billData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs p-1.5 rounded bg-white/3">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="font-medium">{d.name}</span>
                </span>
                <span className="font-mono-num font-semibold text-main">Rs. {d.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Prescriptions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold flex items-center gap-2">
                <Stethoscope size={18} className="text-orange-electric" /> AI Prescriptions ({appliedRx.length}/{prescriptions.length} Active)
              </h3>
              <span className="text-xs text-green-savings font-mono-num font-semibold">
                +{appliedRx.length * 15}% bonus efficiency
              </span>
            </div>

            <div className="space-y-3">
              {prescriptions.map((p, i) => {
                const isApplied = appliedRx.includes(i);
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    onClick={() => toggleRx(i)}
                    className={`flex items-start gap-3 p-3.5 rounded-card cursor-pointer transition-all border ${
                      isApplied
                        ? "bg-green-savings/10 border-green-savings/30 glow-green"
                        : "bg-bg-surface border-white/5 hover:border-orange-electric/30"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs ${
                      isApplied ? "bg-green-savings text-bg-deep" : "bg-orange-electric/15 text-orange-electric"
                    }`}>
                      {isApplied ? <CheckCircle size={16} /> : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-danger font-medium mb-0.5">{p.problem}</p>
                      <p className="text-xs flex items-center gap-1 text-main">
                        <ArrowRight size={12} className="text-orange-electric shrink-0" />
                        <span>{p.action}</span>
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs">
                        <span className="text-green-savings font-mono-num font-semibold">Rs. {p.saving.toLocaleString()}/mo</span>
                        <div className="flex items-center gap-1.5 text-muted">
                          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-electric rounded-full" style={{ width: `${p.confidence}%` }} />
                          </div>
                          <span className="text-[10px] font-mono-num">{p.confidence}% AI confidence</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Monthly Bill History Chart */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold">Historical Monthly Trends</h3>
              <span className="text-xs text-muted">8-month historical tracking</span>
            </div>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={monthlyBills}>
                <XAxis dataKey="month" stroke="#666" fontSize={11} />
                <YAxis stroke="#666" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => `Rs. ${v.toLocaleString()}`}
                />
                <ReferenceLine y={20000} stroke="#EF4444" strokeDasharray="3 3" label={{ value: "High Tariff Zone", fill: "#EF4444", fontSize: 10 }} />
                <Bar dataKey="bill" radius={[4, 4, 0, 0]}>
                  {monthlyBills.map((e, i) => (
                    <Cell key={i} fill={e.bill > 22000 ? "#EF4444" : e.bill > 16000 ? "#F59E0B" : "#FF8A00"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Savings Simulator */}
      <div className="glass-card p-6 mt-6 border-orange-electric/20 border-glow-anim">
        <div className="flex items-center gap-2 mb-2">
          <Calculator className="text-orange-electric" size={20} />
          <h3 className="font-heading text-xl font-bold">Interactive Savings Simulator</h3>
        </div>
        <p className="text-muted text-sm mb-6">Tweak variables to calculate real return on investment (ROI)</p>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-5">
            <Slider label="AC hours reduced/day" value={acHours} onChange={setAcHours} min={0} max={6} unit="hrs" />
            <Slider label="Peak usage shifted" value={peakShift} onChange={setPeakShift} min={0} max={90} unit="%" />
            <Slider label="Phantom load removed" value={phantomW} onChange={setPhantomW} min={0} max={250} unit="W" />
            <Slider label="Monthly bill" value={monthlyBill} onChange={setMonthlyBill} min={5000} max={80000} unit="Rs." step={1000} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ResultCard label="Monthly kWh Saved" value={`${savings.kwhSaved} kWh`} />
            <ResultCard label="Monthly PKR Saved" value={`Rs. ${savings.totalMonthly.toLocaleString()}`} highlight />
            <ResultCard label="Annual PKR Saved" value={`Rs. ${savings.annual.toLocaleString()}`} />
            <ResultCard label="Optimized Bill" value={`Rs. ${savings.optimized.toLocaleString()}`} />
            <ResultCard label="Bill Reduction" value={`${((savings.totalMonthly / monthlyBill) * 100).toFixed(0)}%`} highlight />
            <ResultCard label="ESP32 Payback Time" value={`${Math.max(1, Math.round(7500 / (savings.totalMonthly || 1)))} days`} />
          </div>
        </div>
      </div>

      {/* ── AI-GENERATED PRESCRIPTIONS (Qwen via Alibaba Cloud) ── */}
      <div className="glass-card p-6 mt-6 border-ai/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-xl font-bold flex items-center gap-2">
            <Brain className="text-ai" size={20} />
            AI-Generated Prescriptions
          </h3>
          <span className="chip text-[10px]">
            <Sparkles size={9} /> Powered by Qwen
          </span>
        </div>
        <p className="text-muted text-sm mb-4">
          Dynamic AI analysis powered by Alibaba Cloud Qwen — tailored to your current bill parameters.
        </p>

        <button
          onClick={analyzeBillWithAI}
          disabled={aiLoading}
          className="btn-primary text-sm py-2.5 px-5 inline-flex items-center gap-2 mb-5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {aiLoading ? (
            <><Loader2 size={14} className="animate-spin" /> AI Analyzing Bill...</>
          ) : (
            <><Stethoscope size={14} /> Analyze Bill with AI</>
          )}
        </button>

        {aiError && (
          <div className="mb-4 p-3.5 rounded-card bg-danger/10 border border-danger/30 text-danger text-xs flex items-start gap-2">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{aiError}</span>
          </div>
        )}

        {aiAnalysisText && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-4 rounded-card bg-ai/5 border border-ai/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <Brain size={14} className="text-ai" />
              <span className="text-xs font-semibold text-ai">AI Diagnosis</span>
              {aiHealthRating && (
                <span className="ml-auto text-xs font-bold text-green-savings bg-green-savings/10 px-2 py-0.5 rounded-full">
                  Health: {aiHealthRating}
                </span>
              )}
            </div>
            <p className="text-sm text-main/90 leading-relaxed">{aiAnalysisText}</p>
          </motion.div>
        )}

        {aiPrescriptions.length > 0 && (
          <div className="space-y-3">
            {aiPrescriptions.map((p, i) => {
              const key = getRxKey(i, true);
              const decision = decisions[key];
              const isAutomating = automatingIdx === i;
              const hasDecision = !!decision;
              return (
                <motion.div
                  key={`ai-rx-${i}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`flex flex-col gap-3 p-3.5 rounded-card transition-all border ${
                    decision?.status === "accepted"
                      ? "bg-green-savings/8 border-green-savings/25"
                      : decision?.status === "rejected"
                      ? "bg-danger/8 border-danger/25 opacity-60"
                      : decision?.status === "automated"
                      ? "bg-ai/8 border-ai/25"
                      : "bg-bg-surface border-ai/15 hover:border-ai/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-ai/15 flex items-center justify-center shrink-0 mt-0.5">
                      {decision?.status === "accepted" ? (
                        <CheckCircle size={14} className="text-green-savings" />
                      ) : decision?.status === "rejected" ? (
                        <XCircle size={14} className="text-danger" />
                      ) : decision?.status === "automated" ? (
                        <Zap size={14} className="text-ai" />
                      ) : (
                        <Brain size={14} className="text-ai" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <p className="text-sm text-danger font-medium">{p.problem}</p>
                        {hasDecision && (
                          <motion.span
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              decision.status === "accepted"
                                ? "bg-green-savings/15 text-green-savings border border-green-savings/30"
                                : decision.status === "rejected"
                                ? "bg-danger/15 text-danger border border-danger/30"
                                : "bg-ai/15 text-ai border border-ai/30"
                            }`}
                          >
                            {decision.status === "accepted" ? "✓ Accepted" : decision.status === "rejected" ? "✕ Rejected" : "⚡ Automated"}
                          </motion.span>
                        )}
                      </div>
                      <p className="text-xs flex items-center gap-1 text-main">
                        <ArrowRight size={12} className="text-ai shrink-0" />
                        <span>{p.action}</span>
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs">
                        <span className="text-green-savings font-mono-num font-semibold">
                          Rs. {(p.saving || 0).toLocaleString()}/mo
                        </span>
                        <div className="flex items-center gap-1.5 text-muted">
                          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-ai rounded-full" style={{ width: `${p.confidence || 0}%` }} />
                          </div>
                          <span className="text-[10px] font-mono-num">{p.confidence}% confidence</span>
                        </div>
                        {p.category && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted capitalize">
                            {p.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                    <button
                      onClick={() => handleAccept(i, true)}
                      disabled={hasDecision}
                      className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-btn bg-green-savings/10 text-green-savings border border-green-savings/20 hover:bg-green-savings/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Check size={12} /> Accept
                    </button>
                    <button
                      onClick={() => handleRejectOpen(i)}
                      disabled={hasDecision}
                      className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-btn bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <X size={12} /> Reject
                    </button>
                    <button
                      onClick={() => handleAutomate(i, true)}
                      disabled={hasDecision || isAutomating}
                      className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-btn bg-ai/10 text-ai border border-ai/20 hover:bg-ai/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed ml-auto"
                    >
                      {isAutomating ? (
                        <><Loader2 size={12} className="animate-spin" /> Setting up...</>
                      ) : (
                        <><Zap size={12} /> Automate</>
                      )}
                    </button>
                  </div>

                  {decision?.status === "rejected" && decision.reason && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-muted/70 italic pl-11">
                      Reason: {decision.reason}
                    </motion.p>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── FEATURE 6: Bill Photo Upload with OCR ── */}
      <div className="glass-card p-6 mt-6 border-orange-electric/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-xl font-bold flex items-center gap-2">
            <FileImage className="text-orange-electric" size={20} />
            Bill Photo Scanner
          </h3>
          <span className="chip text-[10px]">
            <Eye size={9} /> Qwen-VL Vision
          </span>
        </div>
        <p className="text-muted text-sm mb-5">
          Upload a photo of your electricity bill to auto-extract key details using AI-powered OCR.
        </p>

        {/* Upload Zone */}
        {!uploadedFile && (
          <div
            className={`relative border-2 border-dashed rounded-card p-10 text-center transition-all cursor-pointer ${
              isDragging
                ? "border-orange-electric bg-orange-electric/5"
                : "border-white/10 hover:border-orange-electric/40 hover:bg-white/[0.02]"
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <motion.div
              animate={isDragging ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="flex flex-col items-center"
            >
              <div className="w-14 h-14 rounded-full bg-orange-electric/10 flex items-center justify-center mb-4">
                <Upload size={24} className="text-orange-electric" />
              </div>
              <p className="text-sm font-medium mb-1">
                {isDragging ? "Drop your bill here" : "Drag & drop your electricity bill"}
              </p>
              <p className="text-xs text-muted mb-3">or click to browse files</p>
              <div className="flex gap-2 justify-center">
                {["JPG", "PNG", "WEBP"].map((fmt) => (
                  <span key={fmt} className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-muted">{fmt}</span>
                ))}
                <span className="text-[10px] text-muted/60">Max 10 MB</span>
              </div>
            </motion.div>
          </div>
        )}

        {/* Uploaded preview + OCR action */}
        {uploadedFile && !ocrFields.length && !ocrLoading && (
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="relative w-48 h-56 rounded-card overflow-hidden border border-white/10 shrink-0">
              {uploadedImageSrc && <img src={uploadedImageSrc} alt="Bill" className="w-full h-full object-cover" />}
              <button
                onClick={resetUpload}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center hover:bg-black transition-colors"
              >
                <X size={12} />
              </button>
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <p className="text-[10px] text-white/80 truncate">{uploadedFile.name}</p>
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-center gap-3">
              <h4 className="text-sm font-semibold">Ready to scan</h4>
              <p className="text-xs text-muted">AI will extract total amount, due date, consumption units, and provider details.</p>
              <div className="flex gap-3">
                <button onClick={submitForOCR} className="btn-primary text-sm py-2 px-4 inline-flex items-center gap-2">
                  <Eye size={14} /> Extract Bill Data
                </button>
                <button onClick={resetUpload} className="btn-secondary text-sm py-2 px-4">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* OCR Loading skeleton */}
        {ocrLoading && (
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="w-48 h-56 rounded-card bg-white/5 animate-pulse shrink-0" />
            <div className="flex-1 space-y-3 w-full">
              <div className="h-4 bg-white/5 rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-white/5 rounded w-1/2 animate-pulse" />
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-8 bg-white/5 rounded w-1/3 animate-pulse" />
                  <div className="h-8 bg-white/5 rounded flex-1 animate-pulse" />
                </div>
              ))}
              <div className="flex items-center gap-2 mt-2">
                <Loader2 size={14} className="text-ai animate-spin" />
                <span className="text-xs text-ai">Qwen-VL analysing bill image...</span>
              </div>
            </div>
          </div>
        )}

        {ocrError && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-3.5 rounded-card bg-danger/10 border border-danger/30 text-danger text-xs flex items-start gap-2">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{ocrError}</span>
          </motion.div>
        )}

        {/* Extracted data — editable table */}
        {ocrFields.length > 0 && !ocrLoading && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-savings" />
                <span className="text-sm font-semibold">Extracted Bill Data</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-savings/10 text-green-savings border border-green-savings/20 font-mono-num">
                  {ocrConfidence}% confidence
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={applyOcrToSimulator} className="text-[11px] px-3 py-1.5 rounded-btn bg-orange-electric/10 text-orange-electric border border-orange-electric/20 hover:bg-orange-electric/20 transition-all inline-flex items-center gap-1">
                  <Calculator size={11} /> Apply to Simulator
                </button>
                <button onClick={resetUpload} className="text-[11px] px-3 py-1.5 rounded-btn bg-white/5 text-muted border border-white/10 hover:bg-white/10 transition-all inline-flex items-center gap-1">
                  <Upload size={11} /> New Upload
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {uploadedImageSrc && (
                <div className="sm:col-span-2 flex items-start gap-3 p-3 rounded-card bg-bg-surface border border-white/5">
                  <img src={uploadedImageSrc} alt="Bill thumbnail" className="w-20 h-24 rounded object-cover border border-white/10 shrink-0" />
                  <div className="text-xs text-muted space-y-1 min-w-0">
                    <p className="font-medium text-main truncate">{uploadedFile?.name}</p>
                    <p>{uploadedFile ? `${(uploadedFile.size / 1024).toFixed(1)} KB` : "—"}</p>
                    <p className="text-green-savings">Data extracted successfully</p>
                  </div>
                </div>
              )}

              {ocrFields.map((field, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2.5 rounded-card bg-bg-surface border border-white/5">
                  <div className="flex-1 min-w-0">
                    <label className="text-[10px] text-muted uppercase tracking-wider block mb-1">{field.label}</label>
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => updateOcrField(idx, e.target.value)}
                      className="w-full bg-transparent border-b border-white/10 focus:border-orange-electric text-sm text-main py-1 outline-none transition-colors font-mono-num"
                      placeholder="Enter value..."
                    />
                  </div>
                  <Pencil size={11} className="text-muted/40 shrink-0" />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* ── REJECTION REASON MODAL ── */}
      <AnimatePresence>
        {rejectModalIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => !rejectLoading && setRejectModalIdx(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="glass-card p-6 max-w-md w-full border-danger/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-danger/15 flex items-center justify-center">
                  <XCircle size={18} className="text-danger" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base">Reject Prescription</h3>
                  <p className="text-xs text-muted">Tell us why this recommendation doesn&apos;t work for you.</p>
                </div>
              </div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Not applicable to my home setup, already implemented, cost concern..."
                className="input-field text-sm min-h-[90px] resize-none mb-4"
                rows={3}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => handleRejectConfirm(rejectModalIdx)}
                  disabled={rejectLoading}
                  className="flex-1 flex items-center justify-center gap-2 text-sm py-2.5 rounded-btn bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25 transition-all disabled:opacity-50"
                >
                  {rejectLoading ? <><Loader2 size={14} className="animate-spin" /> Rejecting...</> : <><XCircle size={14} /> Confirm Reject</>}
                </button>
                <button
                  onClick={() => setRejectModalIdx(null)}
                  disabled={rejectLoading}
                  className="flex-1 text-sm py-2.5 rounded-btn bg-white/5 text-muted border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOAST NOTIFICATIONS ── */}
      <div className="fixed bottom-6 right-6 z-[110] flex flex-col gap-2 max-w-sm">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={`flex items-start gap-2.5 p-3.5 rounded-card shadow-lg backdrop-blur-md border cursor-pointer ${
                t.type === "success"
                  ? "bg-green-savings/10 border-green-savings/30 text-green-savings"
                  : t.type === "error"
                  ? "bg-danger/10 border-danger/30 text-danger"
                  : "bg-ai/10 border-ai/30 text-ai"
              }`}
              onClick={() => dismissToast(t.id)}
            >
              {t.type === "success" ? <CheckCircle size={14} className="shrink-0 mt-0.5" /> : t.type === "error" ? <AlertCircle size={14} className="shrink-0 mt-0.5" /> : <Sparkles size={14} className="shrink-0 mt-0.5" />}
              <p className="text-xs leading-relaxed flex-1">{t.message}</p>
              <button className="shrink-0 opacity-50 hover:opacity-100 transition-opacity">
                <X size={11} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function BillCard({ label, value, color, sub, glow }: { label: string; value: number; color: string; sub?: string; glow?: boolean }) {
  return (
    <div className={`glass-card p-4 transition-all hover-lift ${glow ? "glow-green border-green-savings/30" : ""}`}>
      <p className="text-muted text-xs mb-1">{label}</p>
      <p className={`font-mono-num text-2xl font-bold ${color}`}>Rs. {value.toLocaleString()}</p>
      {sub && <p className="text-muted text-[10px] mt-1">{sub}</p>}
    </div>
  );
}

function Slider({ label, value, onChange, min, max, unit, step }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; unit: string; step?: number }) {
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-sm text-muted">{label}</span>
        <span className="text-sm font-mono-num font-semibold text-orange-electric">
          {unit === "Rs." ? `Rs. ${value.toLocaleString()}` : `${value} ${unit}`}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step || 1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer accent-orange-electric"
      />
    </div>
  );
}

function ResultCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-card transition-all ${highlight ? "bg-green-savings/10 border border-green-savings/30 glow-green" : "bg-bg-surface border border-white/5"}`}>
      <p className="text-muted text-xs mb-1">{label}</p>
      <p className={`font-mono-num text-lg font-bold ${highlight ? "text-green-savings" : "text-main"}`}>{value}</p>
    </div>
  );
}
