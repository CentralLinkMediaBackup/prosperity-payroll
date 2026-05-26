/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#2563eb',
          orange: '#f97316',
          'orange-dark': '#ea580c',
          sidebar: '#0f172a',
        },
        fringe: '#16a34a',
        ot: '#d97706',
        'tax-red': '#dc2626',
      },
    },
  },
  plugins: [],
}
