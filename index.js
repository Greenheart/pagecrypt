import { base64 } from 'rfc4648'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

import crypto from './crypto.js'

const packageRootDir = dirname(fileURLToPath(import.meta.url))

/**
 * Encrypt a string and turn it into an encrypted payload.
 *
 * @param {string} content The data to encrypt
 * @param {string} password The password which will be used to encrypt + decrypt the content.
 * @returns an encrypted payload
 */
async function getEncryptedPayload(content, password) {
    const encoder = new TextEncoder()
    const salt = crypto.getRandomValues(new Uint8Array(32))
    const baseKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveKey'],
    )
    const key = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: 2e6, hash: 'SHA-256' },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt'],
    )

    const iv = crypto.getRandomValues(new Uint8Array(16))
    const ciphertext = new Uint8Array(
        await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            encoder.encode(content),
        ),
    )
    const totalLength = salt.length + iv.length + ciphertext.length
    const data = new Uint8Array(
        Buffer.concat([salt, iv, ciphertext], totalLength),
    )

    return base64.stringify(data)
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
 * @param {string} inputHTML The HTML string to encrypt.
 * @param {string} password The password which will be used to encrypt + decrypt the content.
 * @returns A promise that will resolve with the encrypted HTML content
 */
async function encryptHTML(inputHTML, password) {
    const templateHTML = await readFile(
        resolve(packageRootDir, 'decrypt-template.html'),
        { encoding: 'utf-8' },
    )

    return templateHTML.replace(
        /<!--ENCRYPTED PAYLOAD-->/,
        `<pre class="hidden">${await getEncryptedPayload(
            inputHTML,
            password,
        )}</pre>`,
    )
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

/**
 * Generate a random password of a given length.
 *
 * @param {number} length The password length.
 * @param {string} characters The characters used to generate the password.
 * @returns A random password.
 */
function generatePassword(
    length = 80,
    characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
) {
    return Array.from({ length }, (_) => getRandomCharacter(characters)).join(
        '',
    )
}

/**
 * Get a random character from a given set of characters.
 *
 * @param {string} characters The characters used to generate the password.
 * @returns A random character.
 */
function getRandomCharacter(characters) {
    let randomNumber

    // Due to the repeating nature of results from the modulus operand, we potentially need to regenerate the random number several times.
    // This is required to ensure all characters have the same probability to get picked.
    // Otherwise, the first characters would appear more often, resulting in a weaker password security.
    do {
        randomNumber = crypto.getRandomValues(new Uint8Array(1))[0]
    } while (randomNumber >= 256 - (256 % characters.length))

    return characters[randomNumber % characters.length]
}

export { encryptHTML, encrypt, generatePassword }
