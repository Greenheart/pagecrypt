#!/usr/bin/env node

const CryptoJS = require('crypto-js')
const { promises } = require('fs')
const { mkdir, readFile, writeFile } = promises
const { resolve, dirname } = require('path')
const yargs = require('yargs')
const { hideBin } = require('yargs/helpers')

const packageRootDir = dirname(require.main.filename)

function getEncryptedFile(contents, password) {
    const salt = CryptoJS.lib.WordArray.random(256 / 8)
    const iv = CryptoJS.lib.WordArray.random(128 / 8)
    const key = CryptoJS.PBKDF2(password, salt, {
        keySize: 256 / 32,
        iterations: 100,
    })
    const encrypted = CryptoJS.AES.encrypt(contents, key, { iv: iv })
    return { salt: salt, iv: iv, data: encrypted }
}

async function encryptFile(inputFilename, password) {
    let content
    try {
        content = await readFile(resolve(process.cwd(), inputFilename), {
            encoding: 'utf-8',
        })
    } catch (e) {
        console.error('❌ Error reading file: ', e)
        process.exit(1)
    }

    const templateHTML = await readFile(
        resolve(packageRootDir, 'decrypt-template.html'),
        { encoding: 'utf8' },
    )

    const encryptedFile = getEncryptedFile(content, password)

    const salt = CryptoJS.enc.Base64.stringify(encryptedFile.salt)
    const iv = CryptoJS.enc.Base64.stringify(encryptedFile.iv)
    const cipherText = CryptoJS.enc.Base64.stringify(
        encryptedFile.data.ciphertext,
    )
    const encryptedJSON = JSON.stringify({
        salt: salt,
        iv: iv,
        data: cipherText,
    })

    return templateHTML.replace('/*{{ENCRYPTED_PAYLOAD}}*/""', encryptedJSON)
}

async function saveFile(outputFile, content) {
    await mkdir(dirname(outputFile), { recursive: true })

    return writeFile(resolve(process.cwd(), outputFile), content)
}

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
        const encrypted = await encryptFile(inputFile, password)
        saveFile(outputFile, encrypted)
    }
}

exports.saveFile = saveFile
exports.encryptFile = encryptFile
exports.cli = cli

cli()
