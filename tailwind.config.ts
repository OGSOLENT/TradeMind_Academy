import type { Config } from "tailwindcss";

/**
 * Design tokens, pulled out of the Stitch prototype in design/prototype.
 * I read trademind_design_system/DESIGN.md first, then checked the landing and
 * dashboard HTML to see how the values were really used. Any conflicts I
 * resolved in docs/DECISIONS.md. Every colour here goes through a CSS variable
 * in app/globals.css, and that's deliberate: it's what lets colour-blind mode
 * swap --bull and --bear at runtime without touching a single component.
 */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          deep: "var(--bg-deep)",
          base: "var(--bg-base)",
          elevated: "var(--bg-elevated)",
          "base-veil": "var(--bg-base-veil)",
          "elevated-veil": "var(--bg-elevated-veil)",
        },
        glass: {
          DEFAULT: "var(--surface-glass)",
          nav: "var(--glass-nav)",
        },
        hair: "var(--border-hair)",
        edge: "var(--border-edge)",
        fg: {
          primary: "var(--fg-primary)",
          secondary: "var(--fg-secondary)",
          muted: "var(--fg-muted)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          bright: "var(--accent-bright)",
          glow: "var(--accent-glow)",
        },
        mastery: {
          DEFAULT: "var(--mastery)",
          bright: "var(--mastery-bright)",
          glow: "var(--mastery-glow)",
        },
        warning: "var(--warning)",
        danger: {
          DEFAULT: "var(--danger)",
          deep: "var(--danger-deep)",
        },
        bull: "var(--bull)",
        bear: "var(--bear)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      fontSize: {
        // The type scale, straight from trademind_design_system/DESIGN.md.
        "display-lg": ["48px", { lineHeight: "56px", letterSpacing: "-0.02em", fontWeight: "600" }],
        "display-lg-mobile": ["32px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "600" }],
        "headline-md": ["24px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "500" }],
        "body-base": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "data-tabular": ["14px", { lineHeight: "20px", fontWeight: "500" }],
        "label-caps": ["12px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "600" }],
      },
      borderRadius: {
        card: "16px",
        control: "10px",
        pill: "999px",
      },
      spacing: {
        gutter: "20px",
        "margin-safe": "32px",
      },
      boxShadow: {
        hairline: "inset 0 0 0 1px var(--border-hair)",
        "edge-lit": "inset 0 1px 0 0 var(--border-edge), inset 0 0 0 1px rgba(255,255,255,0.03)",
        "glow-accent": "0 0 20px var(--accent-glow)",
        "glow-mastery": "0 0 20px var(--mastery-glow)",
        // A lifted card: the hairline stays, and a soft drop shadow sits under it.
        lift: "inset 0 1px 0 0 var(--border-edge), inset 0 0 0 1px rgba(255,255,255,0.05), 0 18px 40px -22px rgba(0,0,0,0.75), 0 0 24px -6px var(--accent-glow)",
      },
      backdropBlur: {
        glass: "20px",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        breathe: {
          "0%, 100%": { boxShadow: "0 0 12px var(--accent-glow)" },
          "50%": { boxShadow: "0 0 24px var(--accent-glow)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s linear infinite",
        breathe: "breathe 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
