/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: '#f9f9ff',
        'surface-dim': '#cfdaf1',
        'surface-bright': '#f9f9ff',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f0f3ff',
        'surface-container': '#e7eeff',
        'surface-container-high': '#dee8ff',
        'surface-container-highest': '#d8e3fa',
        'on-surface': '#111c2c',
        'on-surface-variant': '#424751',
        primary: '#00346f',
        'on-primary': '#ffffff',
        'primary-container': '#004a99',
        secondary: '#00658d',
        'on-secondary': '#ffffff',
        'secondary-container': '#41befd',
        outline: '#737783',
        'outline-variant': '#c2c6d3',
        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
      },
      fontFamily: {
        sans: ['"Public Sans"', 'sans-serif'], // Fuente oficial del diseño
      },
      spacing: {
        base: '8px',
        xs: '4px',
        sm: '12px',
        md: '24px',
        lg: '48px',
        xl: '80px',
        gutter: '24px',
        margin: '32px',
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem', // 8px por defecto como pide el diseño
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
      }
    },
  },
  plugins: [],
}