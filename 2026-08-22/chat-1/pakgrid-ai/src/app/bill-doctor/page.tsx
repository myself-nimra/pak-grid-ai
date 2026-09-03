"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Stethoscope, TrendingDown, ArrowRight, CheckCircle, Calculator, Percent, DollarSign, AlertCircle, Award } from "lucide-react";
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
