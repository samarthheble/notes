/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
      colors: {
        primary: '#4361ee',
        'primary-light': '#4895ef',
        'primary-dark': '#3a0ca3',
        secondary: '#7209b7',
        accent: '#f72585',
        success: '#4cc9f0',
        light: '#f8f9fa',
        dark: '#212529',
        gray: '#6c757d',
        'light-gray': '#e9ecef',
      },
      borderRadius: {
        'custom': '16px',
      },
      boxShadow: {
        'custom': '0 10px 30px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'pulse': 'pulse 1.5s infinite',
        'spin': 'spin 1s linear infinite',
      },
    },
  },
  plugins: [],
}