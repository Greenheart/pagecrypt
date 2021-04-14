const forge = require('node-forge')

const { mkdir, readFile, writeFile } = require('fs/promises')
const { resolve, dirname } = require('path')

const packageRootDir = dirname(__filename)

/**
 * Encrypt a string and turn it into an encrypted payload.
 *
 * @param {string} content The data to encrypt
 * @param {string} password The password which will be used to encrypt + decrypt the content.
 * @returns an encrypted payload
 */
function getEncryptedPayload(content, password) {
    const salt = forge.random.getBytesSync(256)
    const key = forge.pkcs5.pbkdf2(password, salt, 2e5, 32)
    const iv = forge.random.getBytesSync(16)

    const cipher = forge.cipher.createCipher('AES-GCM', key)
    cipher.start({ iv })
    cipher.update(forge.util.createBuffer(content))
    cipher.finish()

    const tag = cipher.mode.tag
    const encrypted = forge.util.createBuffer()
    encrypted.putBuffer(cipher.output)
    const encryptedBuffer = Buffer.from(encrypted.getBytes(), 'binary')

    return {
        iv: forge.util.encode64(iv),
        tag: forge.util.encode64(tag.getBytes()),
        salt: forge.util.encode64(salt),
        data: forge.util.encode64(encryptedBuffer.toString('binary')),
    }
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

    const encryptedPayload = JSON.stringify(
        getEncryptedPayload(inputHTML, password),
    )
    return templateHTML.replace('/*{{ENCRYPTED_PAYLOAD}}*/""', encryptedPayload)
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
