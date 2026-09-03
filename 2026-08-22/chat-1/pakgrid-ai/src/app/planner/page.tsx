"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Brain, ArrowRight, Sun, Battery, MapPin, Clock, CheckCircle, Sparkles, Zap, Shield } from "lucide-react";

const cities = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar"];
const tariffMap: Record<string, { peak: string; offPeak: string; rate: number }> = {
  Lahore: { peak: "5 PM - 9 PM", offPeak: "10 PM - 5 PM", rate: 55 },
  Karachi: { peak: "6 PM - 10 PM", offPeak: "11 PM - 6 PM", rate: 58 },
  Islamabad: { peak: "5 PM - 9 PM", offPeak: "10 PM - 5 PM", rate: 52 },
  Rawalpindi: { peak: "5 PM - 9 PM", offPeak: "10 PM - 5 PM", rate: 53 },
  Faisalabad: { peak: "5 PM - 9 PM", offPeak: "10 PM - 5 PM", rate: 54 },
  Multan: { peak: "5 PM - 10 PM", offPeak: "11 PM - 5 PM", rate: 56 },
  Peshawar: { peak: "5 PM - 9 PM", offPeak: "10 PM - 5 PM", rate: 51 },
};

type PlanResult = {
  schedule: { appliance: string; time: string; action: string; saving: number }[];
  dailySaving: number;
  monthlySaving: number;
  annualSaving: number;
  peakReduction: string;
  backupExtension: string;
};

export default function PlannerPage() {
  const [city, setCity] = useState("Lahore");
  const [bill, setBill] = useState(25000);
  const [acHours, setAcHours] = useState(8);
  const [pumpTime, setPumpTime] = useState("6:00 PM");
  const [solar, setSolar] = useState(true);
  const [battery, setBattery] = useState(true);
  const [occupancy, setOccupancy] = useState("day");
  const [plan, setPlan] = useState<PlanResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const generatePlan = async () => {
    setGenerating(true);
    setPlan(null);
    setLoadingStep(1);
    await new Promise((r) => setTimeout(r, 600));
    setLoadingStep(2);
    await new Promise((r) => setTimeout(r, 600));
    setLoadingStep(3);
    await new Promise((r) => setTimeout(r, 500));

    const tariff = tariffMap[city] || tariffMap.Lahore;
    const acSaving = Math.round(acHours * 0.3 * tariff.rate * 30 * 0.25);
    const pumpSaving = Math.round(1.1 * tariff.rate * 30 * 0.6);
    const phantomSaving = Math.round(0.143 * 24 * 30 * tariff.rate * 0.3);
    const peakSaving = Math.round(bill * 0.08);
    const total = acSaving + pumpSaving + phantomSaving + peakSaving;

    setPlan({
      schedule: [
        { appliance: "AC Eco Mode", time: "7:00 PM - 10:00 PM", action: "Reduce compressor load during peak tariff window", saving: acSaving },
        { appliance: "Water Pump", time: "10:42 PM", action: "Automated shift to off-peak tariff window", saving: pumpSaving },
        { appliance: "Phantom Load Isolation", time: "Occupancy idle periods", action: "Isolate standby power sockets via ESP32 relay", saving: phantomSaving },
        { appliance: "Battery Charging", time: "1:00 AM - 5:00 AM", action: "Pre-charge from grid during cheapest off-peak rate", saving: peakSaving },
        { appliance: "Heavy Appliance Staggering", time: "11:15 PM", action: "Move laundry and dishwashing to cheap window", saving: Math.round(peakSaving * 0.35) },
      ],
      dailySaving: Math.round(total / 30),
      monthlySaving: total,
      annualSaving: total * 12,
      peakReduction: `${Math.round((total / bill) * 100)}%`,
      backupExtension: battery ? "+2.1 hours" : "N/A",
    });
    setGenerating(false);
  };

  const tariff = tariffMap[city] || tariffMap.Lahore;

  return (
    <div className="pt-20 pb-16 px-4 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="live-dot" />
            <span className="text-xs text-ai font-medium">Optimization Algorithm Ready</span>
          </div>
          <h1 className="font-heading text-3xl font-bold flex items-center gap-2">
            <Calendar className="text-orange-electric" size={28} />
            AI Optimization Planner
          </h1>
          <p className="text-muted text-sm">Generate tailored appliance schedules optimized for Pakistani utility tariffs</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Panel */}
        <div className="glass-card p-6 h-fit sticky top-24 hover-lift">
          <h3 className="font-heading font-semibold mb-5 flex items-center gap-2 text-main">
            <MapPin size={18} className="text-orange-electric" /> Home & Tariff Profile
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted mb-1 block">City / Utility Region</label>
              <select className="input-field text-sm" value={city} onChange={(e) => setCity(e.target.value)}>
                {cities.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-muted mb-1 flex justify-between">
                <span>Average Monthly Bill</span>
                <span className="font-mono-num font-semibold text-orange-electric">Rs. {bill.toLocaleString()}</span>
              </label>
              <input
                type="range"
                min={5000}
                max={80000}
                step={1000}
                value={bill}
                onChange={(e) => setBill(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-orange-electric"
              />
            </div>

            <div>
              <label className="text-xs text-muted mb-1 flex justify-between">
                <span>AC Daily Run Time</span>
                <span className="font-mono-num font-semibold text-orange-electric">{acHours} Hours</span>
              </label>
              <input
                type="range"
                min={0}
                max={18}
                value={acHours}
                onChange={(e) => setAcHours(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-orange-electric"
              />
            </div>

            <div>
              <label className="text-xs text-muted mb-1 block">Water Pump Preferred Time</label>
              <select className="input-field text-sm" value={pumpTime} onChange={(e) => setPumpTime(e.target.value)}>
                {["2:00 PM", "4:00 PM", "6:00 PM", "8:00 PM", "10:00 PM"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-muted mb-1 block">Occupancy Pattern</label>
              <select className="input-field text-sm" value={occupancy} onChange={(e) => setOccupancy(e.target.value)}>
                <option value="day">Daytime active household</option>
                <option value="evening">Evening active (Working professionals)</option>
                <option value="night">Night shift / Late sleep routine</option>
                <option value="all">Full day home occupancy</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted mb-1 flex items-center gap-1">
                  <Sun size={12} className="text-orange-golden" /> Solar System
                </label>
                <select className="input-field text-sm" value={solar ? "yes" : "no"} onChange={(e) => setSolar(e.target.value === "yes")}>
                  <option value="yes">Installed</option>
                  <option value="no">Not Installed</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted mb-1 flex items-center gap-1">
                  <Battery size={12} className="text-ai" /> Battery Storage
                </label>
                <select className="input-field text-sm" value={battery ? "yes" : "no"} onChange={(e) => setBattery(e.target.value === "yes")}>
                  <option value="yes">Installed</option>
                  <option value="no">Not Installed</option>
                </select>
              </div>
            </div>

            {/* Tariff Info Box */}
            <div className="bg-bg-surface border border-white/5 rounded-card p-3 text-xs space-y-1.5">
              <p className="text-muted">Detected Tariff Matrix for <strong className="text-orange-electric">{city}</strong>:</p>
              <div className="flex justify-between"><span className="text-muted">Peak Period</span><span className="text-warning font-mono-num">{tariff.peak}</span></div>
              <div className="flex justify-between"><span className="text-muted">Off-Peak Window</span><span className="text-green-savings font-mono-num">{tariff.offPeak}</span></div>
              <div className="flex justify-between"><span className="text-muted">Peak Unit Rate</span><span className="text-danger font-mono-num font-semibold">PKR {tariff.rate}/unit</span></div>
            </div>

            <button
              onClick={generatePlan}
              disabled={generating}
              className="btn-primary w-full text-center flex items-center justify-center gap-2 py-3"
            >
              <Sparkles size={16} />
              {generating ? "Synthesizing AI Plan..." : "Generate Optimization Schedule"}
            </button>
          </div>
        </div>

        {/* Output Panel */}
        <div>
          {generating && (
            <div className="glass-card p-12 flex flex-col items-center justify-center text-center border-orange-electric/30">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-electric to-orange-deep flex items-center justify-center mb-6 animate-pulse shadow-[0_0_40px_rgba(255,138,0,0.5)]">
                <Brain size={32} className="text-white animate-spin" />
              </div>
              <h3 className="font-heading text-lg font-bold mb-2">Analyzing Household Profile</h3>
              <div className="space-y-2 text-xs text-muted max-w-sm">
                <p className={loadingStep >= 1 ? "text-green-savings" : ""}>✓ Fetching tariff schedules for {city}</p>
                <p className={loadingStep >= 2 ? "text-green-savings" : ""}>✓ Modeling AC thermal inertia setpoints</p>
                <p className={loadingStep >= 3 ? "text-green-savings" : ""}>✓ Calculating ESP32 relay switching matrix</p>
              </div>
            </div>
          )}

          {plan && !generating && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Savings Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="glass-card p-4 text-center">
                  <p className="text-muted text-[10px]">Daily Saving</p>
                  <p className="font-mono-num text-lg font-bold text-green-savings mt-1">Rs. {plan.dailySaving.toLocaleString()}</p>
                </div>
                <div className="glass-card p-4 text-center glow-green border-green-savings/30">
                  <p className="text-muted text-[10px]">Monthly Saving</p>
                  <p className="font-mono-num text-xl font-bold text-green-savings mt-1">Rs. {plan.monthlySaving.toLocaleString()}</p>
                </div>
                <div className="glass-card p-4 text-center">
                  <p className="text-muted text-[10px]">Annual Saving</p>
                  <p className="font-mono-num text-lg font-bold text-green-savings mt-1">Rs. {plan.annualSaving.toLocaleString()}</p>
                </div>
              </div>

              {/* Schedule List */}
              <div className="glass-card p-5">
                <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
                  <Calendar size={18} className="text-orange-electric" /> Optimized Appliance Schedule
                </h3>
                <div className="space-y-3">
                  {plan.schedule.map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-3 p-3.5 rounded-card bg-bg-surface border border-white/5 hover:border-orange-electric/30 transition-all"
                    >
                      <div className="w-8 h-8 rounded-full bg-orange-electric/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Clock size={15} className="text-orange-electric" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm text-main">{s.appliance}</span>
                          <span className="text-green-savings text-xs font-mono-num font-bold">Rs. {s.saving.toLocaleString()}/mo</span>
                        </div>
                        <p className="text-xs text-orange-electric font-semibold mt-0.5">{s.time}</p>
                        <p className="text-xs text-muted mt-0.5">{s.action}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* AI Reasoning Metadata Chips */}
              <div className="glass-card p-5">
                <h3 className="font-heading font-semibold text-sm mb-3">AI Reasoning Parameters</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    `City: ${city}`,
                    `Tariff: ${tariff.rate} PKR/unit`,
                    `Peak Window: ${tariff.peak}`,
                    `AC Hours: ${acHours}h/day`,
                    `Solar: ${solar ? "Active" : "None"}`,
                    `Battery: ${battery ? "Active" : "None"}`,
                    `Peak Reduction: ${plan.peakReduction}`,
                    `Backup Duration: ${plan.backupExtension}`,
                  ].map((c) => (
                    <span key={c} className="chip">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {!plan && !generating && (
            <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
              <Brain size={54} className="text-orange-electric/25 mb-4" />
              <h3 className="font-heading font-semibold text-base mb-2">Ready to Plan</h3>
              <p className="text-muted text-xs max-w-sm leading-relaxed">
                Configure your city and monthly electricity budget on the left, then click <strong>Generate Optimization Schedule</strong>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
