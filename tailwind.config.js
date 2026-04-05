/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1D9E75',
          50:  '#E8F8F2',
          100: '#C5EEE0',
          200: '#8FDDC4',
          300: '#58CCA8',
          400: '#2DB88C',
          500: '#1D9E75',
          600: '#177E5D',
          700: '#115E46',
          800: '#0B3F2E',
          900: '#051F17',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        btn:  '8px',
      },
      maxWidth: {
        app: '430px',
      },
    },
  },
  plugins: [],
}
