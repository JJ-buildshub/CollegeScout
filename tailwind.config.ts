import type { Config } from "tailwindcss";

/*
 * The whole site's colour is these ten values: `navy` is the dark brand
 * surface (hero, buttons), `gold` the highlight, `sand` the warm neutral that
 * replaced Tailwind's cool slate greys. Kept in one block so the scheme can be
 * swapped without touching a single component.
 */
/* palette:start */
const palette = {
  navy: { 950: "#071810", 900: "#10291c", 800: "#1a3b29", 700: "#27523a" },
  // Full scale: components reference 50/100/300/700 as well, and a missing
  // key emits no CSS at all rather than failing loudly — which is exactly
  // how the nav counters ended up with no text colour.
  gold: {
    50: "#f8fbe8",
    100: "#eef6c6",
    300: "#e0ef86",
    400: "#d6e85c",
    500: "#b4c93c",
    600: "#6f7d16",
    700: "#4f5a10",
  },
  sand: { 50: "#fdfbf7", 100: "#f1ece2", 200: "#e2d9c9" },
  // Tailwind's stock `slate` is a cool blue-grey, and text-slate-500 (147 uses)
  // is light enough that body copy reads as a caption. Remapped to a warm
  // charcoal scale: same class names, darker and warmer values, so secondary
  // text actually holds the page against the forest-green headings.
  slate: {
    50: "#faf8f4",
    100: "#f2efe8",
    200: "#e6e1d6",
    300: "#d3ccbf",
    400: "#9a9287",
    500: "#4a463e",
    600: "#33302a",
    700: "#26231e",
    800: "#1a1814",
    900: "#121008",
  },
};
/* palette:end */

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: palette,
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: [
          "var(--font-body)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06)",
        cardHover: "0 8px 24px -4px rgb(15 23 42 / 0.12), 0 2px 8px -2px rgb(15 23 42 / 0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
