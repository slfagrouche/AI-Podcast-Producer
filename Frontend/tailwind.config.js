/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out forwards',
        'fade-in-delay-1': 'fadeIn 0.5s ease-in-out 0.2s forwards',
        'fade-in-delay-2': 'fadeIn 0.5s ease-in-out 0.4s forwards',
        'fade-in-bottom': 'fadeInBottom 0.6s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInBottom: {
          '0%': { 
            opacity: '0',
            transform: 'translateY(20px)'
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0)'
          },
        },
        pulseGlow: {
          '0%, 100%': {
            boxShadow: '0 0 0 0 rgba(99, 102, 241, 0.4)',
          },
          '50%': {
            boxShadow: '0 0 0 10px rgba(99, 102, 241, 0)',
          },
        },
      },
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: theme('colors.gray.300'),
          },
        },
        light: {
          css: {
            color: theme('colors.gray.700'),
          },
        },
      }),
    },
  },
  plugins: [],
};