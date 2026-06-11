import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 20px 60px rgba(15, 23, 42, 0.10)",
        glow: "0 20px 80px rgba(99, 102, 241, 0.25)"
      }
    }
  },
  plugins: []
};

export default config;
