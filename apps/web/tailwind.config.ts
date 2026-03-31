import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0b0d10',
          secondary: '#12141a',
          tertiary: '#181c25',
          elevated: '#1e2430',
        },
        text: {
          primary: '#e6e9ef',
          muted: '#9aa4b2',
        },
        accent: '#3a86ff',
        accentSoft: '#5cc8ff',
        success: '#22c55e',
        warning: '#f59e0b',
        info: '#22d3ee',
        danger: '#ef4444',
        stroke: '#232a36',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
        heading: ['Space Grotesk', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
