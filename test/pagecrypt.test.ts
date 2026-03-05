import { suite, test, type TestContext } from 'node:test'
import { exec as execCallback } from 'child_process'
import { promisify } from 'node:util'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { encrypt, encryptHTML, generatePassword } from 'pagecrypt'
import { writeFile } from 'node:fs/promises'

/*

IDEA: Remove pnpm overhead for each test case by defining test cases directly in TS instead.

"test:cli": "pagecrypt test.html out-cli.html eRx1sD0LrHTNubycv1IYgyNqU3Qc9GKPGcl3XT63JG7djgMxU9etkVNcK5Hak5GWDzm4mx6AQFlpOPsY",
"test:cli-gen": "pagecrypt test.html out-cli-gen.html --generate-password 64",
"test:cli-iterations": "pagecrypt test.html out-cli-iterations.html eRx1sD0LrHTNubycv1IYgyNqU3Qc9GKPGcl3XT63JG7djgMxU9etkVNcK5Hak5GWDzm4mx6AQFlpOPsY --iterations 3e6",
"test:cli-gen-iterations": "pagecrypt test.html out-cli-gen-iterations.html eRx1sD0LrHTNubycv1IYgyNqU3Qc9GKPGcl3XT63JG7djgMxU9etkVNcK5Hak5GWDzm4mx6AQFlpOPsY --generate-password 59 --iterations 2500000",
"test:cli-big": "pagecrypt test-big.html out-cli-big.html eRx1sD0LrHTNubycv1IYgyNqU3Qc9GKPGcl3XT63JG7djgMxU9etkVNcK5Hak5GWDzm4mx6AQFlpOPsY",

*/

const exec = promisify(execCallback)

const TEST_PASSWORD =
    'eRx1sD0LrHTNubycv1IYgyNqU3Qc9GKPGcl3XT63JG7djgMxU9etkVNcK5Hak5GWDzm4mx6AQFlpOPsY'

/**
 * Defines the output file and command to execute for each CLI test.
 * Will be updated with generated passwords so everything can be saved to the test result file.
 */
const CLI_PASSWORDS = {
    'out-cli.html': 'pnpm test:cli',
    'out-cli-gen.html': 'pnpm test:cli-gen',
    'out-cli-iterations.html': 'pnpm test:cli-iterations',
    'out-cli-gen-iterations.html': 'pnpm test:cli-gen-iterations',
    'out-cli-big.html': 'pnpm test:cli-big',
}

const inputFile = 'test.html'
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
            // TODO: assert that the output file exists
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
            // TODO: verify the output of encryptHTML
            await writeFile(jsOutFile2, encrypted)
            JS_API_PASSWORDS[jsOutFile2] = generatedPassword
        })

        test(
            encryptHTML.name + ' custom iterations',
            async (t: TestContext) => {
                const withIterations = await encryptHTML(
                    inputHTML,
                    TEST_PASSWORD,
                    2.1e6,
                )
                // TODO: Assert the output of encryptHTML
                // TODO: assert the iterations were included in the output
                await writeFile(jsOutFile3, withIterations)
            },
        )
    }),
    suite('pagecrypt CLI', () => {
        Object.entries(CLI_PASSWORDS).map(async ([file, cmd]) => {
            test(cmd.replace('pnpm', ''), async (t: TestContext) => {
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
