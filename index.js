const CryptoJS = require('crypto-js')
const { mkdir, readFile, writeFile } = require('fs/promises')
const { resolve, dirname } = require('path')

const packageRootDir = dirname(__filename)

function getEncryptedContents(contents, password) {
    const salt = CryptoJS.lib.WordArray.random(256 / 8)
    const iv = CryptoJS.lib.WordArray.random(128 / 8)
    const key = CryptoJS.PBKDF2(password, salt, {
        keySize: 256 / 32,
        iterations: 100,
    })
    const encrypted = CryptoJS.AES.encrypt(contents, key, { iv: iv })
    return { salt: salt, iv: iv, data: encrypted }
}

/**
 * Encrypt a HTML file with a given password.
 * The resulting page can be viewed and decrypted by opening the output HTML file in a browser, and entering the correct password.
 *
 * @param {string} inputFile The filename (or path) to the HTML file to encrypt.
 * @param {string} password The password which will be used to encrypt + decrypt the content.
 * @returns A promise that will resolve with the encrypted HTML content
 */
async function encryptFile(inputFile, password) {
    let content
    try {
        content = await readFile(resolve(process.cwd(), inputFile), {
            encoding: 'utf-8',
        })
    } catch (e) {
        console.error('❌ Error reading file: ', e)
        process.exit(1)
    }

    return await encryptHTML(content, password)
}

/**
 * Encrypt an HTML string with a given password.
 * The resulting page can be viewed and decrypted by opening the output HTML file in a browser, and entering the correct password.
 *
 * @param {string} inputHTML The filename (or path) to the HTML file to encrypt.
 * @param {string} password The password which will be used to encrypt + decrypt the content.
 * @returns A promise that will resolve with the encrypted HTML content
 */
async function encryptHTML(inputHTML, password) {
    const templateHTML = await readFile(
        resolve(packageRootDir, 'decrypt-template.html'),
        { encoding: 'utf-8' },
    )

    const encryptedFile = getEncryptedContents(inputHTML, password)

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

/**
 * Save a file, creating directories and files if they don't yet exist
 *
 * @param {string} outputFile The filename (or path) where the file will be saved
 * @param {string} content The file content
 * @returns A promise that will resolve when the file has been saved.
 */
async function saveFile(outputFile, content) {
    await mkdir(dirname(outputFile), { recursive: true })

    return writeFile(resolve(process.cwd(), outputFile), content, {
        encoding: 'utf8',
    })
}

/**
 * Encrypt a HTML file with a given password.
 * The resulting page can be viewed and decrypted by opening the output HTML file in a browser, and entering the correct password.
 *
 * @param {string} inputFile The filename (or path) to the HTML file to encrypt.
 * @param {string} outputFile The filename (or path) where the encrypted HTML file will be saved.
 * @param {string} password The password which will be used to encrypt + decrypt the content.
 * @returns A promise that will resolve when the encrypted file has been saved.
 */
async function encrypt(inputFile, outputFile, password) {
    const encrypted = await encryptFile(inputFile, password)
    return await saveFile(outputFile, encrypted)
}

exports.encryptHTML = encryptHTML
exports.encrypt = encrypt
