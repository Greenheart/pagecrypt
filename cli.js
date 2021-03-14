#!/usr/bin/env node

const yargs = require('yargs')
const { hideBin } = require('yargs/helpers')

const { encrypt } = require('./index')

const argv = yargs(hideBin(process.argv))
    .scriptName('pagecrypt')
    .usage('🔐 Usage: $0 [input-file] [output-file] [password]')
    .example('$0 input.html out.html strong-password')
    .command('[input-file]', false)
    .help('[input-file]', 'Input HTML file to encrypt.')
    .command('[output-file]', false)
    .help(
        '[output-file]',
        'Output HTML file where you want to save the encrypted result.',
    )
    .command('[password]', false)
    .help(
        '[password]',
        'Password to decrypt the your output HTML file. Use a strong password.',
    )
    .demandCommand(3, 3)
    .alias('h', 'help')
    .alias('v', 'version')
    .help().argv

async function cli() {
    if (argv._?.length === 3) {
        const [inputFile, outputFile, password] = argv._
        console.log(`🔐 Encrypting ${inputFile} → ${outputFile}`)
        await encrypt(inputFile, outputFile, password)
    }
}

cli()
