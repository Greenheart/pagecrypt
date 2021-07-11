import { encrypt, encryptHTML } from 'pagecrypt'
import { resolve } from 'path'
import { readFile } from 'fs/promises'

async function main() {
    const inputFile = 'test.html'
    const outputFile = 'out-js.html'
    const password =
        'eRx1sD0LrHTNubycv1IYgyNqU3Qc9GKPGcl3XT63JG7djgMxU9etkVNcK5Hak5GWDzm4mx6AQFlpOPsY'

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
