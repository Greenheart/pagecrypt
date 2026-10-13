import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

const template = fileURLToPath(new URL('./src/decrypt-template.html', import.meta.url))
const browserCrypto = fileURLToPath(new URL('./workbench/crypto.js', import.meta.url))

function browserCore() {
    return {
        name: 'pagecrypt-browser-core',
        enforce: 'pre',
        resolveId(source, importer) {
            if (!importer?.replaceAll('\\', '/').endsWith('/src/core.ts')) return
            if (source === './crypto') return browserCrypto
            if (source === './decrypt-template.html') return '\0pagecrypt-template'
        },
        async load(id) {
            if (id === '\0pagecrypt-template') {
                return `export default ${JSON.stringify(await readFile(template, 'utf8'))}`
            }
        },
    }
}

export default defineConfig({
    root: 'workbench',
    plugins: [
        browserCore(),
        viteSingleFile({ removeViteModuleLoader: true }),
        {
            name: 'pagecrypt-workbench-csp',
            apply: 'build',
            transformIndexHtml: {
                order: 'post',
                handler() {
                    return [
                        {
                            tag: 'meta',
                            attrs: {
                                'http-equiv': 'Content-Security-Policy',
                                content:
                                    "default-src 'none'; script-src 'unsafe-inline'; worker-src blob:; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'; base-uri 'none'; form-action 'none'",
                            },
                            injectTo: 'head-prepend',
                        },
                    ]
                },
            },
        },
    ],
    worker: { plugins: () => [browserCore()] },
    build: { outDir: 'build', target: 'es2022' },
})
