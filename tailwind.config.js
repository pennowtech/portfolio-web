module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './node_modules/flowbite/**/*.js',
    './node_modules/flowbite-react/**/*.js'
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
    'bg-pink-500'
  ],
  theme: {
    extend: {
      typography: (theme) => ({
        DEFAULT: {
          dark: {
            css: {
              color: 'red'
            }
          },
          css: {
            // color: theme('colors.gray.800'),
            blockquote: {
              'p::before': {
                content: 'none'
              },
              'p::after': {
                content: 'none'
              }
            }
          }
        },
        xl: {
          css: {
            h5: {
              'margin-bottom': '5px'
            }
          }
        }
      }),
      fontFamily: {
        Merriweather: ['Merriweather', 'serif'],
        Lora: ['Lora', 'serif'],
        Fira: ['Fira Code', 'monospace'],
        RobotoCond: ['Roboto Condensed', 'sans-serif'],
        RobotoSlab: ['Roboto Slab', 'sans-serif'],
        Monda: ['Monda', 'sans-serif'],
        Neuton: ['Neuton', 'serif'],
        Offside: ['Offside', 'cursive'],
        Rajdhani: ['Rajdhani', 'sans-serif'],
        Yantramanav: ['Yantramanav', 'sans-serif'],
        BarlowCond: ['Barlow Condensed', 'sans-serif'],
        Barlow: ['Barlow', 'sans-serif'],
        NatoJapan: ['Noto Sans JP', 'sans-serif'],
        Inter: ['Inter', 'sans-serif'],
        Comic: ['Comic Neue', 'sans-serif'],
        Gentium: ['Gentium Plus', 'sans-serif']
      },
      container: {
        screens: {
          sm: '100%',
          md: '100%',
          lg: '1024px',
          xl: '1200px'
        }
      },
      screens: {
        wide: '827px'
        // => @media (min-height: 800px) { ... }
      }
    }
  },

  plugins: [require('@tailwindcss/typography'), require('flowbite/plugin')]
};
