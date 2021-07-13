import { encrypt } from 'pagecrypt'
import { encryptHTML, generatePassword } from 'pagecrypt/core'
import { resolve } from 'path'
import { readFile, writeFile } from 'fs/promises'

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

    const generatedPassword = generatePassword(20)

    console.time('✅ encryptHTML()')
    const encrypted = await encryptHTML(inputHTML, generatedPassword)
    console.timeEnd('✅ encryptHTML()')

    const outputFile2 = 'out-js-gen.html'
    console.log(
        `\u{1F510} Encrypting ${inputFile} \u2192 ${outputFile2} with \u{1F511}: ${generatedPassword}`,
    )

    await writeFile(outputFile2, encrypted)
}

main().catch((err) => console.error(err))
