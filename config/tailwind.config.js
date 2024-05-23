const colors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./core/code/**/*.{ts,tsx,js}"],
  theme: {
    fontFamily: {
      'body': ["Roboto", "Helvetica Neue", "Helvetica", '"sans-serif"']
    },
    colors: {
      primary: '#f0f0f0',
      "primarybg": '#252222',
    }
  },
  plugins: [],
}

