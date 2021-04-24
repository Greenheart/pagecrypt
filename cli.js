#!/usr/bin/env node

const sade = require('sade')

const { encrypt } = require('./index')
const pkg = require('./package.json')

sade(`${pkg.name} <src> <dest> <password>`, true)
    .version(pkg.version)
    .describe(
        'Encrypt the <src> HTML file with <password> and save the result in the <dest> HTML file.',
    )
    .example('index.html encrypted.html password')
    .action(async (src, dest, password) => {
        console.log(`🔐 Encrypting ${src} → ${dest}`)
        await encrypt(src, dest, password)
    })
    .parse(process.argv)
