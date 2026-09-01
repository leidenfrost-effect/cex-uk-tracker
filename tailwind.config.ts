import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        zinc: {
          50: 'rgb(var(--theme-zinc-50) / <alpha-value>)',
          100: 'rgb(var(--theme-zinc-100) / <alpha-value>)',
          200: 'rgb(var(--theme-zinc-200) / <alpha-value>)',
          300: 'rgb(var(--theme-zinc-300) / <alpha-value>)',
          400: 'rgb(var(--theme-zinc-400) / <alpha-value>)',
          500: 'rgb(var(--theme-zinc-500) / <alpha-value>)',
          600: 'rgb(var(--theme-zinc-600) / <alpha-value>)',
          700: 'rgb(var(--theme-zinc-700) / <alpha-value>)',
          800: 'rgb(var(--theme-zinc-800) / <alpha-value>)',
          900: 'rgb(var(--theme-zinc-900) / <alpha-value>)',
          950: 'rgb(var(--theme-zinc-950) / <alpha-value>)',
        },
        cex: {
          black: 'rgb(var(--theme-zinc-950) / <alpha-value>)',
          surface: 'rgb(var(--theme-zinc-900) / <alpha-value>)',
          surfaceLight: 'rgb(var(--theme-zinc-800) / <alpha-value>)',
          border: 'rgb(var(--theme-zinc-700) / <alpha-value>)',
        },
        ps: {
          blue: '#00439C',
          lightBlue: '#0070D1',
          accent: '#2E6DB4',
        },
        xbox: {
          green: '#107C10',
          lightGreen: '#2CA243',
          darkGreen: '#0E5C0E',
        }
      },
    },
  },
  plugins: [],
};
export default config;
