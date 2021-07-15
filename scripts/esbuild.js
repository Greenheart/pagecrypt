import esbuild from 'esbuild'
import fse from 'fs-extra'
import { execSync } from 'child_process'
import { resolve } from 'path'
import { performance } from 'perf_hooks'

const { emptyDir, copy, remove, readJson, writeJson } = fse

const startTime = performance.now()
const pkg = await readJson('./package.json')

console.log(`⚡ Building pagecrypt v${pkg.version}...`)

const outDir = './dist'
const distDir = resolve(outDir)

await emptyDir(distDir)

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
        loader: { '.html': 'text' },
        external: ['rfc4648', 'sade'],
    })
    .then(async () => {
        // Build declaration files with TSC since they aren't built by esbuild.
        execSync('npx tsc')

        const declarationsDir = resolve(distDir, 'src')

        // Move all declaration files to the root dist folder. Also remove unwanted files and folder.
        await remove(resolve(declarationsDir, 'cli.d.ts'))
        await copy(declarationsDir, distDir)
        await remove(declarationsDir)

        await Promise.all([
            copy('./LICENSE.md', resolve(distDir, 'LICENSE.md')),
            copy('./CHANGELOG.md', resolve(distDir, 'CHANGELOG.md')),
        ])

        // Prepare package.json for publishing.
        const distPackage = {
            ...pkg,
            private: undefined,
            devDependencies: undefined,
            scripts: undefined,
            main: './index.js',
            bin: {
                pagecrypt: './cli.js',
            },
        }

        await writeJson(resolve(distDir, 'package.json'), distPackage, {
            spaces: 4,
        })

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
