/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        // Esta es la fuente futurista que importaste
        cyber: ['Orbitron', 'sans-serif'], 
      },
      colors: {
        // Aquí definimos la paleta "Cyberpunk"
        cyber: {
          dark: '#05050a',      // Fondo casi negro (Deep Void)
          surface: '#12121a',   // Fondo de tarjetas (Dark Metal)
          primary: '#6366f1',   // Violeta Neón
          secondary: '#a855f7', // Púrpura Eléctrico
          accent: '#06b6d4',    // Cyan Láser
          text: '#e2e8f0',      // Texto claro
          muted: '#64748b'      // Texto gris apagado
        }
      },
      boxShadow: {
        // Efectos de resplandor (Glow)
        'neon': '0 0 15px rgba(99, 102, 241, 0.4)', 
        'neon-hover': '0 0 30px rgba(168, 85, 247, 0.6)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}