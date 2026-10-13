import { encryptHTML, generatePassword } from '../src/core'

export function checkedIterations(value) {
    const number = Number(value)
    if (!Number.isInteger(number) || number < 1 || number > 2_147_483_647) {
        throw new Error('invalidIterations')
    }
    return number
}

export function readPayload(html) {
    const match = html.match(
        /<pre\b[^>]*\bdata-i\s*=\s*["']([^"']+)["'][^>]*>([A-Za-z0-9+/=\s]*)<\/pre>/i,
    )
    if (!match) throw new Error('invalidPayload')
    const iterations = checkedIterations(match[1])
    const encoded = match[2].replace(/\s/g, '')
    if (!encoded || encoded.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) {
        throw new Error('invalidPayload')
    }
    const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0))
    if (bytes.length < 64) throw new Error('invalidPayload')
    return {
        salt: bytes.slice(0, 32),
        iv: bytes.slice(32, 48),
        ciphertext: bytes.slice(48),
        iterations,
    }
}

// Restore the payload as text. Rendering the recovered document is left to the user.
export async function decryptText(html, password) {
    const { salt, iv, ciphertext, iterations } = readPayload(html)
    const baseKey = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveKey'],
    )
    const key = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt'],
    )
    const data = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
    return new TextDecoder('utf-8', { fatal: true }).decode(data)
}

export function generate(length, characters) {
    if (!Number.isInteger(length) || length < 1 || length > 10_000) throw new Error('invalidLength')
    if (
        characters !== undefined &&
        (typeof characters !== 'string' ||
            !characters.length ||
            characters.length > 255 ||
            /[\u0000-\u001F\u007F\uD800-\uDFFF]/.test(characters))
    )
        throw new Error('invalidCharacters')
    return generatePassword(length, characters)
}

export async function processTask(type, data, progress = () => {}) {
    if (!globalThis.crypto?.subtle) throw new Error('unsupportedBrowser')
    switch (type) {
        case 'generate':
            return { password: generate(data.length, data.characters) }
        case 'inspect':
            return { iterations: readPayload(data.html).iterations }
        case 'encrypt': {
            if (!data.html) throw new Error('missingHTML')
            if (!data.password) throw new Error('missingPassword')
            progress('encrypting')
            const html = await encryptHTML(
                data.html,
                data.password,
                checkedIterations(data.iterations),
            )
            if (data.verify) {
                progress('verifying')
                if ((await decryptText(html, data.password)) !== data.html)
                    throw new Error('verificationFailed')
            }
            const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(html))
            const sha256 = Array.from(new Uint8Array(digest), (value) =>
                value.toString(16).padStart(2, '0'),
            ).join('')
            return { html, verified: data.verify, sha256 }
        }
        case 'decrypt':
            if (!data.password) throw new Error('missingPassword')
            progress('decrypting')
            return { html: await decryptText(data.html, data.password) }
        default:
            throw new Error('operationFailed')
    }
}
