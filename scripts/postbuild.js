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
        '\n    <!--ENCRYPTED PAYLOAD-->',
    )

const cleanStyleTag = (html) =>
    html.replace(/<style type="text\/css">\n\s*/, '  <style>')

const fixWhiteSpace = (html) =>
    html
        .replace(/\s+<title>/, '\n    <title>')
        .replace(/\n\n<\/script>/, '</script>')
        .replace(/\n\s+<\/style>/, '</style>')
        .replace(/\n\s+<\/head>/, '\n</head>')

/**
 * Run all formatting functions, passing the result forward until we get a final result.
 */
const applyAllTransformations = (fns, initialValue) =>
    fns.reduce((prevResult, fn) => fn(prevResult), initialValue)

await main()
