import { mkdir, readFile, writeFile } from 'fs/promises'
import { resolve, dirname } from 'path'

import { generatePassword, encryptHTML } from './core'

/**
 * Encrypt a HTML file with a given password.
 * The resulting page can be viewed and decrypted by opening the output HTML file in a browser, and entering the correct password.
 *
 * @param inputFile The filename (or path) to the HTML file to encrypt.
 * @param password The password used to encrypt + decrypt the content.
 * @param iterations The number of iterations to derive the key from the password.
 * @returns A promise that will resolve with the encrypted HTML content
 */
async function encryptFile(
    inputFile: string,
    password: string,
    iterations?: number,
) {
    let content: string
    try {
        content = await readFile(resolve(process.cwd(), inputFile), {
            encoding: 'utf-8',
        })
    } catch (e) {
        console.error('❌ Error reading file: ', e)
        process.exit(1)
    }

    return await encryptHTML(content, password, iterations)
}

/**
 * Save a file, creating directories and files if they don't yet exist
 *
 * @param outputFile The filename (or path) where the file will be saved
 * @param content The file content
 * @returns A promise that will resolve when the file has been saved.
 */
async function saveFile(outputFile: string, content: string) {
    await mkdir(dirname(outputFile), { recursive: true })

    return writeFile(resolve(process.cwd(), outputFile), content, {
        encoding: 'utf8',
    })
}

/**
 * Encrypt a HTML file with a given password.
 * The resulting page can be viewed and decrypted by opening the output HTML file in a browser, and entering the correct password.
 *
 * @param inputFile The filename (or path) to the HTML file to encrypt.
 * @param outputFile The filename (or path) where the encrypted HTML file will be saved.
 * @param password The password used to encrypt + decrypt the content.
 * @param iterations The number of iterations to derive the key from the password.
 * @returns A promise that will resolve when the encrypted file has been saved.
 */
async function encrypt(
    inputFile: string,
    outputFile: string,
    password: string,
    iterations?: number,
) {
    const encrypted = await encryptFile(inputFile, password, iterations)
    return await saveFile(outputFile, encrypted)
}

export { encrypt, generatePassword, encryptHTML }
