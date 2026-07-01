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
        primary: {
          DEFAULT: '#E8521A',
          hover: '#D4491A',
          light: '#FFF0EA',
          subtle: '#FFF7F2',
        },
        background: {
          DEFAULT: '#FFF9F5',
          alt: '#FEF7F2',
        },
        surface: {
          DEFAULT: '#FFF4EE',
          elevated: '#FFFFFF',
          subtle: '#FDF8F3',
        },
        border: {
          DEFAULT: '#F0E8E2',
          light: '#F7F0EB',
          interactive: '#E0D4CA',
          strong: '#C4B5AB',
        },
        text: {
          primary: '#1A120D',
          secondary: '#5C4F48',
          muted: '#9C8E84',
          subtle: '#B5A99F',
          placeholder: '#C4B5AB',
        },
        success: {
          DEFAULT: '#22A65E',
          light: '#F0FDF4',
        },
        warning: {
          DEFAULT: '#D97706',
          light: '#FFFBEB',
        },
        error: {
          DEFAULT: '#E11D48',
          light: '#FEF2F2',
        },
        card: {
          DEFAULT: '#FFFFFF',
          muted: '#FFF9F5',
        },
      },
      boxShadow: {
        'xs': '0 1px 2px rgba(19, 11, 4, 0.03)',
        'soft': '0 1px 3px rgba(19, 11, 4, 0.04), 0 4px 12px rgba(19, 11, 4, 0.05)',
        'card': '0 1px 3px rgba(19, 11, 4, 0.04), 0 6px 18px rgba(19, 11, 4, 0.06)',
        'card-hover': '0 4px 8px rgba(19, 11, 4, 0.05), 0 12px 32px rgba(19, 11, 4, 0.08)',
        'elevated': '0 8px 16px rgba(19, 11, 4, 0.06), 0 24px 48px rgba(19, 11, 4, 0.08)',
        'glow': '0 0 20px rgba(232, 82, 26, 0.12)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
      },
      transitionTimingFunction: {
        'ease-out-expo': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'ease-in-out-expo': 'cubic-bezier(0.87, 0, 0.13, 1)',
        'ease-out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
      },
      transitionDuration: {
        '150': '150ms',
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
      },
      letterSpacing: {
        'extra-tight': '-0.02em',
        'tighter-2': '-0.025em',
      },
    },
  },
  plugins: [],
};
