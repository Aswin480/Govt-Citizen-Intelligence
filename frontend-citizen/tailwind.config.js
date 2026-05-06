/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gov: {
          navy: {
            900: 'var(--color-gov-navy-900)',
            800: 'var(--color-gov-navy-800)',
            700: 'var(--color-gov-navy-700)',
          },
          amber: {
            500: 'var(--color-gov-amber-500)',
            400: 'var(--color-gov-amber-400)',
            600: 'var(--color-gov-gold)',
          },
        },
        // Semantic aliases
        bg: {
          app: 'var(--color-bg-app)',
          card: 'var(--color-bg-card)',
        },
      },
      fontFamily: {
        serif: ['Merriweather', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius-lg)',
        md: 'var(--radius-md)',
        sm: 'var(--radius-sm)',
      }
    },
  },
  plugins: [],
}
