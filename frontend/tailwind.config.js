/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#080b14',
          800: '#0d1117',
          700: '#111827',
          600: '#1a2234',
          500: '#1e2d45',
        },
        accent: {
          blue: '#3b82f6',
          purple: '#8b5cf6',
          pink: '#ec4899',
          green: '#10b981',
          red: '#ef4444',
        }
      },
      backgroundImage: {
        'gradient-chart': 'linear-gradient(180deg, #8b5cf6 0%, #ec4899 50%, #3b82f6 100%)',
      }
    },
  },
  plugins: [],
}  