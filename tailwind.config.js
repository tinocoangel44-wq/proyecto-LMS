/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        sapientia: {
          50:  '#fff1f2',
          100: '#ffe0e3',
          200: '#ffc7cc',
          300: '#ff9aa3',
          400: '#ff5f6f',
          500: '#e02035',
          600: '#c62828',
          700: '#9b1c1c',
          800: '#7f1d1d',
          900: '#450a0a',
          wine: '#880e4f',
        },
        dark: {
          bg:      '#0f172a',
          surface: '#131c31',
          card:    '#1e293b',
          hover:   '#263347',
          border:  '#2d3f5a',
          text:    '#f1f5f9',
          muted:   '#64748b',
        },
        sidebar: {
          bg:      '#0f172a',
          active:  '#1e40af',
          hover:   '#1e293b',
          text:    '#94a3b8',
          activeText: '#ffffff',
          border:  '#1e293b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      spacing: {
        sidebar: '16rem',  // 256px
        'sidebar-collapsed': '4.5rem', // 72px
      },
      keyframes: {
        'slide-in-left': {
          '0%':   { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)',      opacity: '1' },
        },
        'slide-in-right': {
          '0%':   { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)',     opacity: '1' },
        },
        'slide-down': {
          '0%':   { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',     opacity: '1' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%':   { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)',     opacity: '1' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) scale(1)' },
          '50%':      { transform: 'translateY(-18px) scale(1.02)' },
        },
        'bounce-in': {
          '0%':   { transform: 'scale(0.8)', opacity: '0' },
          '60%':  { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)',   opacity: '1' },
        },
        'sidebar-open': {
          '0%':   { width: '4.5rem' },
          '100%': { width: '16rem' },
        },
        'ping-once': {
          '0%':   { transform: 'scale(1)',   opacity: '1' },
          '50%':  { transform: 'scale(1.6)', opacity: '0.6' },
          '100%': { transform: 'scale(1)',   opacity: '1' },
        },
      },
      animation: {
        'slide-in-left':  'slide-in-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-down':     'slide-down 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in':        'fade-in 0.3s ease-out',
        'scale-in':       'scale-in 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        'pulse-slow':     'pulse-slow 2s ease-in-out infinite',
        'bounce-in':      'bounce-in 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'spin-slow':      'spin 3s linear infinite',
        'float':          'float 8s ease-in-out infinite',
        'ping-once':      'ping-once 0.5s ease-out',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass':    '0 8px 32px rgba(0, 0, 0, 0.12)',
        'glass-dark': '0 8px 32px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 20px 40px rgba(0, 0, 0, 0.12)',
        'sidebar':  '4px 0 24px rgba(0, 0, 0, 0.15)',
        'navbar':   '0 1px 0 rgba(0, 0, 0, 0.06)',
        'dropdown': '0 10px 40px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
        'glow':     '0 0 20px rgba(14, 165, 233, 0.3)',
      },
      borderRadius: {
        'xl':  '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
      },
      transitionDuration: {
        '400': '400ms',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
      },
    },
  },
  plugins: [],
};
