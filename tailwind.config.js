/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ide: {
          bg: '#1e1e2e',
          sidebar: '#181825',
          panel: '#11111b',
          border: '#313244',
          accent: '#89b4fa',
          hover: '#45475a',
          text: '#cdd6f4',
          subtext: '#a6adc8',
          success: '#a6e3a1',
          warning: '#f9e2af',
          error: '#f38ba8',
        }
      }
    },
  },
  plugins: [],
}
