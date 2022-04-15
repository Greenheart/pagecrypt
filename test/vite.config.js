import { defineConfig } from 'vite'

export default defineConfig({
    root: '.',
    build: {
        target: 'esnext',
    },
    css: {
        // Disable PostCSS since it's not used for tests.
        postcss: {},
    },
})
