import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
    plugins: [viteSingleFile({ removeViteModuleLoader: true })],
    build: {
        target: 'es2017',
        outDir: 'build',
    },
    root: 'web/',
    server: {
        https: true,
    },
})
