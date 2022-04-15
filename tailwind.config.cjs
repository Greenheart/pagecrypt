const colors = require('tailwindcss/colors')
const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
    content: ['./web/**/*.html', './web/**/*.js'],
    theme: {
        colors: {
            yellow: colors.yellow,
            gray: colors.stone,
            red: colors.red,
            white: colors.white,
            black: colors.black,
        },
        screens: {
            xs: '475px',
            ...defaultTheme.screens,
        },
    },
    variants: {},
    plugins: [],
}
