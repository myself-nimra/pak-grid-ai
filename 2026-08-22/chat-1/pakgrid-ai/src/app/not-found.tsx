"use client";
import Link from "next/link";
import { Zap, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="pt-24 pb-16 min-h-screen grid-bg flex items-center justify-center px-4 text-center">
      <div className="glass-card p-8 max-w-md w-full border-orange-electric/20">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-electric to-orange-deep flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(255,138,0,0.4)]">
          <Zap size={32} className="text-white" />
        </div>
        <h1 className="font-heading text-4xl font-bold text-orange-electric mb-2">404</h1>
        <h2 className="font-heading text-xl font-semibold mb-2">Page Not Found</h2>
        <p className="text-muted text-xs mb-6 leading-relaxed">
          The requested route is not part of the PakGrid AI navigation framework.
        </p>
        <Link href="/" className="btn-primary text-xs py-2.5 px-5 inline-flex items-center gap-2">
          <ArrowLeft size={14} /> Return to Home
        </Link>
      </div>
    </div>
  );
}
