import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AgentStatusBar } from "@/components/AgentStatusBar";

export const metadata: Metadata = {
  title: "PakGrid AI - Smart Energy Optimization",
  description: "AI-powered home energy optimization for Pakistani electricity bills",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg-deep text-main font-body min-h-screen">
        <Navbar />
        <main className="pb-12">{children}</main>
        <Footer />
        <AgentStatusBar />
      </body>
    </html>
  );
}
