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
        cex: {
          red: '#E00000',
          darkRed: '#B00000',
          black: '#121212',
          surface: '#1E1E1E',
          surfaceLight: '#282828',
          border: '#333333',
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
