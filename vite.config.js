import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { readFileSync } from 'fs'

export default defineConfig({
    plugins: [viteSingleFile()],
    build: {
        target: 'es2017',
        assetsInlineLimit: 100000000,
        chunkSizeWarningLimit: 100000000,
        cssCodeSplit: false,
        sourcemap: false,
        brotliSize: false,
        rollupOptions: {
            inlineDynamicImports: true,
            output: {
                manualChunks: () => 'everything.js',
            },
        },
        outDir: 'build',
    },
    server: {
        https: {
            key: readFileSync('priv.pem'),
            cert: readFileSync('cert.pem'),
        },
    },
    root: 'web/',
})
