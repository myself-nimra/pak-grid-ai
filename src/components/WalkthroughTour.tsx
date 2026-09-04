"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, ArrowRight, ArrowLeft, X, CheckCircle, Compass, Map,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Tour step definitions                                              */
/* ------------------------------------------------------------------ */
interface TourStep {
  target: string; // data-tour value
  title: string;
  description: string;
  badge: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: "scenarios",
    badge: "1 of 6 • Simulation",
    title: "Grid Simulation Scenarios",
    description:
      "Select real Pakistani city conditions: Lahore Evening Peak (PKR 58/unit), Karachi Blackout Guardian, or Islamabad Phantom Hunt. Watch the AI adapt to each profile.",
  },
  {
    target: "metrics",
    badge: "2 of 6 • Telemetry",
    title: "Real-Time Energy KPIs",
    description:
      "Live telemetry tracking current household demand in kW, AI autonomy score, daily PKR savings, and active NEPRA peak-tariff window status.",
  },
  {
    target: "chart",
    badge: "3 of 6 • Load Optimization",
    title: "Actual vs AI-Optimized Load",
    description:
      "Visual comparison between baseline consumption (red) and autonomous AI load curve (orange). Notice the heavy peak-hour load shaving between 5 PM and 9 PM.",
  },
  {
    target: "ai-status",
    badge: "4 of 6 • AI Core",
    title: "Explainable AI Decision Core",
    description:
      "Review the active AI agent status, real-time confidence scores (up to 94%), and the autonomous loop defending your household battery backup.",
  },
  {
    target: "autopilot",
    badge: "5 of 6 • Edge Actuation",
    title: "Autopilot Action Stack",
    description:
      "Hardware-level ESP32 relay actuation: compressor eco-throttling, water pump deferral, and physical standby socket disconnection.",
  },
  {
    target: "alerts",
    badge: "6 of 6 • Grid Intelligence",
    title: "Proactive Outage & Solar Alerts",
    description:
      "Real-time alerts for grid stability, solar generation, and battery pre-charging before predicted load-shedding windows.",
  },
];

/* ------------------------------------------------------------------ */
/*  Blur helpers                                                       */
/* ------------------------------------------------------------------ */
const BLUR_CLASS = "tour-blur-section";
const ACTIVE_CLASS = "tour-active-section";

function applyBlur(activeTarget: string) {
  if (typeof document === "undefined") return;
  const all = document.querySelectorAll<HTMLElement>("[data-tour]");
  all.forEach((el) => {
    const target = el.getAttribute("data-tour");
    if (target === activeTarget) {
      el.classList.remove(BLUR_CLASS);
      el.classList.add(ACTIVE_CLASS);
    } else {
      el.classList.remove(ACTIVE_CLASS);
      el.classList.add(BLUR_CLASS);
    }
  });
}

function clearBlur() {
  if (typeof document === "undefined") return;
  const all = document.querySelectorAll<HTMLElement>("[data-tour]");
  all.forEach((el) => {
    el.classList.remove(BLUR_CLASS, ACTIVE_CLASS);
  });
}

/* ------------------------------------------------------------------ */
/*  Viewport-relative rect (for fixed-position spotlight)             */
/* ------------------------------------------------------------------ */
interface SpotlightRect {
  top: number;   // viewport-relative
  left: number;
  width: number;
  height: number;
}

const PAD = 10; // padding around spotlight cutout

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function WalkthroughTour() {
  const [phase, setPhase] = useState<"idle" | "prompt" | "tour">("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  /* ---- spotlight positioning (viewport-relative) ---- */
  const updateSpotlight = useCallback((stepIdx: number) => {
    if (typeof window === "undefined") return;
    const step = TOUR_STEPS[stepIdx];
    if (!step) return;

    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        const rect = el.getBoundingClientRect();
        setSpotlight({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
        applyBlur(step.target);
      }, 400);
    } else {
      setSpotlight(null);
      clearBlur();
    }
  }, []);

  /* ---- lifecycle actions ---- */
  const showPrompt = useCallback(() => setPhase("prompt"), []);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setPhase("tour");
    setTimeout(() => updateSpotlight(0), 150);
  }, [updateSpotlight]);

  const endTour = useCallback(() => {
    setPhase("idle");
    setSpotlight(null);
    clearBlur();
    try { localStorage.setItem("pakgrid_tour_done", "1"); } catch { /* */ }
  }, []);

  const skipTour = useCallback(() => {
    setPhase("idle");
    setSpotlight(null);
    clearBlur();
    try { localStorage.setItem("pakgrid_tour_done", "1"); } catch { /* */ }
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev < TOUR_STEPS.length - 1) {
        const next = prev + 1;
        updateSpotlight(next);
        return next;
      }
      endTour();
      return prev;
    });
  }, [updateSpotlight, endTour]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev > 0) {
        const p = prev - 1;
        updateSpotlight(p);
        return p;
      }
      return prev;
    });
  }, [updateSpotlight]);

  /* ---- expose global starter + auto-launch ---- */
  useEffect(() => {
    if (typeof window === "undefined") return;
    (window as unknown as Record<string, unknown>).__pakgridStartTour = () => {
      try { localStorage.removeItem("pakgrid_tour_done"); } catch { /* */ }
      showPrompt();
    };
    showPrompt();
  }, [showPrompt]);

  /* ---- recalculate on resize ---- */
  useEffect(() => {
    if (phase !== "tour") return;
    const handleRecalc = () => updateSpotlight(currentStep);
    window.addEventListener("resize", handleRecalc);
    return () => window.removeEventListener("resize", handleRecalc);
  }, [phase, currentStep, updateSpotlight]);

  /* ---- keyboard navigation ---- */
  useEffect(() => {
    if (phase !== "tour") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") endTour();
      if (e.key === "ArrowRight") nextStep();
      if (e.key === "ArrowLeft") prevStep();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, currentStep, endTour, nextStep, prevStep]);

  /* ---- cleanup blur when tour ends ---- */
  useEffect(() => {
    if (phase !== "tour") clearBlur();
  }, [phase]);

  /* ---- compute card position: below spotlight or pinned to viewport bottom ---- */
  const cardPosition = useMemo(() => {
    if (!spotlight) return { mode: "bottom", top: 0 };
    const viewportH = typeof window !== "undefined" ? window.innerHeight : 800;
    const spotlightBottom = spotlight.top + spotlight.height;
    const spaceBelow = viewportH - spotlightBottom;
    // If enough room below spotlight -> card goes below.
    // Otherwise -> pin card to viewport bottom so it stays readable.
    if (spaceBelow > 260) {
      return { mode: "below", top: spotlightBottom + PAD + 16 };
    }
    return { mode: "bottom", top: 0 };
  }, [spotlight]);

  const isOpen = phase === "tour";
  const showPromptModal = phase === "prompt";
  const step = TOUR_STEPS[currentStep];

  /* ---- spotlight CSS clip-path for dark overlay with cutout ---- */
  const spotlightClip = useMemo(() => {
    if (!spotlight) return undefined;
    // We use 4 semi-transparent overlays instead of clip-path for better browser support
    return spotlight;
  }, [spotlight]);

  /* ================================================================== */
  /*  RENDER                                                             */
  /* ================================================================== */
  return (
    <AnimatePresence>
      {/* -------------------------------------------------------------- */}
      {/*  PRE-TOUR PROMPT MODAL                                         */}
      {/* -------------------------------------------------------------- */}
      {showPromptModal && (
        <motion.div
          key="prompt-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[250] flex items-center justify-center px-4"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={skipTour}
          />
          <motion.div
            key="prompt-card"
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="relative z-10 w-full max-w-md glass-card border border-orange-electric/40 shadow-[0_12px_60px_rgba(0,0,0,0.85)] bg-bg-panel/95 backdrop-blur-xl p-7 text-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.15 }}
              className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-electric/20 to-orange-deep/10 border border-orange-electric/30 flex items-center justify-center"
            >
              <Map size={28} className="text-orange-electric" />
            </motion.div>
            <h2 className="font-heading text-xl font-bold text-main mb-2">
              Welcome to PakGrid AI
            </h2>
            <p className="text-muted text-sm leading-relaxed mb-1">
              Do you want to join the tour?
            </p>
            <p className="text-muted/70 text-xs leading-relaxed mb-7">
              A quick 6-step guided walkthrough will show you how the AI Control
              Room optimizes your energy, detects phantom loads, and protects
              against outages.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={skipTour}
                className="flex-1 py-3 rounded-xl text-sm font-medium bg-white/5 text-muted border border-white/10 hover:bg-white/10 hover:text-main transition-all duration-200"
              >
                Skip
              </button>
              <button
                onClick={startTour}
                className="flex-1 py-3 rounded-xl text-sm font-semibold bg-orange-electric text-white shadow-[0_0_24px_rgba(255,138,0,0.4)] hover:bg-orange-deep hover:shadow-[0_0_32px_rgba(255,138,0,0.55)] transition-all duration-200 inline-flex items-center justify-center gap-2"
              >
                <Sparkles size={14} /> Accept
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* -------------------------------------------------------------- */}
      {/*  ACTIVE TOUR OVERLAY (spotlight + positioned card)             */}
      {/* -------------------------------------------------------------- */}
      {isOpen && step && (
        <div className="fixed inset-0 z-[200]">

          {/* === SPOTLIGHT OVERLAY: dark mask with a cutout hole === */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[201] pointer-events-auto"
            onClick={endTour}
          >
            {spotlightClip ? (
              <>
                {/* Top mask */}
                <div
                  className="absolute bg-black/70 backdrop-blur-[2px]"
                  style={{
                    top: 0,
                    left: 0,
                    right: 0,
                    height: Math.max(0, spotlightClip.top - PAD),
                  }}
                />
                {/* Bottom mask */}
                <div
                  className="absolute bg-black/70 backdrop-blur-[2px]"
                  style={{
                    top: spotlightClip.top + spotlightClip.height + PAD,
                    left: 0,
                    right: 0,
                    bottom: 0,
                  }}
                />
                {/* Left mask */}
                <div
                  className="absolute bg-black/70 backdrop-blur-[2px]"
                  style={{
                    top: Math.max(0, spotlightClip.top - PAD),
                    left: 0,
                    width: Math.max(0, spotlightClip.left - PAD),
                    height: spotlightClip.height + PAD * 2,
                  }}
                />
                {/* Right mask */}
                <div
                  className="absolute bg-black/70 backdrop-blur-[2px]"
                  style={{
                    top: Math.max(0, spotlightClip.top - PAD),
                    left: spotlightClip.left + spotlightClip.width + PAD,
                    right: 0,
                    height: spotlightClip.height + PAD * 2,
                  }}
                />
              </>
            ) : (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />
            )}
          </motion.div>

          {/* === SPOTLIGHT BORDER RING (around the cutout) === */}
          {spotlight && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{
                opacity: 1,
                scale: 1,
                top: spotlight.top - PAD,
                left: spotlight.left - PAD,
                width: spotlight.width + PAD * 2,
                height: spotlight.height + PAD * 2,
              }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="fixed z-[202] rounded-2xl border-2 border-orange-electric shadow-[0_0_35px_rgba(255,138,0,0.55)] pointer-events-none"
            />
          )}

          {/* === TOUR DIALOG CARD (dynamically positioned) === */}
          <motion.div
            key={`tour-card-${currentStep}`}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed left-4 right-4 z-[210] flex justify-center pointer-events-auto"
            style={
              cardPosition.mode === "below"
                ? { top: cardPosition.top }
                : { bottom: 16 }
            }
          >
            <div className="glass-card max-w-xl w-full p-5 border border-orange-electric/40 shadow-[0_10px_50px_rgba(0,0,0,0.85)] bg-bg-panel/95 backdrop-blur-xl relative">
              {/* Close button */}
              <button
                onClick={endTour}
                className="absolute top-3 right-3 p-1.5 rounded-full text-muted hover:text-main hover:bg-white/10 transition-colors"
                title="Close tour (Esc)"
              >
                <X size={15} />
              </button>

              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <span className="w-7 h-7 rounded-lg bg-orange-electric/15 border border-orange-electric/30 flex items-center justify-center text-orange-electric">
                  <Compass size={15} />
                </span>
                <span className="text-[11px] font-mono-num uppercase tracking-wider text-orange-electric font-semibold px-2 py-0.5 rounded-full bg-orange-electric/10 border border-orange-electric/20">
                  {step.badge}
                </span>
                <div className="flex gap-1 ml-auto mr-6">
                  {TOUR_STEPS.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === currentStep
                          ? "w-5 bg-orange-electric"
                          : i < currentStep
                          ? "w-1.5 bg-green-savings"
                          : "w-1.5 bg-white/20"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Content */}
              <h3 className="font-heading text-base font-bold text-main mb-1.5">
                {step.title}
              </h3>
              <p className="text-muted text-sm leading-relaxed mb-4">
                {step.description}
              </p>

              {/* Footer Navigation */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/8">
                <button
                  onClick={endTour}
                  className="text-xs text-muted hover:text-main transition-colors px-2 py-1"
                >
                  Skip Tour
                </button>
                <div className="flex items-center gap-2">
                  {currentStep > 0 && (
                    <button
                      onClick={prevStep}
                      className="btn-secondary text-xs px-3.5 py-2 inline-flex items-center gap-1.5"
                    >
                      <ArrowLeft size={13} /> Back
                    </button>
                  )}
                  <button
                    onClick={nextStep}
                    className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5 shadow-[0_0_20px_rgba(255,138,0,0.35)]"
                  >
                    {currentStep === TOUR_STEPS.length - 1 ? (
                      <><CheckCircle size={14} /> Got It!</>
                    ) : (
                      <>Next <ArrowRight size={13} /></>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

