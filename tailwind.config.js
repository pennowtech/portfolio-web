module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      typography: (theme) => ({

        DEFAULT: {
          dark: {
            css: {
              color: 'red',
            },
          },
          css: {
            // color: theme('colors.gray.800'),
            blockquote: {
              'p::before': {
                content: 'none',
              },
              'p::after': {
                content: 'none',
              },
            },
          },
        },
        xl: {
          css: {
            h5: {
              'margin-bottom': '5px',
            },
          },
        },
      }),
      fontFamily: {
        Merriweather: ['Merriweather', 'serif'],
        Lora: ['Lora', 'serif'],
        Fira: ['Fira Code', 'monospace'],
        Roboto: ['Roboto Condensed', 'sans-serif'],
        Monda: ['Monda', 'sans-serif'],
        Neuton: ['Neuton', 'serif'],
        Offside: ['Offside', 'cursive'],
      },
      screens: {
        wide: '927px',
        // => @media (min-height: 800px) { ... }
      },
    },
  },

  plugins: [
    require('@tailwindcss/typography'),
  ],
};
