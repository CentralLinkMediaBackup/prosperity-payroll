/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: {
        navy: { DEFAULT: '#1B3A5C', light: '#2563A8', dark: '#142d47' },
        accent: { DEFAULT: '#F47B20', light: '#f9a55a' },
        app: { bg: '#F4F6F9' },
        fringe: '#16a34a',
        ot: '#d97706',
        'tax-red': '#dc2626',
      },
      boxShadow: { card: '0 2px 8px rgba(0,0,0,0.08)' },
      borderRadius: { card: '10px' },
    },
  },
  plugins: [],
}
