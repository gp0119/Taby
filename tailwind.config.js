/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,vue}"],
  theme: {
    extend: {
      boxShadow: {
        base: "1px 1px 5px 0px var(--shadowColor)",
      },
      dropShadow: {
        base: "1px 2px 4px rgba(112, 112, 140, 0.15)",
      },
      colors: {
        primary: "var(--primary)",
        "darken-primary": "var(--darkenPrimary)",
        "body-color": "var(--bodyBackground)",
        "card-color": "var(--cardBackground)",
        "text-primary": "var(--textPrimary)",
        "text-secondary": "var(--textSecondary)",
        "border-color": "var(--borderColor)",
        "hover-color": "var(--hoverColor)",
        "shadow-color": "var(--shadowColor)",
        red: {
          450: "#F65077",
        },
      },
      sepia: {
        base: "var(--sepia)",
      },
      borderColor: {
        DEFAULT: "var(--borderColor)",
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
