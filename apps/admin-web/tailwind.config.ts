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
        primary: {
          DEFAULT: "#176B32",
          50: "#F0FDF3",
          100: "#DCFCE4",
          200: "#BBF7CD",
          300: "#86EFAB",
          400: "#4ADE80",
          500: "#22C55E",
          600: "#176B32",
          700: "#166534",
          800: "#14532D",
          900: "#052E16",
          950: "#021A0C",
        },
        accent: {
          DEFAULT: "#F5F7FA",
          dark: "#E5E7EB",
        },
        sidebar: {
          DEFAULT: "#176B32",
          hover: "#14532D",
          text: "#DCFCE4",
          active: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-in": "slideIn 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateX(-10px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;