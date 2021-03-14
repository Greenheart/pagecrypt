const { encrypt, encryptHTML } = require('pagecrypt')
const { resolve } = require('path')
const { readFile } = require('fs/promises')

async function main() {
    const inputFile = 'test.html'
    const outputFile = 'out-js.html'
    const password = 'asd'

    const inputHTML = await readFile(resolve(inputFile), { encoding: 'utf-8' })

    console.log(`🔐 Encrypting ${inputFile} → ${outputFile}`)
    console.time('✅ encrypt()')
    await encrypt(inputFile, outputFile, password)
    console.timeEnd('✅ encrypt()')

    console.time('✅ encryptHTML()')
    const data = await encryptHTML(inputHTML, password)
    console.timeEnd('✅ encryptHTML()')
}

main()
    .then(() => {})
    .catch((err) => {
        console.error(err)
    })
