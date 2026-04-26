import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)"],
        mono: ["var(--font-mono)"],
        body: ["var(--font-body)"],
      },
      colors: {
        "bg-primary": "#080A0C",
        "bg-secondary": "#0D1014",
        surface: "#141A1F",
        "surface-hover": "#1A2229",
        border: "#1E2D38",
        "border-accent": "#243340",
        amber: "#E87C1E",
        "amber-glow": "#F59342",
        "amber-dim": "#7A3C0A",
        cyan: "#1DE9C8",
        primary: "#C8D8E4",
        muted: "#5A7080",
        dimtext: "#3A4D5A",
      },
      animation: {
        "pulse-dot": "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
        "blink": "blink 1s step-end infinite",
      },
      keyframes: {
        blink: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
    },
  },
} satisfies Config;

