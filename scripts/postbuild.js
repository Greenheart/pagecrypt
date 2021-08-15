import { readFile, writeFile } from 'fs/promises'
import { resolve } from 'path'

const HTML_FILE_PATH = resolve('web', 'build', 'index.html')
const HTML_OUT_FILE_PATH = resolve('src', 'decrypt-template.html')

async function main() {
    const htmlInput = await readFile(HTML_FILE_PATH, { encoding: 'utf-8' })

    const htmlOut = applyAllTransformations(
        [
            deleteViteModuleScript,
            preparePayloadTag,
            deleteStyleAssetComment,
            deleteScriptAssetComment,
            fixWhiteSpace,
        ],
        htmlInput,
    )

    await writeFile(HTML_OUT_FILE_PATH, htmlOut)
}

main()

const preparePayloadTag = (html) =>
    html.replace(
        /\s*<!--DEV ONLY-->[\s\S]*<!--\/DEV ONLY-->/,
        '\n    <!--ENCRYPTED PAYLOAD-->',
    )

const deleteViteModuleScript = (html) =>
    html.replace(/(;[\s\S]*\("\/assets\/"\))/, '')

const deleteStyleAssetComment = (html) =>
    html.replace(/<!-- assets[\s\S]*<style type="text\/css">/, '<style>')

const deleteScriptAssetComment = (html) =>
    html.replace(/(\/\/assets[\s\S]*.js)/, '')

const fixWhiteSpace = (html) =>
    html
        .replace(/\s+<title>/, '\n    <title>')
        .replace(/  <script type="module">\n\n/, '    <script type="module">')
        .replace(/\n\n<\/script>/, '</script>')
        .replace(/<style>\s+/, '<style>')
        .replace(/\n<\/style>/, '</style>')

/**
 * Run all formatting functions, passing the result forward until we get a final result.
 */
const applyAllTransformations = (fns, initialValue) =>
    fns.reduce((prevResult, fn) => fn(prevResult), initialValue)
