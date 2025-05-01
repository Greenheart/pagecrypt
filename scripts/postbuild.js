import { readFile, writeFile } from 'fs/promises'
import { resolve } from 'path'

const HTML_FILE_PATH = resolve('web', 'build', 'index.html')
const HTML_OUT_FILE_PATH = resolve('src', 'decrypt-template.html')

async function main() {
    const htmlInput = await readFile(HTML_FILE_PATH, { encoding: 'utf-8' })
    const htmlOut = applyAllTransformations(
        [preparePayloadTag, cleanStyleTag, fixWhiteSpace],
        htmlInput,
    )

    return writeFile(HTML_OUT_FILE_PATH, htmlOut)
}

const preparePayloadTag = (html) =>
    html.replace(
        /\s*<!--DEV ONLY-->[\s\S]*<!--\/DEV ONLY-->/,
        '\n    <encrypted-payload></encrypted-payload>',
    )

const cleanStyleTag = (html) =>
    html.replace(/<style rel="stylesheet" crossorigin>/, '  <style>')

const fixWhiteSpace = (html) =>
    html
        .replace(/\s+<title>/, '\n    <title>')
        .replace(/<script type="module">/, '  <script type="module">')
        .replace(/\s+<\/script>/, '</script>')
        .replace(/\s+<\/style>/, '</style>')
        .replace(/\n\s+<\/head>/, '\n</head>')

/**
 * Run all formatting functions, passing the result forward until we get a final result.
 */
const applyAllTransformations = (fns, initialValue) =>
    fns.reduce((prevResult, fn) => fn(prevResult), initialValue)

await main()
