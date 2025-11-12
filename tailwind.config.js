/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: "#007aff",
        softbg: "#f9fafb",
      },
      borderRadius: {
        xl: "1rem",
      },
      boxShadow: {
        glow: "0 0 20px rgba(0,122,255,0.3)",
      },
    },
  },
  plugins: [],
};
