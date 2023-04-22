module.exports = {
    darkMode: 'class',
    content: [
        './pages/**/*.{js,ts,jsx,tsx}',
        './components/**/*.{js,ts,jsx,tsx}',
    ],
    safelist: [
        'bg-red-500',
        'bg-orange-500',
        'bg-yellow-500',
        'bg-green-500',
        'bg-stone-500',
        'bg-cyan-500',
        'bg-blue-500',
        'bg-indigo-500',
        'bg-violet-500',
        'bg-purple-500',
        'bg-pink-500',
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
          Rajdhani: ['Rajdhani', 'sans-serif'],
          Yantramanav: ['Yantramanav', 'sans-serif'],
          Barlow: ['Barlow Condensed', 'sans-serif'],

      },
      container: {
        screens: {
          sm: '100%',
          md: '100%',
          lg: '1024px',
          xl: '1167px',
        },
      },
      screens: {
        wide: '827px',
        // => @media (min-height: 800px) { ... }
      },
    },
  },

  plugins: [
    require('@tailwindcss/typography'),
  ],
};
