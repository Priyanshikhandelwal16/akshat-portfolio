/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0A0A0A',
          secondary: '#141414',
          darker: '#060606',
        },
        accent: {
          DEFAULT: '#FFB800', // Gold
          secondary: '#FF6B35', // Orange
        },
        text: {
          primary: '#FFFFFF',
          muted: '#A8A8A8',
        },
        border: {
          light: 'rgba(255, 255, 255, 0.08)',
          glow: 'rgba(255, 184, 0, 0.25)',
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'],
        display: ['"Lora"', 'serif'],
        mono: ['"Syncopate"', 'sans-serif'],
      },
      maxWidth: {
        container: '1400px',
      },
      animation: {
        'scratch': 'scratch-move 12s steps(6) infinite',
      }
    },
  },
  plugins: [],
}
