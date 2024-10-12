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
        red: {
          450: "#F65077",
        },
      },
    },
  },
  plugins: ["prettier-plugin-tailwindcss"],
}
