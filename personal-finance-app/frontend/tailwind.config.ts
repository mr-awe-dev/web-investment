import type { Config } from 'tailwindcss';

// Semantic design tokens. Every color resolves to an RGB channel variable defined in
// index.css, so light and dark themes repoint the same role without touching components.
// 60 / 30 / 10: canvas + surfaces / supporting surfaces / forest-green accents.
export default {
  darkMode: 'class',
  future: { hoverOnlyWhenSupported: true },
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'rgb(var(--c-canvas) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--c-surface-2) / <alpha-value>)',
        'surface-3': 'rgb(var(--c-surface-3) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
        'line-strong': 'rgb(var(--c-line-strong) / <alpha-value>)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        faint: 'rgb(var(--c-faint) / <alpha-value>)',
        accent: {
          DEFAULT: 'rgb(var(--c-accent) / <alpha-value>)',
          hover: 'rgb(var(--c-accent-hover) / <alpha-value>)',
          ink: 'rgb(var(--c-accent-ink) / <alpha-value>)',
          text: 'rgb(var(--c-accent-text) / <alpha-value>)',
          soft: 'rgb(var(--c-accent-soft) / <alpha-value>)',
        },
        positive: {
          DEFAULT: 'rgb(var(--c-positive) / <alpha-value>)',
          soft: 'rgb(var(--c-positive-soft) / <alpha-value>)',
        },
        negative: {
          DEFAULT: 'rgb(var(--c-negative) / <alpha-value>)',
          soft: 'rgb(var(--c-negative-soft) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'rgb(var(--c-warning) / <alpha-value>)',
          soft: 'rgb(var(--c-warning-soft) / <alpha-value>)',
        },
        gold: {
          DEFAULT: 'rgb(var(--c-gold) / <alpha-value>)',
          soft: 'rgb(var(--c-gold-soft) / <alpha-value>)',
        },
        sidebar: {
          DEFAULT: 'rgb(var(--c-sidebar) / <alpha-value>)',
          hover: 'rgb(var(--c-sidebar-hover) / <alpha-value>)',
          active: 'rgb(var(--c-sidebar-active) / <alpha-value>)',
          ink: 'rgb(var(--c-sidebar-ink) / <alpha-value>)',
          muted: 'rgb(var(--c-sidebar-muted) / <alpha-value>)',
          line: 'rgb(var(--c-sidebar-line) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        pop: 'var(--shadow-pop)',
      },
      borderRadius: {
        md: '0.5rem',
        lg: '0.625rem',
        xl: '0.875rem',
        '2xl': '1rem',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.2, 0, 0, 1)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(24px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(-24px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.98)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms cubic-bezier(0.2, 0, 0, 1) both',
        'fade-up': 'fade-up 300ms cubic-bezier(0.2, 0, 0, 1) both',
        'slide-in-right': 'slide-in-right 300ms cubic-bezier(0.2, 0, 0, 1) both',
        'slide-in-left': 'slide-in-left 300ms cubic-bezier(0.2, 0, 0, 1) both',
        'scale-in': 'scale-in 200ms cubic-bezier(0.2, 0, 0, 1) both',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
