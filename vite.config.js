import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

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
    root: 'web/',
    server: {
        https: true,
    }
})
