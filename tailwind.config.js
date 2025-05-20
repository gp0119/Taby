/** @type {import('tailwindcss').Config} */
export default {
  content: ["./newtab.html", "./popup.html", "./src/**/*.{js,ts,jsx,tsx,vue}"],
  theme: {
    extend: {
      boxShadow: {
        base: "1px 1px 5px 0px var(--shadowColor)",
        "base-lg": "2px 2px 5px 5px var(--shadowColor)",
        bottom: "0 6px 12px -4px var(--shadowColor)",
        "hover-shadow":
          "rgba(135, 145, 155, 0.3) 0px 3px 8px 0px, rgba(135, 145, 155, 0.08) 0px 0px 0px 1px",
        "btn-shadow":
          "0 1px 2px 0 rgba(142,149,173,0.64),0 0px 1px 1px rgba(142,149,173,0.1),inset 1px 1px 1px 0 rgba(255,255,255,0.81),inset -1px -1px 1px 0 #E2E4E9",
        "collection-shadow":
          "rgba(135, 145, 155, 0.2) 5px 10px 14px -10px, rgba(171, 174, 181, 0.08) 0px 6px 12px -4px",
        "card-shadow":
          "rgba(135, 145, 155, 0.2) 0px 3px 8px 0px, rgba(135, 145, 155, 0.08) 0px 0px 0px 1px",
      },
      dropShadow: {
        base: "1px 2px 4px rgba(112, 112, 140, 0.15)",
      },
      colors: {
        primary: "var(--primary)",
        "body-bg": "var(--bodyBg)",
        "content-bg": "var(--contentBg)",
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
      },
      animation: {
        "scale-in": "scaleIn 0.2s ease-out",
        show: "show 0.2s ease-out",
        hide: "hide 0.2s ease-out",
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
