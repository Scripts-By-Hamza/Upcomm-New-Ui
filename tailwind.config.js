/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'app-bg': '#F7F8FA',
        'surface': '#FFFFFF',
        'surface-secondary': '#F5F6F8',
        'surface-hover': '#F1F3F5',
        'border-subtle': '#E5E7EB',
        'border-strong': '#D4D4D8',
        'text-primary': '#18181B',
        'text-secondary': '#52525B',
        'text-muted': '#8B8B95',
        brand: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
          hero: '#047857',
        },
        card: {
          blue: {
            bg: '#ECFDF5',
            border: '#A7F3D0',
            text: '#047857',
            num: '#059669',
            badge: '#D1FAE5',
          },
          green: {
            bg: '#F0FDF4',
            border: '#BBF7D0',
            text: '#166534',
            num: '#15803D',
            badge: '#DCFCE7',
          },
          yellow: {
            bg: '#FFFBEB',
            border: '#FDE68A',
            text: '#92400E',
            num: '#B45309',
            badge: '#FEF3C7',
          },
          red: {
            bg: '#FEF2F2',
            border: '#FECACA',
            text: '#991B1B',
            num: '#B91C1C',
            badge: '#FEE2E2',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'card': '12px',
        'btn': '8px',
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
