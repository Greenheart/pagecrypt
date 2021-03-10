/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
    mount: {
        'web/src': '/',
    },
    plugins: ['@snowpack/plugin-postcss'],
    routes: [],
    optimize: {
        bundle: true,
        minify: true,
        treeshake: true,
        manifest: false,
        splitting: false,
        target: 'es2017',
    },
    packageOptions: {},
    devOptions: {},
    buildOptions: {
        out: 'web/build',
    },
}
