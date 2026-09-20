import type { Config } from 'tailwindcss';

// 60/30/10: slate surfaces (60%), navy structure (30%), semantic accents (10%). No gradients anywhere.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#0F172A', light: '#1E3A5F', muted: '#334155' },
        accent: { blue: '#2563EB', green: '#16A34A', red: '#DC2626', amber: '#D97706' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
} satisfies Config;
