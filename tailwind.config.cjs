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
    theme: {},
    variants: {},
    plugins: [],
}
