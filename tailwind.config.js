/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './templates/**/*.html',
    "./node_modules/flowbite/**/*.js",
    "index.html"
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