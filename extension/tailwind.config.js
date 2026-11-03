/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FAF8F5',
          100: '#F5F1E8',
          200: '#EBE4D5',
          300: '#E0D6BF',
          400: '#CFC09F',
        },
        gold: {
          300: '#E6CA65',
          400: '#D4AF37',
          500: '#C5A059',
          600: '#AA8232',
          700: '#89651E',
        }
      },
      fontFamily: {
        serif: ['Georgia', 'serif'],
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
