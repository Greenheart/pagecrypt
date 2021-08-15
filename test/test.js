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

    console.log(
        `🔐 Encrypting ${inputFile} → ${outputFile} with \u{1F511}: ${password}`,
    )
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

    const outputFiles = {
        'out-cli.html': '',
        'out-cli-gen.html': '',
        [outputFile]: password,
        [outputFile2]: generatedPassword,
    }

    const indexHTML = await readFile(resolve('test-results.html'), {
        encoding: 'utf-8',
    })

    const results = Object.entries(outputFiles)
        .map(([file, pwd]) => {
            // IDEA: Maybe execute CLI tests using child processes, filter the output and add the generated passwords and filenames to the table too.
            // IDEA: If all tests are run via this script, we could simplify the npm scripts to only run a single test.js file.
            // IDEA: We could also automatically continue by starting the vite dev server to make it easy to verify test output.


            // TODO: Update testing documentation and scripts.

            return `
                <div id="${file}">
                    <a href="/${file}" target="_blank">${file}</a>
                    ${
                        pwd
                            ? `<button data-pwd="${pwd}">Copy Password</button>`
                            : '<p>Find in the terminal</p>'
                    }
                </div>
            `
        })
        .join('\n' + ' '.repeat(8))

    await writeFile(
        resolve('index.html'),
        indexHTML.replace('<!--TEST-RESULTS-->', results),
    )

    console.log(
        '\nOpen another terminal and run the `test:verify` npm script to verify test results in a browser.\n',
    )
}

main().catch((err) => console.error(err))
