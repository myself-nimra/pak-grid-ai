"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  Zap, TrendingUp, CloudLightning, Plug, Power, Eye, Brain, Target, Cpu,
  PiggyBank, Shield, BarChart3, Ghost, Calendar, Wrench, Battery, Snowflake,
  Lightbulb, Tv, Droplets, Sun, Gauge, Network, ArrowRight, CheckCircle
} from "lucide-react";

const fade = (delay: number) => ({
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { delay, duration: 0.55, ease: "easeOut" } },
});

const problems = [
  { icon: TrendingUp,     title: "Peak-Hour Tariff Pain",    desc: "PKR 55–60/unit during peak hours. AC running at 7 PM costs 4× more than at 2 AM.",  color: "text-danger",        bg: "from-danger/20 to-danger/5",          border: "hover:border-danger/40" },
  { icon: CloudLightning, title: "Load-Shedding Uncertainty",desc: "Unpredictable blackouts drain battery backup and leave families in the dark.",         color: "text-warning",       bg: "from-warning/20 to-warning/5",        border: "hover:border-warning/40" },
  { icon: Plug,           title: "AC & Pump Timing Waste",   desc: "Water pumps and ACs running during expensive windows waste thousands monthly.",          color: "text-orange-golden", bg: "from-orange-golden/20 to-orange-golden/5", border: "hover:border-orange-golden/40" },
  { icon: Power,          title: "Phantom Load Waste",       desc: "TV standby, chargers, idle adapters silently eat 10–15% of your bill while you sleep.", color: "text-danger",        bg: "from-orange-electric/20 to-orange-electric/5", border: "hover:border-orange-electric/40" },
];

const steps = [
  { icon: Eye,      label: "SENSE",   desc: "Monitor real-time power usage from every appliance" },
  { icon: Brain,    label: "PREDICT", desc: "Forecast blackouts, peak tariffs, and occupancy patterns" },
  { icon: Target,   label: "DECIDE",  desc: "AI selects optimal action for each appliance" },
  { icon: Cpu,      label: "ACT",     desc: "Automatically shift loads, dim ACs, kill phantom power" },
  { icon: PiggyBank,label: "SAVE",    desc: "Measure savings in real PKR — 20–30% bill reduction" },
];

const features = [
  { icon: BarChart3, title: "AI Bill Doctor",       desc: "Financial diagnosis of your electricity bill with AI prescriptions", color: "from-orange-electric to-orange-deep", link: "/bill-doctor" },
  { icon: Zap,       title: "Load-Shifting Agent",  desc: "Automatically moves heavy loads to off-peak hours",                  color: "from-orange-golden to-orange-electric", link: "/dashboard" },
  { icon: Ghost,     title: "Phantom Killer",        desc: "Detects and eliminates standby power waste completely",              color: "from-danger to-orange-deep",          link: "/ai-agent" },
  { icon: Shield,    title: "Blackout Guardian",     desc: "Protects battery backup during load-shedding events",               color: "from-warning to-orange-golden",       link: "/blackout" },
  { icon: Calendar,  title: "AI Planner",            desc: "Generates optimized daily appliance schedules",                     color: "from-ai to-orange-electric",          link: "/planner" },
  { icon: Wrench,    title: "Hardware Lab",          desc: "ESP32 + sensor proof-of-concept with live data",                    color: "from-green-savings to-ai",            link: "/hardware" },
];

const impactStats = [
  { label: "Peak tariff defended",     value: "5–9 PM",    icon: Gauge,     end: null },
  { label: "Projected monthly saving", value: "Rs. 6,550", icon: PiggyBank, end: 6550 },
  { label: "Backup extension",         value: "+2.1 hrs",  icon: Battery,   end: null },
  { label: "Edge deployment cost",     value: "Rs. 3,300", icon: Cpu,       end: 3300 },
];

const deviceNodes = [
  { icon: Sun,      label: "Solar",   top: "5%",  left: "50%", color: "text-orange-golden" },
  { icon: Battery,  label: "Battery", top: "25%", left: "85%", color: "text-ai" },
  { icon: Snowflake,label: "AC",      top: "70%", left: "85%", color: "text-ai" },
  { icon: Lightbulb,label: "Lights",  top: "90%", left: "50%", color: "text-orange-golden" },
  { icon: Tv,       label: "TV",      top: "70%", left: "15%", color: "text-danger" },
  { icon: Droplets, label: "Pump",    top: "25%", left: "15%", color: "text-green-savings" },
];

const particles = [
  { size: 4, top: "12%", left: "8%",  dur: 7, tx: 30, ty: -40, tx2: -20, ty2: 25 },
  { size: 3, top: "35%", left: "92%", dur: 9, tx: -25, ty: -30, tx2: 15, ty2: 40 },
  { size: 5, top: "70%", left: "5%",  dur: 6, tx: 40, ty: -20, tx2: -30, ty2: 30 },
  { size: 3, top: "80%", left: "88%", dur: 8, tx: -35, ty: -45, tx2: 20, ty2: 20 },
  { size: 4, top: "50%", left: "50%", dur: 10, tx: 50, ty: -50, tx2: -40, ty2: 30 },
];

// Animated counter that counts up when in view
function CountUp({ target, prefix = "", suffix = "" }: { target: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    if (!inView) return;
    const duration = 1600;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

export default function LandingPage() {
  return (
    <div className="pt-16">

      {/* ── HERO ── */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden grid-bg-animated">
        {/* Background glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-orange-electric/4 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-16 right-16 w-48 h-48 bg-orange-deep/8 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-16 left-8 w-64 h-64 bg-ai/4 rounded-full blur-[100px] pointer-events-none" />

        {/* CSS Particles */}
        {particles.map((p, i) => (
          <span
            key={i}
            className="particle"
            style={{
              width: p.size, height: p.size,
              top: p.top, left: p.left,
              "--dur": `${p.dur}s`,
              "--tx": `${p.tx}px`, "--ty": `${p.ty}px`,
              "--tx2": `${p.tx2}px`, "--ty2": `${p.ty2}px`,
              animationDelay: `${i * 1.3}s`,
            } as React.CSSProperties}
          />
        ))}

        <div className="max-w-7xl mx-auto px-4 py-24 grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.13 } } }}>
            <motion.div variants={fade(0)} className="inline-flex items-center gap-2 chip mb-6">
              <Zap size={12} /> Alibaba Cloud AI Hackathon 2026
            </motion.div>

            <motion.h1 variants={fade(0.1)} className="font-heading text-5xl md:text-7xl font-bold leading-[1.05] mb-4">
              PakGrid{" "}
              <span className="gradient-text-orange">AI</span>
            </motion.h1>

            <motion.p variants={fade(0.2)} className="text-2xl md:text-3xl font-heading font-medium text-main/90 mb-3">
              Predict. Optimize.{" "}
              <span className="text-green-savings">Save Every Rupee.</span>
            </motion.p>

            <motion.p variants={fade(0.3)} className="text-muted text-lg max-w-xl mb-8 leading-relaxed">
              An AI energy agent for Pakistani homes that reduces bills by{" "}
              <strong className="text-main">20–30%</strong>, handles peak-hour load, detects phantom
              waste, and protects backup power — all autonomously on a{" "}
              <strong className="text-orange-electric">Rs. 3,300 ESP32</strong>.
            </motion.p>

            {/* Key numbers */}
            <motion.div variants={fade(0.35)} className="flex flex-wrap gap-4 mb-8">
              {[
                { v: "20–30%", label: "Bill Reduction" },
                { v: "Rs. 3,300", label: "Hardware Cost" },
                { v: "+2.1 hrs", label: "Backup Extended" },
              ].map((s) => (
                <div key={s.label} className="glass-card px-4 py-2.5 text-center min-w-[100px]">
                  <div className="font-mono-num font-bold text-orange-electric text-lg">{s.v}</div>
                  <div className="text-[10px] text-muted">{s.label}</div>
                </div>
              ))}
            </motion.div>

            <motion.div variants={fade(0.4)} className="flex flex-wrap gap-4">
              <Link href="/dashboard" className="btn-primary text-lg px-8 py-3.5 inline-flex items-center gap-2">
                <Zap size={18} /> Launch Demo
              </Link>
              <Link href="/ai-agent" className="btn-secondary text-lg px-8 py-3.5 inline-flex items-center gap-2">
                <Brain size={18} /> See AI in Action
              </Link>
            </motion.div>
          </motion.div>

          {/* Smart Home Visual */}
          <motion.div variants={fade(0.3)} initial="hidden" animate="visible" className="relative hidden lg:block">
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              {/* Central AI Core */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="ai-core w-36 h-36 rounded-full bg-gradient-to-br from-orange-electric/25 to-orange-deep/15 flex items-center justify-center pulse-ring">
                  <motion.div
                    className="w-22 h-22 rounded-full bg-gradient-to-br from-orange-electric to-orange-deep flex items-center justify-center shadow-[0_0_50px_rgba(255,138,0,0.6)]"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    style={{ width: 88, height: 88 }}
                  >
                    <Brain size={34} className="text-white" />
                  </motion.div>
                </div>
              </div>

              {/* Orbiting Devices */}
              {deviceNodes.map((d, i) => (
                <motion.div
                  key={d.label}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
                  style={{ top: d.top, left: d.left }}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2.2 + i * 0.35, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
                >
                  <div className="device-node w-14 h-14 rounded-xl glass-card flex items-center justify-center glow-orange hover-lift cursor-pointer">
                    <d.icon size={23} className={d.color} />
                  </div>
                  <span className="text-[10px] text-muted font-medium">{d.label}</span>
                </motion.div>
              ))}

              {/* SVG Energy Lines */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
                {[
                  "M200,200 Q280,120 340,100", "M200,200 Q120,120 60,100",
                  "M200,200 Q280,280 340,300", "M200,200 Q120,280 60,300",
                  "M200,200 L200,360", "M200,200 L200,40",
                ].map((d, i) => (
                  <path key={i} d={d} fill="none" stroke="#FF8A00" strokeWidth="1.5" opacity="0.3" className="energy-line" />
                ))}
              </svg>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-[10px] text-muted/50 uppercase tracking-widest">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-orange-electric/50 to-transparent" />
        </motion.div>
      </section>

      {/* ── PROBLEM CARDS ── */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 chip mb-4">
              <TrendingUp size={12} /> The Crisis
            </div>
            <h2 className="font-heading text-3xl md:text-5xl font-bold mb-4">
              Pakistan&apos;s{" "}
              <span className="text-danger">Electricity Crisis</span>
            </h2>
            <p className="text-muted max-w-2xl mx-auto text-lg">
              Every Pakistani household faces these four problems daily.{" "}
              <strong className="text-main">PakGrid AI solves all of them automatically.</strong>
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {problems.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`glass-card p-6 group hover-lift cursor-default transition-all ${p.border}`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.bg} flex items-center justify-center mb-4`}>
                  <p.icon className={`${p.color}`} size={22} />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{p.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-4 bg-bg-near relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 chip mb-4">
              <Cpu size={12} /> The Loop
            </div>
            <h2 className="font-heading text-3xl md:text-5xl font-bold">
              How{" "}
              <span className="text-orange-electric">PakGrid AI</span>{" "}
              Works
            </h2>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-4 md:gap-0 items-center">
            {steps.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, type: "spring", stiffness: 200 }}
                className="flex items-center gap-4 md:gap-0"
              >
                <div className="flex flex-col items-center text-center w-40">
                  <motion.div
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-electric to-orange-deep flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(255,138,0,0.35)] cursor-pointer"
                    whileHover={{ scale: 1.12, boxShadow: "0 0 50px rgba(255,138,0,0.5)" }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <s.icon size={24} className="text-white" />
                  </motion.div>
                  <h4 className="font-heading font-bold text-orange-electric text-xs tracking-widest mb-1">{s.label}</h4>
                  <p className="text-muted text-xs leading-relaxed">{s.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:block step-connector mx-2" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 chip mb-4">
              <Brain size={12} /> Capabilities
            </div>
            <h2 className="font-heading text-3xl md:text-5xl font-bold mb-4">
              Intelligent{" "}
              <span className="text-orange-electric">Features</span>
            </h2>
            <p className="text-muted max-w-2xl mx-auto">
              Every feature is engineered to save real rupees from your electricity bill.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  href={f.link}
                  className="glass-card p-6 group hover-lift block transition-all duration-300 cursor-pointer h-full"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 opacity-85 group-hover:opacity-100 group-hover:shadow-[0_0_25px_rgba(255,138,0,0.3)] transition-all`}>
                    <f.icon size={22} className="text-white" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg mb-2 group-hover:text-orange-electric transition-colors">{f.title}</h3>
                  <p className="text-muted text-sm leading-relaxed mb-3">{f.desc}</p>
                  <span className="text-xs text-orange-electric/70 group-hover:text-orange-electric flex items-center gap-1 transition-colors">
                    Explore <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── IMPACT STATS ── */}
      <section className="py-24 px-4 bg-bg-near overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr_1fr] gap-14 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 chip mb-5">
              <Network size={12} /> Virtual Power Plant Logic
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-5">
              Built like a real product,{" "}
              <span className="gradient-text-orange">not just a dashboard.</span>
            </h2>
            <p className="text-muted leading-relaxed mb-6">
              PakGrid AI combines tariff intelligence, occupancy learning, outage prediction, and relay-level
              appliance control. The result is an autonomous loop that can explain each decision and
              quantify ROI instantly.
            </p>
            <div className="space-y-3">
              {[
                "ML-driven peak tariff prediction",
                "Room occupancy pattern learning",
                "Phantom load isolation via relay",
                "Solar battery pre-charge scheduling",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm">
                  <CheckCircle size={14} className="text-green-savings shrink-0" />
                  <span className="text-muted">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4">
            {impactStats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
                className="glass-card p-5 metric-sheen shimmer-card hover-lift"
              >
                <stat.icon size={18} className="text-orange-electric mb-4" />
                <p className="text-muted text-xs mb-1">{stat.label}</p>
                <p className="font-mono-num text-2xl font-bold">
                  {stat.end ? (
                    <CountUp
                      target={stat.end}
                      prefix={stat.value.startsWith("Rs.") ? "Rs. " : ""}
                    />
                  ) : (
                    stat.value
                  )}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-electric/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 chip mb-5">
              <Zap size={12} /> Live Demo
            </div>
            <h2 className="font-heading text-3xl md:text-5xl font-bold mb-5">
              Ready to see PakGrid AI{" "}
              <span className="gradient-text-orange">in action</span>?
            </h2>
            <p className="text-muted mb-10 text-lg leading-relaxed">
              Watch the AI detect waste, shift loads, kill phantom power, and save real rupees — all in a
              live interactive demo designed for the Alibaba Cloud AI Hackathon 2026.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/dashboard" className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-2 border-glow-anim">
                <Zap size={18} /> Run Live Demo
              </Link>
              <Link href="/bill-doctor" className="btn-secondary text-lg px-10 py-4 inline-flex items-center gap-2">
                <BarChart3 size={18} /> Try Bill Doctor
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
