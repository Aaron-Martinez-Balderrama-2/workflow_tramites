/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Habilita modo oscuro manual o por sistema
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Corporativa (Estilo IBM / Salesforce)
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb', // Brand color
          700: '#1d4ed8',
        },
        surface: {
          light: '#ffffff',
          dark: '#1e293b', // slate-800
        },
        bg: {
          light: '#f8fafc', // slate-50
          dark: '#0f172a', // slate-900
        },
        borderCol: {
          light: '#e2e8f0', // slate-200
          dark: '#334155', // slate-700
        }
      }
    },
  },
  plugins: [],
}
