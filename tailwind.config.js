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
          red: '#E31B23',
          redHover: '#C4131A',
          redLight: '#FDF2F2',
          redBorder: '#F8B4B6',
        },
        dark: {
          bg: '#111111',
          card: '#1A1A1A',
          border: '#2A2A2A',
          text: '#FFFFFF',
          textMuted: '#9CA3AF',
        },
        light: {
          bg: '#F9FAFB',
          card: '#FFFFFF',
          border: '#E5E5E5',
          text: '#111111',
          textMuted: '#6B7280',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
