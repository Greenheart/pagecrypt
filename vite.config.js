import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { setDefaultResultOrder } from 'dns'

setDefaultResultOrder('verbatim')

export default defineConfig({
    plugins: [viteSingleFile({ removeViteModuleLoader: true })],
    build: {
        target: 'es2017',
        outDir: 'build',
    },
    root: 'web/',
})
