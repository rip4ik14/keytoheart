import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"SF Pro Display"', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        border: 'hsl(var(--border))',
      },
      keyframes: {
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        scaleFadeIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 0 0 rgba(0, 0, 0, 0.1)' },
          '50%': { boxShadow: '0 0 15px 5px rgba(0, 0, 0, 0.2)' },
          '100%': { boxShadow: '0 0 0 0 rgba(0, 0, 0, 0.1)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        marquee: 'marquee 60s linear infinite',
        fadeIn: 'fadeIn 0.5s ease-in-out',
        scaleFadeIn: 'scaleFadeIn 0.7s ease-out',
        glow: 'glow 2s ease-in-out infinite',
        slideDown: 'slideDown 0.5s ease-out',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
  safelist: [
    'bg-red-500',
    'text-white',
  ],
};

export default config;