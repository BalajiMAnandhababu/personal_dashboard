/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'unified-paygate': '#185FA5',
        'thangapanam-gold': '#854F0B',
        'iraivi': '#0F6E56',
        'digitus360': '#993C1D',
        'infinex': '#534AB7',
        'personal': '#888780',
      },
    },
  },
  plugins: [],
};
