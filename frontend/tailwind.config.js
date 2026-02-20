/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Letterboxd-inspired color palette
        // Dark greens and oranges
        letterboxd: {
          // Primary green (Letterboxd's signature)
          green: '#00e054',
          'green-dark': '#00c030',
          // Orange accent
          orange: '#ff8000',
          'orange-dark': '#e67300',
          // Blue for links
          blue: '#40bcf4',
        },
        // Background colors (theme via CSS variables)
        bg: {
          primary: 'var(--color-bg-primary)',
          secondary: 'var(--color-bg-secondary)',
          tertiary: 'var(--color-bg-tertiary)',
          nav: 'var(--color-bg-nav)',
        },
        // Text colors (theme via CSS variables)
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
        },
        // Border colors (theme via CSS variables)
        border: {
          DEFAULT: 'var(--color-border)',
          light: 'var(--color-border-light)',
        },
      },
      fontFamily: {
        // Letterboxd uses Graphik, we'll use similar alternatives
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': '0.625rem', // 10px
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      aspectRatio: {
        poster: '2 / 3',
        backdrop: '16 / 9',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-poster':
          'linear-gradient(to top, rgba(20, 24, 28, 1) 0%, rgba(20, 24, 28, 0.8) 50%, transparent 100%)',
        'gradient-backdrop':
          'linear-gradient(to right, rgba(20, 24, 28, 0.95) 0%, rgba(20, 24, 28, 0.7) 50%, rgba(20, 24, 28, 0.3) 100%)',
      },
    },
  },
  plugins: [],
};
