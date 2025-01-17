import esbuild from 'esbuild'
import { cp, readFile, writeFile, rm, readdir, mkdir } from 'fs/promises'
import { execSync } from 'child_process'
import { resolve, join } from 'path'
import { performance } from 'perf_hooks'
import { minify } from 'html-minifier-terser'

const readJSON = (path) => readFile(path, 'utf-8').then(JSON.parse)
const writeJSON = (path, content, indentation = 4) =>
    writeFile(path, JSON.stringify(content, null, indentation), 'utf-8')

async function emptyDir(dir) {
    let items
    try {
        items = await readdir(dir)
    } catch {
        return mkdir(dir, { recursive: true })
    }

    return Promise.all(
        items.map((item) => rm(join(dir, item), { recursive: true })),
    )
}

async function minifyHTML(html) {
    const minifiedHTML = await minify(html, {
        removeComments: true,
        removeEmptyAttributes: true,
        html5: true,
        decodeEntities: true,
        collapseWhitespace: true,
        collapseBooleanAttributes: true,
        removeAttributeQuotes: true,
        removeRedundantAttributes: true,
    })
    console.log(
        `HTML size reduced by ${Math.round(
            100 - (minifiedHTML.length / html.length) * 100,
        )}%`,
    )

    return minifiedHTML
}

const startTime = performance.now()
const pkg = await readJSON('./package.json')

console.log(`⚡ Building pagecrypt v${pkg.version}...`)

const outDir = './dist'
const distDir = resolve(outDir)

await emptyDir(distDir)

const minifyHTMLPlugin = {
    name: 'minifyl-html-plugin',
    setup(build) {
        build.onLoad({ filter: /\.html$/ }, async (args) => {
            const contents = await readFile(args.path, 'utf8')
            return {
                contents: await minifyHTML(contents),
                loader: 'text',
            }
        })
    },
}

esbuild
    .build({
        entryPoints: ['src/index.ts', 'src/core.ts', 'src/cli.ts'],
        outdir: outDir,
        bundle: true,
        sourcemap: false,
        minify: false,
        splitting: false,
        format: 'esm',
        target: ['esnext'],
        platform: 'node',
        external: ['rfc4648', 'sade'],
        plugins: [minifyHTMLPlugin],
    })
    .then(async () => {
        // Build declaration files with TSC since they aren't built by esbuild.
        execSync('npx tsc')

        const declarationsDir = resolve(distDir, 'src')

        // Move all declaration files to the root dist folder. Also remove unwanted files and folder.
        await rm(resolve(declarationsDir, 'cli.d.ts'))
        await cp(declarationsDir, distDir, { recursive: true })
        await rm(declarationsDir, { recursive: true })

        await Promise.all([
            cp('./LICENSE.md', resolve(distDir, 'LICENSE.md')),
            cp('./CHANGELOG.md', resolve(distDir, 'CHANGELOG.md')),
            cp('./README.md', resolve(distDir, 'README.md')),
        ])

        // Prepare package.json for publishing.
        const distPackage = {
            ...pkg,
            private: undefined,
            devDependencies: undefined,
            prettier: undefined,
            main: './index.js',
            bin: {
                pagecrypt: './cli.js',
            },
            types: './index.d.ts',
            exports: {
                '.': {
                    types: './index.d.ts',
                    node: './index.js',
                },
                './core': {
                    import: './core.js',
                },
            },
        }

        await writeJSON(resolve(distDir, 'package.json'), distPackage)

        const buildTime = (
            (performance.now() - startTime) /
            1000
        ).toLocaleString('en-US', {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
        })
        console.log(`✅ Finished in ${buildTime} s\n`)
    })
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
