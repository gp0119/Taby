/** @type {import('tailwindcss').Config} */
export default {
  content: ["./newtab.html", "./popup.html", "./src/**/*.{js,ts,jsx,tsx,vue}"],
  theme: {
    extend: {
      boxShadow: {
        base: "1px 1px 5px 0px var(--shadowColor)",
        "base-lg": "2px 2px 5px 5px var(--shadowColor)",
        "hover-shadow": "var(--hoverShadow)",
        "btn-shadow": "var(--btnShadow)",
        "collection-shadow": "var(--collectionShadow)",
        "card-shadow": "var(--cardShadow)",
      },
      colors: {
        primary: "var(--primary)",
        "body-color": "var(--bodyBg)",
        "content-color": "var(--contentBg)",
        "card-color": "var(--cardBg)",
        "dialog-color": "var(--dialogBg)",
        "setting-color": "var(--settingBg)",
        "setting-card-color": "var(--settingCardBg)",
        "text-primary": "var(--textPrimary)",
        "text-secondary": "var(--textSecondary)",
        "border-color": "var(--borderColor)",
        "hover-color": "var(--hoverColor)",
        "shadow-color": "var(--shadowColor)",
        "error-color": "var(--errorColor)",
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
        show: {
          "0%": {
            opacity: "0",
          },
          "100%": {
            opacity: "1",
          },
        },
        hide: {
          "0%": {
            opacity: "1",
          },
          "100%": {
            opacity: "0",
          },
        },
        zoomInOut: {
          "0%, 100%": {
            transform: "scale(1)",
          },
          "50%": {
            transform: "scale(1.2)",
          },
        },
      },
      animation: {
        "scale-in": "scaleIn 0.2s ease-out",
        show: "show 0.2s ease-out",
        hide: "hide 0.2s ease-out",
        "zoom-in-out": "zoomInOut 0.3s ease-in-out",
      },
      screens: {
        400: "400px",
        600: "600px",
        800: "800px",
        1000: "1000px",
        1200: "1200px",
        1400: "1400px",
        1600: "1600px",
        1800: "1800px",
        2000: "2000px",
        2200: "2200px",
        2400: "2400px",
      },
    },
  },
  plugins: ["prettier-plugin-tailwindcss"],
}
