const { encrypt } = require('pagecrypt')

async function main() {
    const [inputFile, outputFile, password] = [
        'test.html',
        'out-js.html',
        'asd',
    ]
    console.log(`🔐 Encrypting ${inputFile} → ${outputFile}`)
    console.time('✅ Done!')
    await encrypt(inputFile, outputFile, password)
    console.timeEnd('✅ Done!')
}

main()
    .then(() => {})
    .catch((err) => {
        console.error(err)
    })
