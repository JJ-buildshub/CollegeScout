import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#050b1a",
          900: "#0a1428",
          800: "#0f1d3a",
          700: "#16294d",
        },
        gold: {
          400: "#f2c14e",
          500: "#e3a83b",
          600: "#c98a1f",
        },
      },
      fontFamily: {
        sans: [
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
