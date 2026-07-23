import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0a",
        card: "#141414",
        cardalt: "#111111",
        inputbg: "#1c1c1c",
        gold: "#D4AF37",
        golddark: "#a8842a",
        success: "#5fce89",
        error: "#e07070",
        primary: "#f5f5f0",
        secondary: "#a3a39c",
        muted: "#8f8f89",
        faint: "#6b6b66",
      },
      fontFamily: {
        headline: ["var(--font-archivo)", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "18px",
      },
      keyframes: {
        poleScroll: { from: { backgroundPosition: "0 0" }, to: { backgroundPosition: "0 40px" } },
        pulseGold: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(212,175,55,0.55)" },
          "50%": { boxShadow: "0 0 0 10px rgba(212,175,55,0)" },
        },
        checkPop: {
          "0%": { transform: "scale(0)", opacity: "0" },
          "60%": { transform: "scale(1.15)", opacity: "1" },
          "100%": { transform: "scale(1)" },
        },
        floatSlow: { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        slideDown: { from: { transform: "translateY(-12px)", opacity: "0" }, to: { transform: "translateY(0)", opacity: "1" } },
        dotPing: { "0%, 100%": { transform: "scale(1)" }, "50%": { transform: "scale(1.3)" } },
      },
      animation: {
        poleScroll: "poleScroll 1.1s linear infinite",
        pulseGold: "pulseGold 2s infinite",
        checkPop: "checkPop 0.4s ease",
        floatSlow: "floatSlow 3s ease-in-out infinite",
        slideDown: "slideDown 0.2s ease",
        dotPing: "dotPing 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
