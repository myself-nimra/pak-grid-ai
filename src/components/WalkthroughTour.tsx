"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Play, Sparkles } from "lucide-react";

/* ────────────────────────────────────────────
   Tour step definition
──────────────────────────────────────────── */
interface TourStep {
  /** CSS selector for the highlighted element (use [data-tour="..."]) */
  target: string;
  title: string;
  description: string;
  /** Tooltip placement relative to the highlighted element */
  position: "top" | "bottom";
}

const TOUR_STEPS: TourStep[] = [
  {
    target: "[data-tour='metrics']",
    title: "Live Energy Metrics",
    description:
      "Your real-time dashboard at a glance — current power load, AI automation score, today's savings, and projected monthly savings. All values update live as the AI optimises your home.",
    position: "bottom",
  },
  {
    target: "[data-tour='scenarios']",
    title: "Scenario Selector",
    description:
      "Switch between three realistic scenarios — Evening Peak Rush (Lahore), Blackout Guardian (Karachi), and Night Phantom Hunt (Islamabad). Each simulates a different challenge Pakistani homes face daily.",
    position: "bottom",
  },
  {
    target: "[data-tour='chart']",
    title: "Consumption Comparison",
    description:
      "See actual vs AI-optimised energy consumption across the day. The green line shows how PakGrid AI flattens expensive peak-hour usage between 5 PM and 9 PM.",
    position: "bottom",
  },
  {
    target: "[data-tour='ai-status']",
    title: "PakGrid AI Brain",
    description:
      "The autonomous AI engine continuously analyses tariff signals, outage risk, occupancy patterns, and appliance priority. Watch it make decisions in real time when you run the demo.",
    position: "bottom",
  },
  {
    target: "[data-tour='autopilot']",
    title: "Autopilot Action Stack",
    description:
      "Every AI decision is logged here as an actionable step — from forecasting tariffs to isolating phantom loads. Green items are already executed by the ESP32 edge node.",
    position: "bottom",
  },
  {
    target: "[data-tour='alerts']",
    title: "Live Alert Feed",
    description:
      "Real-time notifications for every event — load spikes, phantom detection, battery protection, and savings milestones. This is your audit trail of AI activity.",
    position: "bottom",
  },
];

const STORAGE_KEY = "pakgrid_tour_done";

/* ────────────────────────────────────────────
   Component
──────────────────────────────────────────── */
export default function WalkthroughTour() {
  const [showWelcome, setShowWelcome] = useState(false);
  const [activeStep, setActiveStep] = useState(-1); // -1 = not touring
  const [rect, setRect] = useState<DOMRect | null>(null);
  const completedRef = useRef(false);

  /* Check localStorage on mount */
  useEffect(() => {
    try {
      completedRef.current = localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      /* SSR or privacy mode */
    }
  }, []);

  /* Scroll to element and measure */
  const measureTarget = useCallback((selector: string) => {
    const el = document.querySelector(selector);
    if (!el) {
      setRect(null);
      return;
    }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    // Small delay so scroll completes before measuring
    setTimeout(() => {
      setRect(el.getBoundingClientRect());
    }, 350);
  }, []);

  /* Public API: startTour is exposed via window for replay button */
  const startTour = useCallback(() => {
    setShowWelcome(false);
    setActiveStep(0);
    measureTarget(TOUR_STEPS[0].target);
  }, [measureTarget]);

  const goToStep = useCallback(
    (step: number) => {
      setActiveStep(step);
      measureTarget(TOUR_STEPS[step].target);
    },
    [measureTarget]
  );

  const handleNext = useCallback(() => {
    if (activeStep < TOUR_STEPS.length - 1) {
      goToStep(activeStep + 1);
    } else {
      finishTour();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep, goToStep]);

  const handlePrev = useCallback(() => {
    if (activeStep > 0) goToStep(activeStep - 1);
  }, [activeStep, goToStep]);

  const finishTour = useCallback(() => {
    setActiveStep(-1);
    setRect(null);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      /* ignore */
    }
  }, []);

  const handleSkip = useCallback(() => {
    finishTour();
  }, [finishTour]);

  /* Auto-show welcome modal if tour not completed */
  useEffect(() => {
    if (!completedRef.current) {
      const timer = setTimeout(() => setShowWelcome(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  /* Expose startTour globally so dashboard "Replay Tour" button can call it */
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__pakgridStartTour = startTour;
    return () => {
      delete (window as unknown as Record<string, unknown>).__pakgridStartTour;
    };
  }, [startTour]);

  /* Keyboard navigation */
  useEffect(() => {
    if (activeStep < 0) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") handleNext();
      else if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "Escape") handleSkip();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeStep, handleNext, handlePrev, handleSkip]);

  const isTouring = activeStep >= 0;
  const step = isTouring ? TOUR_STEPS[activeStep] : null;

  /* ─── Render ─── */
  return (
    <>
      {/* ══════════ WELCOME MODAL ══════════ */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            key="tour-welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowWelcome(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="glass-card p-8 max-w-md w-full border-orange-electric/30 text-center relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowWelcome(false)}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-muted hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={14} />
              </button>

              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-electric to-orange-deep flex items-center justify-center mx-auto mb-5 shadow-[0_0_40px_rgba(255,138,0,0.4)]">
                <Sparkles size={28} className="text-white" />
              </div>

              <h2 className="font-heading text-2xl font-bold mb-2">
                Welcome to{" "}
                <span className="text-orange-electric">PakGrid AI</span>
              </h2>
              <p className="text-muted text-sm leading-relaxed mb-6">
                Take a quick guided tour to discover how the AI Control Room
                works — from live metrics to autonomous energy optimisation.
                It only takes 30 seconds.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={startTour}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-3"
                >
                  <Play size={14} /> Start Tour
                </button>
                <button
                  onClick={() => {
                    setShowWelcome(false);
                    try {
                      localStorage.setItem(STORAGE_KEY, "true");
                    } catch {
                      /* ignore */
                    }
                  }}
                  className="btn-secondary flex-1 text-sm py-3"
                >
                  Skip
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════ TOUR OVERLAY ══════════ */}
      <AnimatePresence>
        {isTouring && step && (
          <motion.div
            key="tour-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[90] pointer-events-auto"
          >
            {/* Dark mask with cutout */}
            <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
              <defs>
                <mask id="tour-cutout-mask">
                  <rect width="100%" height="100%" fill="white" />
                  {rect && (
                    <rect
                      x={rect.left - 10}
                      y={rect.top - 10}
                      width={rect.width + 20}
                      height={rect.height + 20}
                      rx="14"
                      fill="black"
                    />
                  )}
                </mask>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill="rgba(0,0,0,0.72)"
                mask="url(#tour-cutout-mask)"
              />
            </svg>

            {/* Highlight border around target */}
            {rect && (
              <motion.div
                key={`highlight-${activeStep}`}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="absolute rounded-[14px] border-2 border-orange-electric/70 shadow-[0_0_30px_rgba(255,138,0,0.25)]"
                style={{
                  left: rect.left - 10,
                  top: rect.top - 10,
                  width: rect.width + 20,
                  height: rect.height + 20,
                  pointerEvents: "none",
                }}
              />
            )}

            {/* Skip button — top-right */}
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 z-[92] flex items-center gap-1.5 text-xs text-muted/80 hover:text-white bg-bg-panel/90 hover:bg-bg-panel px-3 py-1.5 rounded-full border border-white/10 transition-colors"
              aria-label="Skip tour"
            >
              <X size={12} /> Skip
            </button>

            {/* Step counter — top-left */}
            <div className="absolute top-4 left-4 z-[92] text-xs text-muted bg-bg-panel/90 px-3 py-1.5 rounded-full border border-white/10">
              <span className="text-orange-electric font-mono-num font-bold">
                {activeStep + 1}
              </span>{" "}
              / {TOUR_STEPS.length}
            </div>

            {/* ── Tooltip ── */}
            {rect && (
              <motion.div
                key={`tooltip-${activeStep}`}
                initial={{ opacity: 0, y: step.position === "bottom" ? -8 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 0 }}
                transition={{ duration: 0.25, delay: 0.15 }}
                className="absolute z-[92] w-[340px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-8rem)] overflow-y-auto"
                style={getTooltipPosition(rect, step.position)}
              >
                <div className="glass-card p-5 border-orange-electric/35 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
                  <h3 className="font-heading font-bold text-base mb-1.5 text-orange-electric">
                    {step.title}
                  </h3>
                  <p className="text-muted text-xs leading-relaxed mb-4">
                    {step.description}
                  </p>

                  <div className="flex items-center justify-between">
                    {/* Dots */}
                    <div className="flex gap-1.5">
                      {TOUR_STEPS.map((_, i) => (
                        <span
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${
                            i === activeStep
                              ? "bg-orange-electric w-4"
                              : i < activeStep
                              ? "bg-orange-electric/40"
                              : "bg-white/15"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Nav buttons */}
                    <div className="flex gap-2">
                      {activeStep > 0 && (
                        <button
                          onClick={handlePrev}
                          className="flex items-center gap-1 text-xs text-muted hover:text-white px-2.5 py-1.5 rounded-btn bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                          aria-label="Previous step"
                        >
                          <ChevronLeft size={12} /> Back
                        </button>
                      )}
                      <button
                        onClick={handleNext}
                        className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-btn bg-gradient-to-r from-orange-electric to-orange-deep text-white hover:shadow-[0_4px_15px_rgba(255,138,0,0.4)] transition-shadow"
                        aria-label={
                          activeStep === TOUR_STEPS.length - 1
                            ? "Finish tour"
                            : "Next step"
                        }
                      >
                        {activeStep === TOUR_STEPS.length - 1 ? (
                          "Got it!"
                        ) : (
                          <>
                            Next <ChevronRight size={12} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ────────────────────────────────────────────
   Helpers
──────────────────────────────────────────── */
function getTooltipPosition(
  rect: DOMRect,
  position: "top" | "bottom"
): React.CSSProperties {
  const gap = 16;
  const tooltipHeight = 200; // estimated max tooltip height
  const tooltipWidth = 340;
  const padding = 16;

  // Auto-flip if tooltip would overflow the viewport
  let finalPosition = position;
  if (
    position === "bottom" &&
    rect.bottom + tooltipHeight + gap > window.innerHeight - padding
  ) {
    finalPosition = "top";
  } else if (
    position === "top" &&
    rect.top - tooltipHeight - gap < padding
  ) {
    finalPosition = "bottom";
  }

  const left = Math.max(
    padding,
    Math.min(rect.left, window.innerWidth - tooltipWidth - padding)
  );

  if (finalPosition === "bottom") {
    return { top: rect.bottom + gap + 10, left };
  }

  // "top"
  return {
    bottom: window.innerHeight - rect.top + gap + 10,
    left,
  };
}
