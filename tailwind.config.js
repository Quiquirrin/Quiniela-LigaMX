/** @type {import('tailwindcss').Config} */
const c = (v) => `hsl(var(--${v}) / <alpha-value>)`
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: c('background'),
        foreground: c('foreground'),
        card: c('card'),
        muted: c('muted'),
        'muted-foreground': c('muted-foreground'),
        primary: c('primary'),
        'primary-foreground': c('primary-foreground'),
        border: c('border'),
        sidebar: c('sidebar'),
      },
      borderRadius: { xl: '0.75rem', '2xl': '1rem' },
    },
  },
  plugins: [],
}
