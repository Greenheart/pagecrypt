const colors = require('tailwindcss/colors')
const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
    mode: 'jit',
    purge: {
        mode: 'all',
        preserveHtmlElements: false,
        content: ['./web/**/*.html', './web/**/*.js'],
        options: {
            keyframes: true,
            fontFace: true,
        },
    },
    darkMode: false,
    theme: {
        colors: {
            yellow: colors.yellow,
            gray: colors.warmGray,
            red: colors.red,
            white: colors.white,
            black: colors.black,
        },
        screens: {
            'xs': '475px',
            ...defaultTheme.screens,
        }
    },
    variants: {},
    plugins: [],
}
