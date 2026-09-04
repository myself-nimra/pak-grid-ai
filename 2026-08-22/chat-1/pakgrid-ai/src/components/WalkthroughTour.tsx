"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, ArrowLeft, X, CheckCircle, Compass } from "lucide-react";

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

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export default function WalkthroughTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null);

  // Position highlight box over active target element
  const updateHighlight = useCallback((stepIdx: number) => {
    if (typeof window === "undefined") return;
    const step = TOUR_STEPS[stepIdx];
    if (!step) return;

    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const rect = el.getBoundingClientRect();
      setHighlightRect({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      });
    } else {
      setHighlightRect(null);
    }
  }, []);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsOpen(true);
    setTimeout(() => updateHighlight(0), 100);
  }, [updateHighlight]);

  const endTour = useCallback(() => {
    setIsOpen(false);
    setHighlightRect(null);
    try {
      localStorage.setItem("pakgrid_tour_done", "1");
    } catch {
      /* ignore */
    }
  }, []);

  const nextStep = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      updateHighlight(next);
    } else {
      endTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      updateHighlight(prev);
    }
  };

  // Expose global starter function for the "Tour" button
  useEffect(() => {
    if (typeof window === "undefined") return;
    (window as unknown as Record<string, unknown>).__pakgridStartTour = startTour;

    // Check if first-time visitor
    try {
      const done = localStorage.getItem("pakgrid_tour_done");
      if (!done) {
        // Auto-launch after 1.2s on first visit
        const timer = setTimeout(() => {
          startTour();
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      /* ignore */
    }
  }, [startTour]);

  // Recalculate on window resize or scroll
  useEffect(() => {
    if (!isOpen) return;
    const handleRecalc = () => updateHighlight(currentStep);
    window.addEventListener("resize", handleRecalc);
    return () => window.removeEventListener("resize", handleRecalc);
  }, [isOpen, currentStep, updateHighlight]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") endTour();
      if (e.key === "ArrowRight") nextStep();
      if (e.key === "ArrowLeft") prevStep();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStep, endTour]);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] pointer-events-none">
        {/* Dark backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-[2px] pointer-events-auto"
          onClick={endTour}
        />

        {/* Highlight ring on target element */}
        {highlightRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{
              opacity: 1,
              scale: 1,
              top: highlightRect.top - 8,
              left: highlightRect.left - 8,
              width: highlightRect.width + 16,
              height: highlightRect.height + 16,
            }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="absolute z-[201] rounded-2xl border-2 border-orange-electric shadow-[0_0_35px_rgba(255,138,0,0.55)] pointer-events-none"
            style={{ position: "absolute" }}
          />
        )}

        {/* Tour Dialog Card */}
        <div className="fixed inset-x-4 bottom-6 md:bottom-10 z-[210] flex justify-center pointer-events-auto">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="glass-card max-w-xl w-full p-6 border border-orange-electric/40 shadow-[0_10px_50px_rgba(0,0,0,0.85)] bg-bg-panel/95 backdrop-blur-xl relative"
          >
            {/* Close button */}
            <button
              onClick={endTour}
              className="absolute top-4 right-4 p-1.5 rounded-full text-muted hover:text-main hover:bg-white/10 transition-colors"
              title="Close tour (Esc)"
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-lg bg-orange-electric/15 border border-orange-electric/30 flex items-center justify-center text-orange-electric">
                <Compass size={16} />
              </span>
              <span className="text-[11px] font-mono-num uppercase tracking-wider text-orange-electric font-semibold px-2 py-0.5 rounded-full bg-orange-electric/10 border border-orange-electric/20">
                {step.badge}
              </span>
              <div className="flex gap-1 ml-auto mr-7">
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
            <h3 className="font-heading text-lg font-bold text-main mb-2">
              {step.title}
            </h3>
            <p className="text-muted text-sm leading-relaxed mb-6">
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
                    <>
                      <CheckCircle size={14} /> Got It!
                    </>
                  ) : (
                    <>
                      Next <ArrowRight size={13} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
