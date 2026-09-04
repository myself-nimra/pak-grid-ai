"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Zap, Brain, Calendar, Shield, Wifi, ArrowRight } from "lucide-react";

// Sleek Live savings counter
function CompactLiveCounter() {
  const [amount, setAmount] = useState(6550);

  useEffect(() => {
    const tick = () => {
      setAmount((prev) => Math.round((prev + 0.08) * 100) / 100);
    };
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, []);

  const full = Math.floor(amount);
  const frac = Math.round((amount - full) * 100).toString().padStart(2, "0");

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-savings/10 border border-green-savings/20">
      <span className="live-dot" />
      <span className="text-xs text-muted font-medium">Session Savings:</span>
      <span className="font-mono-num font-bold text-green-savings text-sm">
        Rs. {full.toLocaleString()}.<span className="text-xs text-green-savings/70">{frac}</span>
      </span>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#050505] text-main pt-12 pb-8 relative overflow-hidden">
      {/* Sleek top glowing border */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-orange-electric/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4">
        {/* Top Header Strip */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-8 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-electric to-orange-deep flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(255,138,0,0.4)] transition-shadow">
                <Zap size={16} className="text-white" />
              </div>
              <span className="font-heading font-bold text-lg">
                PakGrid <span className="text-orange-electric">AI</span>
              </span>
            </Link>
            <span className="text-xs text-muted hidden sm:inline-block">| Next-Gen Energy Optimizer</span>
          </div>

          {/* Compact Live Counter & Hackathon Tag */}
          <div className="flex flex-wrap items-center gap-3">
            <CompactLiveCounter />
            <span className="text-xs chip py-1 px-3">
              Alibaba Cloud AI Hackathon 2026 🇵🇰
            </span>
          </div>
        </div>

        {/* Proportional Grid Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-8 text-xs">
          <div>
            <h4 className="font-heading font-semibold text-main text-sm mb-3 text-orange-electric">Core Agent</h4>
            <ul className="space-y-2 text-muted">
              <li><Link href="/dashboard" className="hover:text-main transition-colors">Live Control Room</Link></li>
              <li><Link href="/ai-agent" className="hover:text-main transition-colors">Appliance Automation</Link></li>
              <li><Link href="/bill-doctor" className="hover:text-main transition-colors">AI Bill Doctor</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-main text-sm mb-3 text-orange-electric">Protection</h4>
            <ul className="space-y-2 text-muted">
              <li><Link href="/blackout" className="hover:text-main transition-colors">Blackout Guardian</Link></li>
              <li><Link href="/planner" className="hover:text-main transition-colors">Tariff Schedule Planner</Link></li>
              <li><Link href="/hardware" className="hover:text-main transition-colors">ESP32 Hardware Proof</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-main text-sm mb-3 text-orange-electric">Key Metrics</h4>
            <ul className="space-y-2 text-muted">
              <li className="flex items-center justify-between"><span>Bill Savings:</span><strong className="text-green-savings font-mono-num">20–30%</strong></li>
              <li className="flex items-center justify-between"><span>Edge Hardware:</span><strong className="text-orange-golden font-mono-num">Rs. 7-8K</strong></li>
              <li className="flex items-center justify-between"><span>Backup Extend:</span><strong className="text-ai font-mono-num">+2.1 Hours</strong></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-main text-sm mb-3 text-orange-electric">Get Started</h4>
            <p className="text-muted leading-relaxed mb-3">Experience autonomous tariff shifting & phantom load elimination.</p>
            <Link href="/dashboard" className="btn-primary text-xs py-2 px-3 inline-flex items-center gap-1.5 w-full justify-center">
              Launch Demo <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Sleek Bottom Bar */}
        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-muted gap-3">
          <p>© 2026 PakGrid AI. All rights reserved. Built for Bano Qabil & Alibaba Cloud AI Hackathon.</p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-ai"><Brain size={12} /> AI ML Engine</span>
            <span className="flex items-center gap-1 text-green-savings"><Shield size={12} /> ESP32 Edge</span>
            <span className="flex items-center gap-1 text-orange-electric"><Wifi size={12} /> Real-time Sync</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
