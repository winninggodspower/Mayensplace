/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './templates/**/*.html',
    "./node_modules/flowbite/**/*.js",
    "*.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        'playfairDisplay': '"Playfair Display", serif'
      }
    },
  },
  plugins: [
    require('flowbite/plugin')
  ],
}