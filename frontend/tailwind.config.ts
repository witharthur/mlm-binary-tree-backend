import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#070816",
          900: "#0b1020",
          850: "#11172a",
          800: "#151b2e",
          700: "#20283d"
        },
        acid: {
          400: "#c7ff4a",
          500: "#a6ff00",
          600: "#80d400"
        },
        mint: {
          400: "#36f2b2",
          500: "#10d99a"
        },
        rosegold: {
          400: "#ffb8a5",
          500: "#ff8f70"
        }
      },
      boxShadow: {
        glow: "0 0 40px rgba(166, 255, 0, 0.16)",
        panel: "0 24px 70px rgba(0, 0, 0, 0.32)"
      },
      backgroundImage: {
        "dashboard-mesh":
          "radial-gradient(circle at 20% 10%, rgba(166,255,0,0.14), transparent 28%), radial-gradient(circle at 80% 0%, rgba(54,242,178,0.12), transparent 30%), linear-gradient(135deg, #070816 0%, #101525 48%, #0a0d18 100%)"
      }
    }
  },
  plugins: []
};

export default config;
