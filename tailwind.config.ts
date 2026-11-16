import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1.25rem", screens: { "2xl": "1200px" } },
    extend: {
      colors: {
        // ألوان الهوية البصرية (AlSafa-Brand-Identity/06-Colors-Fonts/brand.css)
        navy: { DEFAULT: "#123B7A", 900: "#0B2550", 800: "#123B7A", 700: "#1C4C93", 100: "#E4ECF6", 50: "#F4F7FB" },
        teal: { DEFAULT: "#2A9CA3", 700: "#23868C", 300: "#5CC6C9", 100: "#E3F3F4" },
        ink: { DEFAULT: "#0B2550", soft: "#5B6B82", mute: "#8592A6" },
        line: "#DCE4EE",
      },
      boxShadow: { card: "0 10px 30px rgba(18, 59, 122, .08)" },
      backgroundImage: {
        // النمط الموجي من الهوية (background-pattern-*.svg)
        "wave-dark":
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cpath d='M-10,120 C30,120 50,40 90,40 S150,120 170,120' fill='none' stroke='%23fff' stroke-opacity='.07' stroke-width='2'/%3E%3Cpath d='M-10,150 C30,150 50,70 90,70 S150,150 170,150' fill='none' stroke='%23fff' stroke-opacity='.042' stroke-width='1.2'/%3E%3C/svg%3E\")",
        "wave-light":
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cpath d='M-10,120 C30,120 50,40 90,40 S150,120 170,120' fill='none' stroke='%23123B7A' stroke-opacity='.06' stroke-width='2'/%3E%3Cpath d='M-10,150 C30,150 50,70 90,70 S150,150 170,150' fill='none' stroke='%23123B7A' stroke-opacity='.035' stroke-width='1.2'/%3E%3C/svg%3E\")",
        "brand-gradient": "linear-gradient(135deg, #123B7A 0%, #0B2550 100%)",
        "accent-gradient": "linear-gradient(90deg, #2A9CA3 0%, #5CC6C9 100%)",
      },
      fontFamily: {
        sans: ["var(--font-ar)", "var(--font-en)", "system-ui", "sans-serif"],
        en: ["var(--font-en)", "var(--font-ar)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
