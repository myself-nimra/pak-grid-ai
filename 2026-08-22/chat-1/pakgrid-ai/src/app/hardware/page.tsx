"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Activity, Zap, ToggleLeft, Terminal, Wifi, CheckCircle, AlertCircle, Gauge, ArrowRight, Radio, Layers, DollarSign, Usb } from "lucide-react";

/* ── Web Serial API types ── */
interface EspData {
  voltage: number;
  current: number;
  power: number;
  energy_total: number;
  energy_today: number;
  energy_yesterday: number;
  relay_1: boolean;
  relay_2: boolean;
}

interface SerialPort {
  open: (options: { baudRate: number }) => Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
  close: () => Promise<void>;
}

declare global {
  interface Navigator {
    serial?: {
      requestPort: (options?: { filters?: { usbVendorId?: number }[] }) => Promise<SerialPort>;
    };
  }
}

const commandLog = [
  { time: "20:10:32", text: "ESP32 Boot: WiFi connected to PakGrid-Edge-AP", type: "info" },
  { time: "20:10:35", text: "ACS712 sensor reading received: 1414W active load", type: "info" },
  { time: "20:10:38", text: "Relay CH3 command executed: Disconnected standby socket (-143W)", type: "success" },
  { time: "20:10:42", text: "AC Eco setpoint transmitted to inverter via IR/GPIO", type: "info" },
  { time: "20:10:45", text: "Relay CH2: Water pump power deferred until 22:42", type: "warning" },
  { time: "20:10:48", text: "Battery pre-charge relay CH1 initialized (Grid off-peak)", type: "success" },
  { time: "20:11:01", text: "PakGrid Cloud API telemetry sync OK (Latency: 18ms)", type: "info" },
];

const archNodes = [
  { label: "ESP32 Core", sub: "Edge AI Microcontroller", icon: Cpu },
  { label: "ACS712 / PZEM", sub: "Current/Power Sensor", icon: Activity },
  { label: "4-Ch Relay", sub: "Appliance Switching", icon: ToggleLeft },
  { label: "Home Panel", sub: "AC, Pump, Sockets", icon: Zap },
  { label: "PakGrid Cloud", sub: "Telemetry & Control", icon: Wifi },
];

export default function HardwarePage() {
  const [mode, setMode] = useState<"demo" | "hardware">("demo");
  const [liveVoltage, setLiveVoltage] = useState(228);
  const [liveCurrent, setLiveCurrent] = useState(6.2);
  const [livePower, setLivePower] = useState(1414);
  const [logs, setLogs] = useState(commandLog);

  // ── ESP32 Web Serial state ──
  const [espData, setEspData] = useState<EspData | null>(null);
  const [espConnected, setEspConnected] = useState(false);
  const [espConnecting, setEspConnecting] = useState(false);
  const [espError, setEspError] = useState("");
  const espPortRef = useRef<SerialPort | null>(null);

  // Simulate live hardware metrics in demo mode
  useEffect(() => {
    if (mode !== "demo") return;
    setEspData(null);
    const interval = setInterval(() => {
      const v = 224 + Math.random() * 8;
      const c = 5.6 + Math.random() * 1.4;
      setLiveVoltage(v);
      setLiveCurrent(c);
      setLivePower(Math.round(v * c));
    }, 1800);
    return () => clearInterval(interval);
  }, [mode]);

  /* ── Connect to ESP32 via Web Serial ── */
  const connectToEsp32 = async () => {
    if (typeof window === "undefined") return;
    if (!navigator.serial) {
      setEspError("Web Serial API not supported. Use Chrome or Edge on desktop.");
      return;
    }
    try {
      setEspConnecting(true);
      setEspError("");
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 115200 });
      espPortRef.current = port;
      setEspConnected(true);
      setMode("hardware");
      readEsp32Loop(port);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to connect to ESP32";
      setEspError(msg);
      setEspConnected(false);
    } finally {
      setEspConnecting(false);
    }
  };

  const disconnectEsp32 = async () => {
    if (espPortRef.current) {
      try {
        await espPortRef.current.close();
      } catch { /* ignore */ }
      espPortRef.current = null;
    }
    setEspConnected(false);
    setEspData(null);
    setMode("demo");
  };

  const readEsp32Loop = async (port: SerialPort) => {
    let buffer = "";
    try {
      const textDecoder = new TextDecoderStream();
      if (!port.readable) return;
      const readableClosed = port.readable.pipeTo(textDecoder.writable as WritableStream<Uint8Array>);
      const reader = textDecoder.readable.getReader();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const parsed = JSON.parse(trimmed) as Partial<EspData>;
            if (
              typeof parsed.voltage === "number" &&
              typeof parsed.current === "number" &&
              typeof parsed.power === "number"
            ) {
              setEspData(parsed as EspData);
            }
          } catch {
            // Corrupted or partial JSON line — skip safely
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Serial read error";
      setEspError(msg);
    } finally {
      setEspConnected(false);
      setMode("demo");
    }
  };

  /* ── Cleanup serial port on unmount ── */
  useEffect(() => {
    return () => {
      if (espPortRef.current) {
        try {
          espPortRef.current.close();
        } catch { /* ignore */ }
      }
    };
  }, []);

  return (
    <div className="pt-20 pb-16 px-4 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="live-dot" />
            <span className="text-xs text-green-savings font-medium">ESP32 Hardware Bridge Connected</span>
          </div>
          <h1 className="font-heading text-3xl font-bold flex items-center gap-2">
            <Cpu className="text-orange-electric" size={28} />
            Hardware Proof Lab
          </h1>
          <p className="text-muted text-sm">Low-cost ESP32 microcontrollers, current sensors & relay modules — proving edge viability</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={espConnected ? disconnectEsp32 : connectToEsp32}
            disabled={espConnecting}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-btn text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              espConnected
                ? "bg-green-savings/15 text-green-savings border border-green-savings/30 hover:bg-green-savings/25"
                : "bg-ai/10 text-ai border border-ai/30 hover:bg-ai/20"
            }`}
            title={espConnected ? "Disconnect ESP32" : "Connect to ESP32 via USB serial"}
          >
            {espConnecting ? (
              <><span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" /> Connecting...</>
            ) : espConnected ? (
              <><Usb size={14} /> Disconnect</>
            ) : (
              <><Usb size={14} /> Connect to ESP32</>
            )}
          </button>

          {/* Mode Toggle */}
          <div className="glass-card px-4 py-2.5 flex items-center gap-3">
            <span className={`text-xs font-semibold ${mode === "demo" ? "text-orange-electric" : "text-muted"}`}>Simulated Edge</span>
            <button
              onClick={() => setMode(mode === "demo" ? "hardware" : "demo")}
              disabled={espConnected}
              className={`w-12 h-6 rounded-full transition-all ${mode === "hardware" ? "bg-green-savings" : "bg-orange-electric"} relative disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${mode === "hardware" ? "left-7" : "left-1"}`} />
            </button>
            <span className={`text-xs font-semibold ${mode === "hardware" ? "text-green-savings" : "text-muted"}`}>Live ESP32</span>
          </div>
        </div>
      </div>

      {/* Status Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        {[
          { label: "ESP32 Edge Chip", status: espConnected ? "Online" : mode === "demo" ? "Emulated" : "Standby", icon: Cpu, color: espConnected ? "green-savings" : mode === "demo" ? "warning" : "ai" },
          { label: "Current Sensor", status: "ACS712 Active", icon: Activity, color: "green-savings" },
          { label: "Relay Module", status: "4-Channel Ready", icon: ToggleLeft, color: "green-savings" },
          { label: "Cloud Sync", status: "18ms Latency", icon: Wifi, color: "green-savings" },
          { label: "Hardware Cost", status: "PKR 7,500 Total", icon: DollarSign, color: "ai" },
        ].map((s) => (
          <div key={s.label} className="glass-card p-3.5 flex items-center gap-3 hover-lift">
            <div className={`w-9 h-9 rounded-xl ${s.color === "green-savings" ? "bg-green-savings/10 text-green-savings" : s.color === "warning" ? "bg-warning/10 text-warning" : "bg-ai/10 text-ai"} flex items-center justify-center shrink-0`}>
              <s.icon size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted truncate">{s.label}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${s.color === "green-savings" ? "bg-green-savings" : s.color === "warning" ? "bg-warning" : "bg-ai"}`} />
                <span className="text-xs font-semibold truncate">{s.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Live Sensor Readings */}
        <div className="space-y-6">
          <div className="glass-card p-5 hover-lift">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="font-heading font-semibold">Live ESP32 Telemetry</h3>
              <div className="flex items-center gap-2">
                {mode === "hardware" && espConnected && <span className="live-dot" />}
                <span className={`text-[10px] font-mono-num px-2 py-0.5 rounded-full ${
                  mode === "hardware" && espConnected
                    ? "bg-green-savings/10 text-green-savings"
                    : mode === "hardware"
                    ? "bg-ai/10 text-ai"
                    : "bg-orange-electric/10 text-orange-electric"
                }`}>
                  {mode === "hardware" && espConnected
                    ? "Live serial stream"
                    : mode === "hardware"
                    ? "Hardware mode — connect to read"
                    : "Simulated: 10Hz"}
                </span>
              </div>
            </div>

            {espError && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-card bg-danger/10 border border-danger/30 text-danger text-xs flex items-start gap-2"
              >
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{espError}</span>
              </motion.div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <SensorCard
                label="Line Voltage"
                value={mode === "hardware" && espData ? espData.voltage.toFixed(1) : liveVoltage.toFixed(1)}
                unit="V"
                live={mode === "hardware" && espConnected}
              />
              <SensorCard
                label="Current Draw"
                value={mode === "hardware" && espData ? espData.current.toFixed(2) : liveCurrent.toFixed(2)}
                unit="A"
                live={mode === "hardware" && espConnected}
              />
              <SensorCard
                label="Active Power"
                value={mode === "hardware" && espData ? Math.round(espData.power).toString() : livePower.toString()}
                unit="W"
                highlight
                live={mode === "hardware" && espConnected}
              />
              <SensorCard
                label="Energy Today"
                value={mode === "hardware" && espData ? espData.energy_today.toFixed(3) : "14.600"}
                unit="kWh"
                live={mode === "hardware" && espConnected}
              />
              <SensorCard
                label="Energy Yesterday"
                value={mode === "hardware" && espData ? espData.energy_yesterday.toFixed(3) : "4.120"}
                unit="kWh"
                live={mode === "hardware" && espConnected}
              />
              <SensorCard
                label="Energy Total"
                value={mode === "hardware" && espData ? espData.energy_total.toFixed(3) : "154.321"}
                unit="kWh"
                live={mode === "hardware" && espConnected}
              />
            </div>

            {/* Relay Status */}
            <div className="mt-4 bg-bg-surface rounded-card p-3.5 border border-white/5 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-muted font-medium">Relay Channels</span>
              <div className="flex flex-wrap gap-2">
                {mode === "hardware" && espData ? (
                  <>
                    <RelayBadge label="Relay 1" active={espData.relay_1} />
                    <RelayBadge label="Relay 2" active={espData.relay_2} />
                  </>
                ) : (
                  <>
                    {[
                      { ch: "CH1 (Solar)", status: "ON", color: "badge-success" },
                      { ch: "CH2 (Pump)", status: "DELAY", color: "badge-warning" },
                      { ch: "CH3 (Standby)", status: "OFF", color: "badge-danger" },
                      { ch: "CH4 (AC Eco)", status: "ON", color: "badge-success" },
                    ].map((r) => (
                      <span key={r.ch} className={`text-[10px] px-2 py-1 rounded-full font-semibold ${r.color}`}>
                        {r.ch}: {r.status}
                      </span>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Architecture Diagram */}
          <div className="glass-card p-5 hover-lift">
            <h3 className="font-heading font-semibold mb-4">System Hardware Pipeline</h3>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {archNodes.map((node, i) => (
                <div key={node.label} className="flex items-center gap-1.5">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex flex-col items-center text-center w-24 p-2 rounded-card bg-bg-surface border border-white/5"
                  >
                    <div className="w-10 h-10 rounded-xl bg-orange-electric/15 border border-orange-electric/25 flex items-center justify-center mb-1.5">
                      <node.icon size={18} className="text-orange-electric" />
                    </div>
                    <span className="text-xs font-semibold text-main truncate w-full">{node.label}</span>
                    <span className="text-[9px] text-muted truncate w-full">{node.sub}</span>
                  </motion.div>
                  {i < archNodes.length - 1 && (
                    <ArrowRight size={12} className="text-orange-electric/40 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Console Command Log */}
        <div className="glass-card p-5 hover-lift">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Terminal size={18} className="text-orange-electric" />
              <h3 className="font-heading font-semibold">ESP32 Console Log</h3>
            </div>
            <span className="text-[10px] text-green-savings font-mono-num">UART / Baud: 115200</span>
          </div>

          <div className="bg-bg-deep rounded-card p-4 font-mono text-xs space-y-2.5 min-h-[320px] border border-white/5 max-h-[360px] overflow-y-auto">
            {logs.map((cmd, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-start gap-2">
                <span className="text-muted text-[10px] shrink-0">[{cmd.time}]</span>
                {cmd.type === "success" ? (
                  <CheckCircle size={12} className="text-green-savings shrink-0 mt-0.5" />
                ) : cmd.type === "warning" ? (
                  <AlertCircle size={12} className="text-warning shrink-0 mt-0.5" />
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full bg-ai/40 shrink-0 mt-1" />
                )}
                <span className={cmd.type === "success" ? "text-green-savings" : cmd.type === "warning" ? "text-warning" : "text-ai"}>
                  {cmd.text}
                </span>
              </motion.div>
            ))}
            <div className="text-orange-electric animate-pulse">█</div>
          </div>
        </div>
      </div>

      {/* Bill of Materials (BOM) */}
      <div className="glass-card p-6 mt-6 border-green-savings/20 border-glow-anim">
        <h3 className="font-heading font-semibold mb-4">Bill of Materials (Edge Deployment BOM)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          {[
            { item: "ESP32 Dev Board", cost: "Rs. 1,500" },
            { item: "PZEM-004T Meter", cost: "Rs. 1,400" },
            { item: "ACS712 Sensor", cost: "Rs. 600" },
            { item: "4-Ch Relay Module", cost: "Rs. 800" },
            { item: "5V/3A Power Supply", cost: "Rs. 700" },
            { item: "DIN Rail Enclosure", cost: "Rs. 1,200" },
            { item: "0.96\" OLED Display", cost: "Rs. 800" },
            { item: "Wiring & Connectors", cost: "Rs. 500" },
          ].map((h) => (
            <div key={h.item} className="bg-bg-surface rounded-card p-3 border border-white/5">
              <p className="text-xs text-muted mb-1">{h.item}</p>
              <p className="font-mono-num font-bold text-orange-electric">{h.cost}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center mt-5 p-4 bg-green-savings/10 rounded-card border border-green-savings/25">
          <div>
            <span className="text-sm font-bold text-main">Total Hardware Cost</span>
            <p className="text-xs text-muted">Complete edge kit for standard Pakistani households</p>
          </div>
          <motion.span
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="font-mono-num font-bold text-green-savings text-2xl"
          >
            Rs. 7,500
          </motion.span>
        </div>
      </div>
    </div>
  );
}

function SensorCard({ label, value, unit, highlight, live }: { label: string; value: string; unit: string; highlight?: boolean; live?: boolean }) {
  return (
    <div className={`p-4 rounded-card transition-all ${highlight ? "bg-orange-electric/10 border border-orange-electric/30 glow-orange" : live ? "bg-green-savings/5 border border-green-savings/20" : "bg-bg-surface border border-white/5"}`}>
      <div className="flex items-center gap-2 mb-1">
        {live && <span className="w-1.5 h-1.5 rounded-full bg-green-savings animate-pulse" />}
        <p className="text-xs text-muted">{label}</p>
      </div>
      <div className="flex items-baseline gap-1">
        <motion.span
          key={value}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          className={`font-mono-num text-2xl font-bold ${highlight ? "text-orange-electric" : "text-main"}`}
        >
          {value}
        </motion.span>
        <span className="text-xs text-muted">{unit}</span>
      </div>
    </div>
  );
}

function RelayBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border ${
      active
        ? "bg-green-savings/10 text-green-savings border-green-savings/30"
        : "bg-white/5 text-muted border-white/10"
    }`}>
      <span className={`w-2 h-2 rounded-full ${active ? "bg-green-savings animate-pulse" : "bg-muted/40"}`} />
      {label}: {active ? "ON" : "OFF"}
    </div>
  );
}
