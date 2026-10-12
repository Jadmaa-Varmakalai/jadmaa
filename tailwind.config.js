/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        jadmaa: {
          red: "#B12B2B",
          redDark: "#8C1E1E",
          charcoal: "#2B2521",
          cream: "#FAF6F0",
          creamLight: "#FFFDF9",
          border: "#E8DDD0",
          accentBlue: "#046BD2",
          textMuted: "#5C5148",
          cardBg: "#FFFFFF",
          gold: "#D4AF37",
        }
      },
      fontFamily: {
        heading: ["'Bricolage Grotesque'", "sans-serif"],
        body: ["'Poppins'", "sans-serif"],
        sans: ["'Poppins'", "sans-serif"],
      },
      boxShadow: {
        jadmaa: "0 4px 20px rgba(43, 37, 33, 0.08)",
        jadmaaHover: "0 10px 30px rgba(177, 43, 43, 0.12)",
      },
      animation: {
        float: "jdHeroFloat 4s ease-in-out infinite",
        marquee: "marquee 40s linear infinite",
      },
      keyframes: {
        jdHeroFloat: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        }
      }
    },
  },
  plugins: [],
}
