/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#101114',
          secondary: '#181A1F',
        },
        graphite: '#22252C',
        slate: {
          DEFAULT: '#343943',
          subtle: '#2A2F37',
        },
        primary: '#F0F0ED',
        secondary: '#A4A8AE',
        sage: {
          DEFAULT: '#A8B8A7',
          hover: '#BDCCBA',
          muted: 'rgba(168, 184, 167, 0.15)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Space Grotesk', 'Menlo', 'monospace'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      borderColor: {
        subtle: 'rgba(255, 255, 255, 0.08)',
        accent: 'rgba(168, 184, 167, 0.25)',
      },
    },
  },
  plugins: [],
}
