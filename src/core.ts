import { base64 } from 'rfc4648'

import crypto from './crypto'

// @ts-expect-error 2307 - Using esbuild to inline this HTML file as a string
import decryptTemplate from './decrypt-template.html'

/**
 * Encrypt a string and turn it into an encrypted payload.
 *
 * @param {string} content The data to encrypt
 * @param {string} password The password used to encrypt + decrypt the content.
 * @param {number} iterations The number of iterations to derive the key from the password.
 * @returns an encrypted payload
 */
async function getEncryptedPayload(
    content: string,
    password: string,
    iterations: number,
) {
    if (iterations < 2e6) {
        console.warn(
            `[pagecrypt]: WARNING: The specified number of password iterations (${iterations}) is not secure. If possible, use at least 2_000_000 or more.`,
        )
    }
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
        { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
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
    const mergedData = new Uint8Array(totalLength)
    mergedData.set(salt)
    mergedData.set(iv, salt.length)
    mergedData.set(ciphertext, salt.length + iv.length)

    return base64.stringify(mergedData)
}

/**
 * Encrypt an HTML string with a given password.
 * The resulting page can be viewed and decrypted by opening the output HTML file in a browser, and entering the correct password.
 *
 * @param {string} inputHTML The HTML string to encrypt.
 * @param {string} password The password used to encrypt + decrypt the content.
 * @param {number} iterations The number of iterations to derive the key from the password.
 * @returns A promise that will resolve with the encrypted HTML content
 */
export async function encryptHTML(
    inputHTML: string,
    password: string,
    iterations: number = 2e6,
) {
    return (decryptTemplate as string).replace(
        /<!--ENCRYPTED PAYLOAD-->/,
        `<pre class="hidden" data-i="${iterations}">${await getEncryptedPayload(
            inputHTML,
            password,
            iterations,
        )}</pre>`,
    )
}

/**
 * Generate a random password of a given length.
 *
 * @param {number} length The password length.
 * @param {string} characters The set of characters to pick from.
 * @returns A random password.
 */
export function generatePassword(
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
 * @param {string} characters The set of characters to pick from.
 * @returns A random character.
 */
function getRandomCharacter(characters: string) {
    let randomNumber
    // Due to the repeating nature of results from the remainder
    // operator, we potentially need to regenerate the random number
    // several times. This is required to ensure all characters have
    // the same probability to get picked. Otherwise, the first
    // characters would appear more often, resulting in a weaker
    // password security.
    // Learn more: https://samuelplumppu.se/blog/generate-password-in-browser-web-crypto-api
    do {
        randomNumber = crypto.getRandomValues(new Uint8Array(1))[0]
    } while (randomNumber >= 256 - (256 % characters.length))

    return characters[randomNumber % characters.length]
}
