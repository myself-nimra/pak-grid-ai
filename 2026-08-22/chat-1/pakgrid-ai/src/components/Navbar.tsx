"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Menu, X, Brain, UserCheck } from "lucide-react";

const links = [
  { href: "/",          label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/ai-agent",  label: "AI Agent" },
  { href: "/bill-doctor", label: "Bill Doctor" },
  { href: "/blackout",  label: "Blackout" },
  { href: "/planner",   label: "Planner" },
  { href: "/hardware",  label: "Hardware" },
  { href: "/login",     label: "Sign In" },
];

export function Navbar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-bg-deep/95 backdrop-blur-xl border-b border-white/8 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
          : "bg-bg-deep/80 backdrop-blur-md border-b border-white/4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-orange-electric to-orange-deep flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(255,138,0,0.5)] transition-shadow">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-heading font-bold text-lg">
            PakGrid <span className="text-orange-electric">AI</span>
          </span>
          {/* Live AI indicator */}
          <span className="hidden sm:flex items-center gap-1 ml-1 px-2 py-0.5 rounded-full bg-green-savings/10 border border-green-savings/25 text-[10px] font-medium text-green-savings">
            <span className="live-dot" style={{ width: 5, height: 5 }} />
            AI Active
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-0.5">
          {links.map((l) => {
            const isActive = path === l.href;
            const isLogin = l.href === "/login";
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative px-3 py-2 rounded-btn text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "text-orange-electric bg-orange-electric/10 font-semibold"
                    : isLogin
                    ? "text-orange-electric hover:bg-orange-electric/10 border border-orange-electric/30 ml-1"
                    : "text-muted hover:text-main hover:bg-white/5"
                }`}
              >
                {l.label}
                {isActive && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="nav-active-indicator"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
          <Link
            href="/dashboard"
            className="ml-2 btn-primary text-sm py-2 px-4 inline-flex items-center gap-1.5"
          >
            <Brain size={13} /> Launch Demo
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-main p-1 rounded-btn hover:bg-white/5 transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="md:hidden bg-bg-panel/98 backdrop-blur-xl border-t border-white/6 px-4 py-3 space-y-0.5"
          >
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`flex items-center px-3 py-2.5 rounded-btn text-sm transition-all ${
                  path === l.href
                    ? "text-orange-electric bg-orange-electric/10 font-medium"
                    : l.href === "/login"
                    ? "text-orange-electric font-semibold border border-orange-electric/30 bg-orange-electric/5 my-1"
                    : "text-muted hover:text-main hover:bg-white/5"
                }`}
              >
                {path === l.href && (
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-electric mr-2 shrink-0" />
                )}
                {l.label}
              </Link>
            ))}
            <div className="pt-2">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="btn-primary text-sm text-center w-full flex items-center justify-center gap-2"
              >
                <Brain size={13} /> Launch Demo
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
