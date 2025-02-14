/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,vue}"],
  theme: {
    extend: {
      boxShadow: {
        full: "0 0 -2px rgba(112, 112, 140, 0.2)",
        base: "rgba(112, 112, 140, 0.15) 1px 2px 4px",
        card: "rgba(94, 93, 102, 0.08) 1px 1px 0px 0px, rgba(94, 93, 102, 0.1) 2px 2px 3px 0px",
      },
      dropShadow: {
        base: "1px 2px 4px rgba(112, 112, 140, 0.15)",
      },
      colors: {
        primary: "var(--primary)",
        "darken-primary": "var(--darken-primary)",
        "body-bg": "var(--body-background)",
        "card-bg": "var(--card-background)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        borderColor: "var(--border-color)",
        red: {
          450: "#F65077",
        },
      },
      keyframes: {
        scaleIn: {
          "0%": {
            transform: "scale(0)",
            opacity: "0",
          },
          "100%": {
            transform: "scale(1)",
            opacity: "1",
          },
        },
      },
      animation: {
        "scale-in": "scaleIn 0.2s ease-out",
      },
    },
  },
  plugins: ["prettier-plugin-tailwindcss"],
}
