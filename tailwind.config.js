/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef5ff',
          100: '#d9e8ff',
          200: '#bcd7ff',
          300: '#8ebdff',
          400: '#5a98ff',
          500: '#2f74f5',
          600: '#1b56db',
          700: '#1744b1',
          800: '#193c8c',
          900: '#19366f',
        },
        navy: {
          50: '#f3f5f9',
          100: '#e7eaf1',
          500: '#2b3350',
          600: '#202740',
          700: '#171c30',
          800: '#101426',
          900: '#0a0d1b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(16,20,38,0.04), 0 8px 24px rgba(16,20,38,0.06)',
        card: '0 1px 2px rgba(16,20,38,0.04), 0 12px 32px rgba(16,20,38,0.07)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-up': 'slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-soft': 'pulse-soft 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
