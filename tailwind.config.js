module.exports = {
    purge: {
        mode: 'all',
        preserveHtmlElements: false,
        content: ['./web/src/**/*.html', './web/src/**/*.js'],
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
