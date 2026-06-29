import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-deep": "#050d1a",
        "bg-panel": "#0d1a2e",
        "bg-panel-alt": "#112236",
        "bg-header": "#16263d",
        "bg-lcd": "#071a12",
        line: "#1c3350",
        "line-soft": "#142640",
        accent: "#35c5f0",
        "accent-dim": "#1c5f78",
        good: "#2fe2a0",
        "good-dim": "#0f4a38",
        warn: "#ffb648",
        alarm: "#ff5468",
        air: "#7fa8c9",
        "text-hi": "#eaf3fc",
        "text-mid": "#8fa6c2",
        "text-low": "#4d6485",
      },
      fontFamily: {
        grotesk: ["var(--font-grotesk)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
      },
      keyframes: {
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
      },
      animation: {
        pulse: "pulse 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
