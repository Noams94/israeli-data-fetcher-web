import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#212121",
        "bg-alt": "#171717",
        card: "#2f2f2f",
        "card-border": "#383838",
        text: "#ececec",
        muted: "#9aa0a6",
        primary: {
          DEFAULT: "#10a37f",
          hover: "#0e8f6f",
          soft: "rgba(16,163,127,0.12)",
          ring: "rgba(16,163,127,0.25)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        heb: ["var(--font-heb)", "var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        pill: "999px",
        chip: "20px",
        search: "28px",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
