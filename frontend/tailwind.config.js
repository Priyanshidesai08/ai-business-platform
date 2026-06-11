/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#172033',
        panel: '#f7f8fb',
        line: '#d9dee8',
        accent: '#2563eb',
        mint: '#0f9f8f'
      },
      boxShadow: {
        soft: '0 18px 60px rgba(23, 32, 51, 0.12)'
      }
    }
  },
  plugins: []
};
