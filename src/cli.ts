#!/usr/bin/env node

import { parseArgs } from 'node:util'

import { encrypt, generatePassword } from './index'
import { name, version } from '../package.json'

const {
    positionals,
    values: {
        'generate-password': generatedLength,
        iterations: passwordIterations,
        compress: comPress,
        help: printHelp,
        version: printVersion,
    },
} = parseArgs({
    allowPositionals: true,

    options: {
        'generate-password': {
            short: 'g',
            type: 'string',
        },
        iterations: {
            short: 'i',
            type: 'string',
        },
        compress: {
            short: 'c',
            type: 'boolean',
            default: false,
        },
        version: {
            short: 'v',
            type: 'boolean',
        },
        help: {
            short: 'h',
            type: 'boolean',
        },
    },
})

async function main() {
    const [src, dest, password] = positionals

    if (!src || !dest) {
        console.error('Usage: $ pagecrypt <src> <dest> [password] [options]')
        process.exit(1)
    }

    const length = generatedLength ? parseInt(generatedLength) : undefined
    const iterations = passwordIterations
        ? Number(passwordIterations)
        : undefined

    if (iterations !== undefined && !Number.isInteger(iterations)) {
        console.error('❌: The option --iterations (-i) must be an integer.')
        process.exit(1)
    }

    if (length) {
        if (Number.isInteger(length)) {
            const pass = generatePassword(length)
            console.log(`🔐 Encrypting ${src} → ${dest} with 🔑: ${pass}`)
            await encrypt(src, dest, pass, iterations, comPress)
        } else {
            console.error(
                '❌: The <length> must be an integer when using --generate-password <length>',
            )
            process.exit(1)
        }
    } else if (password) {
        console.log(`🔐 Encrypting ${src} → ${dest}`)
        await encrypt(src, dest, password, iterations, comPress)
    } else {
        console.error(
            '❌: Either provide a password or use --generate-password <length>',
        )
        process.exit(1)
    }
}

if (printHelp) {
    console.log(`
  Description
    Encrypt the <src> HTML file with [password] and save the result in the <dest> HTML file.

  Usage
    $ pagecrypt <src> <dest> [password] [options]

  Options
    -g, --generate-password    Generate a random password with given length. Must be a number if used.
    -i, --iterations           The number of password iterations.
    -c, --compress             Compress input before encrypting
    -v, --version              Display current version
    -h, --help                 Display this message

  Examples
    $ pagecrypt index.html encrypted.html password
    $ pagecrypt index.html encrypted.html --generate-password 64
    $ pagecrypt index.html encrypted.html -g 64
    $ pagecrypt index.html encrypted.html password --iterations 3e6
    $ pagecrypt index.html encrypted.html -g 64 --i 3e6
`)
} else if (printVersion) {
    console.log(`${name}, ${version}`)
} else {
    await main()
}
