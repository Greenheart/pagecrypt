import { minify } from 'html-minifier-terser'
import { defineConfig, type Rolldown } from 'tsdown'

export default defineConfig({
    dts: true,
    entry: {
        index: 'src/index.ts',
        core: 'src/core.ts',
        cli: 'src/cli.ts',
    },
    loader: {
        '.html': 'text',
    },
    hooks: {
        // 'build:done': async (ctx) => {
        //     console.log(ctx.chunks.map((c) => c.fileName))
        // },
    },
    plugins: [minifyHTMLPlugin()],
    nodeProtocol: true,
})

function minifyHTMLPlugin(): Rolldown.Plugin {
    return {
        name: 'minify-html-plugin',
        transform: {
            filter: {
                id: /\.html$/,
            },
            async handler(code) {
                return {
                    code: await minifyHTML(code),
                    moduleType: 'text',
                }
            },
        },
    }
}

async function minifyHTML(html: string) {
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
