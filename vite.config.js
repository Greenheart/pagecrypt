import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { readFileSync } from 'fs'

/**
 * @type {import('vite').UserConfig}
 */
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
            key: readFileSync('localhost+1-key.pem'),
            cert: readFileSync('localhost+1.pem'),
        },
    },
    root: 'web/',
})
