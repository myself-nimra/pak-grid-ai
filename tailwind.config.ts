import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: { deep: "#030303", near: "#080808", panel: "#111111", surface: "#171717" },
        orange: { electric: "#FF8A00", deep: "#FF6A00", golden: "#FFB000" },
        green: { savings: "#16F08B", success: "#22C55E" },
        warning: "#F59E0B",
        danger: "#EF4444",
        ai: "#38BDF8",
        muted: "#A3A3A3",
        main: "#F8FAFC",
      },
      fontFamily: {
        heading: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: { card: "10px", btn: "8px" },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "energy-flow": "dash 2s linear infinite",
        "fade-up": "fadeUp 0.5s ease-out forwards",
        "count-up": "countUp 1s ease-out forwards",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        dash: { "0%": { strokeDashoffset: "100" }, "100%": { strokeDashoffset: "0" } },
        fadeUp: { "0%": { opacity: "0", transform: "translateY(20px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        countUp: { "0%": { opacity: "0", transform: "translateY(10px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        glow: { "0%": { boxShadow: "0 0 5px rgba(255,138,0,0.3)" }, "100%": { boxShadow: "0 0 20px rgba(255,138,0,0.6)" } },
      },
    },
  },
  plugins: [],
};
export default config;
