/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // सुनिश्चित करें कि यह पाथ बिल्कुल ऐसा ही है
  ],
  darkMode: 'class', // यह डार्क मोड स्विच करने के लिए जरूरी है
  theme: {
    extend: {
      colors: {
        dharashakti: {
          light: '#f4f7f6',
          dark: '#0f172a',
        }
      }
    },
  },
  plugins: [],
}