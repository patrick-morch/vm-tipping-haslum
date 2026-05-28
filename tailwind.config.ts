import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0B0F14",
        surface: "#121821",
        elevated: "#1A2230",
        border: "#243042",
        text: "#F5F7FA",
        muted: "#8A95A8",
        primary: "#22D39A",
        primaryDark: "#16A879",
        accent: "#3B82F6",
        danger: "#EF4444",
        warning: "#F59E0B",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
