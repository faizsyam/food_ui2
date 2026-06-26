/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './OrderRenderer.jsx',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#f97316',
        background: '#ffffff',
        surface: '#f9fafb',
        'border-default': '#e5e7eb',
        'text-primary': '#111827',
        'text-secondary': '#6b7280',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
      },
    },
  },
  plugins: [],
};