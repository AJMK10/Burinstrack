/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans Variable"', '"Inter Variable"', 'ui-sans-serif', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f1f4ff',
          100: '#e3e9ff',
          200: '#ccd7ff',
          300: '#a8b9fe',
          400: '#818df9',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#2e2a7f',
          950: '#1b1850',
        },
        ink: {
          50: '#f6f7fb',
          100: '#eceef5',
          200: '#d9dce8',
          300: '#b7bccf',
          400: '#8a90a9',
          500: '#656b85',
          600: '#4b5068',
          700: '#3a3e53',
          800: '#252838',
          900: '#161826',
          950: '#0b0d18',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(22,24,38,0.04), 0 4px 16px -4px rgba(22,24,38,0.06)',
        card: '0 1px 2px rgba(22,24,38,0.04), 0 8px 24px -8px rgba(22,24,38,0.08)',
        lift: '0 2px 4px rgba(22,24,38,0.05), 0 16px 40px -12px rgba(79,70,229,0.22)',
        glow: '0 8px 30px -6px rgba(79,70,229,0.55)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'pop-in': {
          from: { opacity: '0', transform: 'scale(0.96) translateY(8px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(20px,-30px,0) scale(1.08)' },
        },
        'grow-x': {
          from: { transform: 'scaleX(0)' },
          to: { transform: 'scaleX(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out both',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.22,1,0.36,1) both',
        'slide-in-right': 'slide-in-right 0.32s cubic-bezier(0.22,1,0.36,1) both',
        'pop-in': 'pop-in 0.25s cubic-bezier(0.22,1,0.36,1) both',
        shimmer: 'shimmer 1.6s infinite',
        float: 'float 14s ease-in-out infinite',
        'grow-x': 'grow-x 0.9s cubic-bezier(0.22,1,0.36,1) both',
      },
    },
  },
  plugins: [],
}
