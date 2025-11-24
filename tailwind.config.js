/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sus: {
          blue: '#005D99',
          green: '#009639',
          light: '#E6F4FA',
        }
      }
    },
  },
  plugins: [],
}
