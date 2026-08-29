import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#09090b',
        paper: '#f4f0e8',
        ember: '#f97316',
        moss: '#a3e635'
      },
      boxShadow: {
        card: '0 18px 60px rgba(0, 0, 0, 0.28)'
      }
    }
  },
  plugins: []
};

export default config;
