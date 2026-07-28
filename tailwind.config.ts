import type { Config } from "tailwindcss";

// Reads a "R G B" CSS custom property so Tailwind's opacity modifiers
// (bg-gold/10, border-line/[0.07]) keep working across the light/dark
// token swap in app/globals.css.
function withOpacity(variable: string) {
  return ({ opacityValue }: { opacityValue?: string }) =>
    opacityValue === undefined ? `rgb(var(${variable}))` : `rgb(var(${variable}) / ${opacityValue})`;
}

// Tailwind's own Config type predates its documented function-value color
// support, so the opacity-aware palette below is cast through `unknown` —
// this is the standard pattern for CSS-variable-backed themes, not a hack.
const colors = {
  bg: withOpacity("--color-bg"),
  card: withOpacity("--color-card"),
  cardalt: withOpacity("--color-cardalt"),
  inputbg: withOpacity("--color-inputbg"),
  surface2: withOpacity("--color-surface2"),
  line: withOpacity("--color-line"),
  gold: withOpacity("--color-gold"),
  goldsolid: withOpacity("--color-goldsolid"),
  golddark: withOpacity("--color-golddark"),
  success: withOpacity("--color-success"),
  error: withOpacity("--color-error"),
  primary: withOpacity("--color-primary"),
  secondary: withOpacity("--color-secondary"),
  muted: withOpacity("--color-muted"),
  faint: withOpacity("--color-faint"),
} as unknown as Record<string, string>;

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors,
      fontFamily: {
        headline: ["var(--font-archivo)", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "18px",
      },
      keyframes: {
        pulseGold: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgb(var(--color-goldsolid) / 0.55)" },
          "50%": { boxShadow: "0 0 0 10px rgb(var(--color-goldsolid) / 0)" },
        },
        checkPop: {
          "0%": { transform: "scale(0)", opacity: "0" },
          "60%": { transform: "scale(1.15)", opacity: "1" },
          "100%": { transform: "scale(1)" },
        },
        floatSlow: { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        slideDown: { from: { transform: "translateY(-12px)", opacity: "0" }, to: { transform: "translateY(0)", opacity: "1" } },
        dotPing: { "0%, 100%": { transform: "scale(1)" }, "50%": { transform: "scale(1.3)" } },
        fadeInUp: { from: { transform: "translateY(8px)", opacity: "0" }, to: { transform: "translateY(0)", opacity: "1" } },
      },
      animation: {
        pulseGold: "pulseGold 2s infinite",
        checkPop: "checkPop 0.4s ease",
        floatSlow: "floatSlow 3s ease-in-out infinite",
        slideDown: "slideDown 0.2s ease",
        dotPing: "dotPing 1.4s ease-in-out infinite",
        fadeInUp: "fadeInUp 0.5s ease both",
      },
    },
  },
  plugins: [],
};
export default config;
