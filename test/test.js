import { encrypt } from 'pagecrypt'
import { encryptHTML, generatePassword } from 'pagecrypt/core'
import { resolve } from 'path'
import { readFile, writeFile } from 'fs/promises'
import { exec as execCallback } from 'child_process'
import { promisify } from 'util'

const exec = promisify(execCallback)

console.log('\nRunning PageCrypt tests...\n')

const CLI_PASSWORDS = {
    'out-cli.html': 'npm run test:cli',
    'out-cli-gen.html': 'npm run test:cli-gen',
    'out-cli-iterations.html': 'npm run test:cli-iterations',
    'out-cli-gen-iterations.html': 'npm run test:cli-gen-iterations',
}

await Promise.all(
    Object.entries(CLI_PASSWORDS).map(async ([file, cmd]) => {
        console.time(`✅ CLI: ${cmd}`)
        try {
            const { stdout } = await exec(cmd)
            CLI_PASSWORDS[file] = stdout.split('🔑: ')[1].split('\n')[0]
            console.timeEnd(`✅ CLI: ${cmd}`)
        } catch (e) {
            console.error(e)
        }
    }),
)

async function main() {
    const inputFile = 'test.html'
    const outputFile = 'out-js.html'
    const password =
        'eRx1sD0LrHTNubycv1IYgyNqU3Qc9GKPGcl3XT63JG7djgMxU9etkVNcK5Hak5GWDzm4mx6AQFlpOPsY'

    const inputHTML = await readFile(resolve(inputFile), { encoding: 'utf-8' })
    console.time('✅ encrypt()')
    await encrypt(inputFile, outputFile, password)
    console.timeEnd('✅ encrypt()')

    const generatedPassword = generatePassword(20)

    console.time('✅ encryptHTML()')
    const encrypted = await encryptHTML(inputHTML, generatedPassword)
    console.timeEnd('✅ encryptHTML()')

    const outputFile2 = 'out-js-gen.html'

    await writeFile(outputFile2, encrypted)

    const outputFiles = {
        ...CLI_PASSWORDS,
        [outputFile]: password,
        [outputFile2]: generatedPassword,
    }

    const indexHTML = await readFile(resolve('test-results.html'), {
        encoding: 'utf-8',
    })

    const results = Object.entries(outputFiles)
        .map(([file, pwd]) => {
            return `
                <div id="${file}">
                    <a href="/${file}" target="_blank">${file}</a>
                    ${
                        pwd
                            ? `<button data-pwd="${pwd}">Copy Password</button>`
                            : '<p>Find in the terminal</p>'
                    }
                    <a href="/${file}#${pwd}" target="_blank">#</a>
                </div>
            `
        })
        .join('\n' + ' '.repeat(8))

    await writeFile(
        resolve('index.html'),
        indexHTML.replace('<!--TEST-RESULTS-->', results),
    )

    console.log(
        '\nOpen another terminal and run `npm run test:verify` to verify test results in a browser.\n',
    )
}

main().catch((err) => console.error(err))
