import { suite, test, type TestContext } from 'node:test'
import { exec as execCallback } from 'child_process'
import { promisify } from 'node:util'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { encrypt, encryptHTML, generatePassword } from 'pagecrypt'
import { stat, writeFile } from 'node:fs/promises'

const exec = promisify(execCallback)

const TEST_PASSWORD =
    'eRx1sD0LrHTNubycv1IYgyNqU3Qc9GKPGcl3XT63JG7djgMxU9etkVNcK5Hak5GWDzm4mx6AQFlpOPsY'

const PAGECRYPT_CLI = './node_modules/.bin/pagecrypt'

const inputFile = 'test.html'

/**
 * Defines the output file and command to execute for each CLI test.
 * Will be updated with generated passwords so everything can be saved to the test result file.
 */
const CLI_PASSWORDS = {
    'out-cli.html': `${PAGECRYPT_CLI} ${inputFile} out-cli.html ${TEST_PASSWORD}`,
    'out-cli-gen.html': `${PAGECRYPT_CLI} ${inputFile} out-cli-gen.html --generate-password 64`,
    'out-cli-iterations.html': `${PAGECRYPT_CLI} ${inputFile} out-cli-iterations.html ${TEST_PASSWORD} --iterations 3e6`,
    'out-cli-gen-iterations.html': `${PAGECRYPT_CLI} ${inputFile} out-cli-gen-iterations.html ${TEST_PASSWORD} --generate-password 59 --iterations 2500000`,
    'out-cli-big.html': `${PAGECRYPT_CLI} test-big.html out-cli-big.html ${TEST_PASSWORD}`,
}

const inputHTML = readFileSync(resolve(inputFile), 'utf-8')

const jsOutFile1 = 'out-js.html'
const jsOutFile2 = 'out-js-gen.html'
const jsOutFile3 = 'out-js-gen-iterations.html'

/**
 * Defines the output files to use for JS API tests.
 * Will be updated with generated passwords so everything can be saved to the test result file.
 */
const JS_API_PASSWORDS = {
    [jsOutFile1]: TEST_PASSWORD,
    [jsOutFile2]: '<generated>',
    [jsOutFile3]: TEST_PASSWORD,
}

// Define all test suites in a promise to allow us to generate
// the test results file after all tests are done
await Promise.all([
    suite('pagecrypt JS API', () => {
        test(encrypt.name, async (t: TestContext) => {
            await encrypt(inputFile, jsOutFile1, TEST_PASSWORD)
            const fileStats = await stat(resolve(jsOutFile1))
            t.assert.ok(
                new Date().getTime() - fileStats.mtime.getTime() < 30_000,
                'output file was modified recently',
            )
        })

        test(
            generatePassword.name + ' with specific length',
            async (t: TestContext) => {
                t.assert.strictEqual(generatePassword(20).length, 20)
            },
        )

        test(
            generatePassword.name + ' with specific characters',
            async (t: TestContext) => {
                const characters = 'ab78åäö'
                const customPassword = generatePassword(20, characters)
                t.assert.strictEqual(customPassword.length, 20)
                t.assert.match(
                    customPassword,
                    new RegExp(`[${characters}]`),
                    'only includes allowed characters',
                )
                t.assert.doesNotMatch(
                    customPassword,
                    new RegExp(`[^${characters}]`),
                    'does not include other characters',
                )
            },
        )

        test(encryptHTML.name, async (t: TestContext) => {
            const generatedPassword = generatePassword(20)
            const encrypted = await encryptHTML(inputHTML, generatedPassword)
            t.assert.match(encrypted, /<pre class="hidden"/g)
            t.assert.ok(
                encrypted.indexOf('<pre class="hidden"') + 1000 <
                    encrypted.lastIndexOf('</pre>'),
                'ensure some encrypted content was added and rather than leaving an empty element',
            )
            await writeFile(jsOutFile2, encrypted)
            JS_API_PASSWORDS[jsOutFile2] = generatedPassword
        })

        test(
            encryptHTML.name + ' custom iterations',
            async (t: TestContext) => {
                const iterations = 2.1e6
                const withIterations = await encryptHTML(
                    inputHTML,
                    TEST_PASSWORD,
                    iterations,
                )
                t.assert.match(
                    withIterations,
                    /data-i="[^"]+"/,
                    'iterations should be added to output HTML',
                )
                const outputIterations = (withIterations.match(
                    /data-i="([^"]+)"/,
                ) ?? [])[1]

                t.assert.strictEqual(
                    Number(outputIterations),
                    iterations,
                    'iterations should match',
                )

                await writeFile(jsOutFile3, withIterations)
            },
        )
    }),
    suite('pagecrypt CLI', () => {
        Object.entries(CLI_PASSWORDS).map(async ([file, cmd]) => {
            test(file, async (t: TestContext) => {
                const { stdout, stderr } = await exec(cmd)

                t.assert.strictEqual(stderr.length, 0)

                CLI_PASSWORDS[file as keyof typeof CLI_PASSWORDS] =
                    stdout.includes('🔑')
                        ? // When generating passwords with the CLI, capture the output
                          stdout.split('🔑: ')[1].split('\n')[0]
                        : TEST_PASSWORD
            })
        })
    }),
])

function writeTestResultsHTMLFile(outputFiles: Record<string, string>) {
    const indexHTML = readFileSync(resolve('test-results.html'), 'utf-8')

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

    writeFileSync(
        resolve('index.html'),
        indexHTML.replace('<!--TEST-RESULTS-->', results),
    )

    setTimeout(() => {
        console.log(
            '\nOpen another terminal and run `pnpm test:verify` to verify test results in a browser.\n',
        )
    }, 100)
}

writeTestResultsHTMLFile({
    ...CLI_PASSWORDS,
    ...JS_API_PASSWORDS,
})
