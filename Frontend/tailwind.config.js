/** @type {import('tailwindcss').Config} */

import defaultTheme from "tailwindcss/defaultTheme";
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#050816",
        secondary: "#aaa6c3",
        tertiary: "#151030",
        "black-100": "#100d25",
        "black-200": "#090325",
        "white-100": "#f3f3f3",
        green: "oklch(74.6% 0.16 232.661)",
        orange: "#FFDB00",
        update: "#ED8D1D",
      },
      fontFamily: {
        vazirmatn: ["Vazirmatn", "Arial", "sans-serif"],
        Ray: ["Ray"],
        Ray_black: ["Ray_black"],
        Ray_text: ["Ray_text"],
      },
      container: {
        padding: {
          DEFAULT: "0.5rem",
          sm: "0.5rem",
          lg: "1rem",
          xl: "2rem",
          "2xl": "3rem",
        },
      },
    },
  },
  plugins: [],
};
