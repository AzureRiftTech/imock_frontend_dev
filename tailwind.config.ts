import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
      colors: {
        brand: {
          50: '#f8f2ff',
          100: '#efe3ff',
          200: '#dcc8ff',
          300: '#c2a1ff',
          400: '#a06aff',
          500: '#8846ff',
          600: '#7729f3',
          700: '#651fd0',
          800: '#541aa8',
          900: '#45188a',
          950: '#2a0d5d',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(136,70,255,0.15), 0 8px 30px rgba(136,70,255,0.20)',
      },
    },
  },
  plugins: [tailwindcssAnimate],
}

export default config
