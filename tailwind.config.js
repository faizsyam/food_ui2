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
      fontFamily: {
        sans: ['DM Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        primary: '#E8521A',
        'primary-hover': '#D4491A',
        'primary-light': '#FFF0EA',
        background: '#FFF9F5',
        surface: '#FFF4EE',
        'text-primary': '#1A120D',
        'text-secondary': '#5C4F48',
        'text-muted': '#9C8E84',
        'text-subtle': '#B5A99F',
        'border-default': '#F0E8E2',
        'border-interactive': '#E0D4CA',
        success: '#22A65E',
        warning: '#D97706',
        error: '#E11D48',
        card: '#FFFFFF',
      },
      boxShadow: {
        'card': '0 1px 2px rgba(19, 11, 4, 0.04), 0 4px 12px rgba(19, 11, 4, 0.06)',
        'card-hover': '0 4px 6px rgba(19, 11, 4, 0.04), 0 8px 24px rgba(19, 11, 4, 0.08)',
        'soft': '0 2px 8px rgba(19, 11, 4, 0.06)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
      transitionTimingFunction: {
        'ease-out-expo': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
