/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        disaster: {
          low: '#10b981',
          medium: '#f59e0b',
          high: '#ef4444',
          critical: '#7f1d1d'
        }
      }
    },
  },
  plugins: [],
}
