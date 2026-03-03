/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#0a0e17',
          card: '#0f1629',
          border: '#1e3a5f',
          accent: '#00d4aa',
          glow: '#00ffcc',
          muted: '#64748b',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Orbitron', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(0, 212, 170, 0.3)',
        'glow-sm': '0 0 10px rgba(0, 212, 170, 0.2)',
      },
    },
  },
  plugins: [],
}
