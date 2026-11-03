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
        },
        charcoal: {
          900: '#121417',
          800: '#1D2127',
          700: '#2A3039',
        }
      },
      fontFamily: {
        serif: ['Cinzel', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(197, 160, 89, 0.08), 0 2px 10px 0 rgba(0, 0, 0, 0.04)',
        'glass-hover': '0 12px 40px 0 rgba(197, 160, 89, 0.18), 0 4px 16px 0 rgba(0, 0, 0, 0.06)',
        'gold-glow': '0 0 25px -3px rgba(212, 175, 55, 0.35)',
      }
    },
  },
  plugins: [],
}
