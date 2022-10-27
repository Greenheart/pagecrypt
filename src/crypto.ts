/**
 * Get a reference to the Web Crypto API in any modern JS environment
 *
 * @returns An object implementing the Web Crypto API.
 */
async function loadCrypto(): Promise<Crypto> {
    if (
        (typeof window !== 'undefined' && window.crypto) ||
        (globalThis && globalThis.crypto)
    ) {
        // Running in browsers released after 2017, and other
        // runtimes with `globalThis` like Deno or CloudFlare Workers
        const crypto = globalThis.crypto || window.crypto

        return new Promise((resolve) => resolve(crypto))
    } else {
        // Running in Node.js >= 15
        const nodeCrypto = await import('crypto')
        return nodeCrypto.webcrypto as unknown as Crypto
    }
}

const crypto = await loadCrypto()
export default crypto
