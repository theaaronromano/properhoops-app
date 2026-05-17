/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'ph-orange': '#E8621A',
        'ph-teal': '#2ABFBF',
        'ph-purple': '#6B3FA0',
        'ph-gold': '#F5C518',
        'ph-dark': '#0D0D0D',
        'ph-card': '#141414',
        'ph-border': '#1E1E1E',
      }
    }
  },
  plugins: []
}
