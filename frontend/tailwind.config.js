/** @type {import('tailwindcss').Config} */
const rgb = name => `rgb(var(${name}) / <alpha-value>)`

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Neutral scale is variable-driven: the light theme maps "white"
        // to navy ink and zinc to navy/muted text, so every existing
        // surface/text utility flips without per-component edits.
        white: rgb('--pm-white'),
        black: rgb('--pm-black'),
        zinc: {
          100: rgb('--pm-zinc-100'),
          200: rgb('--pm-zinc-200'),
          300: rgb('--pm-zinc-300'),
          400: rgb('--pm-zinc-400'),
          500: rgb('--pm-zinc-500'),
          600: rgb('--pm-zinc-600'),
          700: rgb('--pm-zinc-700'),
          800: rgb('--pm-zinc-800'),
          900: rgb('--pm-zinc-900'),
        },
        red: {
          200: rgb('--pm-red-200'),
          300: rgb('--pm-red-300'),
          400: rgb('--pm-red-400'),
          500: rgb('--pm-red-500'),
          600: rgb('--pm-red-600'),
          950: rgb('--pm-red-950'),
        },
        amber: {
          400: rgb('--pm-amber-400'),
          500: rgb('--pm-amber-500'),
          600: rgb('--pm-amber-600'),
        },
        emerald: {
          300: rgb('--pm-emerald-300'),
          400: rgb('--pm-emerald-400'),
          500: rgb('--pm-emerald-500'),
          600: rgb('--pm-emerald-600'),
        },
        // `ps-blue` is the readable accent tint (text, borders). The plain
        // `bg-ps-blue` utility is overridden in index.css with the saturated
        // fill so both roles stay legible in dark mode.
        'ps-blue': rgb('--pm-accent-text'),
        'ps-blue-glow': 'rgba(var(--pm-accent-rgb), 0.28)',
        'ps-cyan': rgb('--pm-accent-2'),
        'ps-violet': rgb('--pm-accent-text'),
        'ps-magenta': rgb('--pm-accent-2'),
        'ps-green': rgb('--pm-ok'),
        'ps-black': rgb('--pm-bg'),
        'ps-surface': rgb('--pm-surface-solid'),
        'ps-card': 'var(--pm-card)',
        'ps-card-strong': 'var(--pm-card-strong)',
        'ps-card-soft': 'var(--pm-card-soft)',
        'ps-overlay': 'var(--pm-overlay)',
        'ps-border': 'var(--pm-border)',
        'ps-scrim': 'var(--pm-scrim)',
        'ps-text': rgb('--pm-text'),
        'ps-muted': rgb('--pm-muted'),
      },
      borderRadius: {
        sm: '0.5rem',
        DEFAULT: '0.6rem',
        md: '0.8rem',
        lg: '0.95rem',
        xl: '1.15rem',
        '2xl': '1.4rem',
        '3xl': '1.75rem',
        'ps-xl': '1.1rem',
        'ps-2xl': '1.5rem',
        'ps-3xl': '1.9rem',
      },
      fontFamily: {
        'ps5': ["Inter", "system-ui", "sans-serif"],
        'ps-mono': ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      boxShadow: {
        'hud': '0 24px 50px -32px rgba(20, 40, 80, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        'hud-glow': '0 0 0 1px rgba(124, 58, 237, 0.22), 0 0 26px -6px rgba(124, 58, 237, 0.3)',
      }
    },
  },
  plugins: [],
}
