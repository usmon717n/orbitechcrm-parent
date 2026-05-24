const tokenColor = (name) => ({ opacityValue }) => {
  const value = `var(${name})`
  if (opacityValue === undefined) return value
  return `color-mix(in srgb, ${value} calc(${opacityValue} * 100%), transparent)`
}

const accentScale = {
  50: tokenColor('--color-primary-50'),
  100: tokenColor('--color-primary-100'),
  200: tokenColor('--color-primary-200'),
  300: tokenColor('--color-primary-300'),
  400: tokenColor('--color-primary-400'),
  500: tokenColor('--color-primary-500'),
  600: tokenColor('--color-primary-600'),
  700: tokenColor('--color-primary-700'),
  800: tokenColor('--color-primary-800'),
  900: tokenColor('--color-primary-900'),
  950: tokenColor('--color-primary-950'),
  DEFAULT: tokenColor('--color-primary-500'),
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: accentScale,
        accent: accentScale,
        surface: {
          0: '#ffffff',
          50: '#f7faf6',
          100: '#eef4eb',
          200: '#dce7d7',
          800: '#182015',
          900: '#121911',
          950: '#0b120a',
        },
        text: {
          primary: '#1e2a1a',
          secondary: '#3f5138',
          muted: '#667a5f',
          inverse: '#f2f8ef',
          'dark-primary': '#e9f3e5',
          'dark-secondary': '#bdd0b6',
          'dark-muted': '#93aa8b',
        },
        border: {
          soft: '#d6e3d0',
          DEFAULT: '#c2d3bb',
          strong: '#9ab291',
          dark: '#2f3f2b',
        },
        // Legacy brand/accent classes now resolve through the token engine.
        orange: accentScale,
        green: accentScale,
        emerald: accentScale,
        blue: accentScale,
        indigo: accentScale,
        purple: accentScale,
        cyan: accentScale,
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        primary: '0 10px 28px var(--shadow-primary)',
        'primary-lg': '0 18px 42px var(--shadow-primary-lg)',
        accent: '0 10px 24px var(--shadow-accent)',
      },
      ringColor: {
        primary: 'var(--color-primary-400)',
      },
    },
  },
  plugins: [],
}
