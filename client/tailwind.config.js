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
        brand: {
          violet: '#635BFF',
          secondary: '#8B5CF6',
          teal: '#14B8A6',
          cyan: '#38BDF8',
          success: '#16A34A',
          warning: '#F59E0B',
          danger: '#EF4444',
        },
        dark: {
          bg: '#0B1020',
          sidebar: '#0F172A',
          surface: '#151D30',
          elevated: '#1B2640',
          border: '#293449',
          text: '#F1F5F9',
          muted: '#94A3B8'
        },
        light: {
          bg: '#F6F8FC',
          surface: '#FFFFFF',
          elevated: '#F1F5F9',
          border: '#E6EAF2',
          text: '#172033',
          muted: '#64748B'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-violet': '0 0 25px -5px rgba(99, 91, 255, 0.4)',
        'glow-teal': '0 0 25px -5px rgba(20, 184, 166, 0.4)',
        'glow-card': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        pulseGlow: 'pulseGlow 2s ease-in-out infinite',
        shimmer: 'shimmer 2.5s infinite linear',
      }
    },
  },
  plugins: [],
}
