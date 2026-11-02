/** @type {import('tailwindcss').Config} */
export default {
  content: { relative: true, files: ['./index.html', './src/**/*.{js,jsx}'] },
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0a0a0a',
          950: '#070707',
          900: '#0b0b0b',
          800: '#121212',
          700: '#1b1b1b',
          600: '#262626',
          500: '#3d3d3d',
          400: '#6b6b6b',
          300: '#9a9a9a',
        },
        bone: { DEFAULT: '#f2eee6', 50: '#faf8f3', 100: '#f2eee6', 200: '#e4ddd0', 300: '#cfc6b5' },
        blood: { DEFAULT: '#b5121b', 700: '#8c0e15', 600: '#a01018', 500: '#b5121b', 400: '#d61f2a' },
      },
      // One family everywhere: Helvetica (regular + bold), with Arial as the Windows fallback.
      fontFamily: {
        display: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        serif: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        sans: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
      },
      fontSize: {
        kicker: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.18em' }],
      },
      borderRadius: { DEFAULT: '2px', sm: '1px', md: '3px' },
      maxWidth: { site: '1320px', read: '42rem' },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: { shimmer: 'shimmer 1.4s infinite' },
    },
  },
  plugins: [],
};
