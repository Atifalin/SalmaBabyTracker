/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        cream: '#FFF8F0',
        lavender: '#E6E6FA',
        pastelBlue: '#B4D4FF',
        mintGreen: '#B5EAD7',
        peach: '#FFD4B2',
        warmYellow: '#FFF4A3',
      },
    },
  },
  plugins: [],
}
