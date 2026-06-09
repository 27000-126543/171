/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        dark: {
          900: '#0F172A',
          800: '#1B2A4A',
          700: '#243B6A',
          600: '#2D4A7A',
          500: '#3A5A8A',
        },
        amber: {
          500: '#F0A500',
          400: '#F5B800',
          300: '#FACA4C',
        },
        emerald: {
          500: '#10B981',
          400: '#34D399',
        },
      },
      fontFamily: {
        mono: ['DM Mono', 'monospace'],
        sans: ['Noto Sans SC', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'border-pulse-red': 'borderPulseRed 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        borderPulseRed: {
          '0%, 100%': { borderColor: 'rgba(239, 68, 68, 0.3)', boxShadow: '0 0 0 0 rgba(239, 68, 68, 0)' },
          '50%': { borderColor: 'rgba(239, 68, 68, 0.8)', boxShadow: '0 0 12px 2px rgba(239, 68, 68, 0.3)' },
        },
      },
    },
  },
  plugins: [],
};
