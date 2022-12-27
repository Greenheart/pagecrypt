#!/usr/bin/env node

import sade from 'sade'

import { encrypt, generatePassword } from './index'

import { name, version } from '../package.json'

sade(`${name} <src> <dest> [password]`, true)
    .version(version)
    .describe(
        'Encrypt the <src> HTML file with [password] and save the result in the <dest> HTML file.',
    )
    .example('index.html encrypted.html password')
    .example('index.html encrypted.html --generate-password 64')
    .example('index.html encrypted.html -g 64')
    .option(
        '-g, --generate-password',
        'Generate a random password with given length. Must be a number if used.',
    )
    .option('-i, --iterations', 'The number of password iterations.')
    .action(async (src, dest, password, options) => {
        const length = options['generate-password']
        const iterations = options['iterations']

        if (iterations !== undefined && !Number.isInteger(iterations)) {
            console.error(
                '❌: The option --iterations (-i) must be an integer.',
            )
            process.exit(1)
        }

        if (length) {
            if (Number.isInteger(length)) {
                const pass = generatePassword(length)
                console.log(`🔐 Encrypting ${src} → ${dest} with 🔑: ${pass}`)
                await encrypt(src, dest, pass, iterations)
            } else {
                console.error(
                    '❌: The <length> must be an integer when using --generate-password <length>',
                )
                process.exit(1)
            }
        } else if (password) {
            console.log(`🔐 Encrypting ${src} → ${dest} with 🔑: ${password}`)
            await encrypt(src, dest, password, iterations)
        } else {
            console.error(
                '❌: Either provide a password or use --generate-password <length>',
            )
            process.exit(1)
        }
    })
    .parse(process.argv)
