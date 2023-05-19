/**
 * Get a reference to the Web Crypto API in any modern JS environment
 *
 * @returns An object implementing the Web Crypto API.
 */
async function loadCrypto(): Promise<Crypto> {
    if (globalThis && globalThis.crypto) {

        // Running in browsers released after 2017, and other
        // runtimes with `globalThis` like Deno or CloudFlare Workers
        const crypto = globalThis.crypto

        return new Promise((resolve) => resolve(crypto))
    } else if (typeof window !== 'undefined' && window.crypto) {
        const crypto = window.crypto
        return new Promise((resolve) => resolve(crypto))
    } else {
        const nodeCrypto = await import('crypto')
        return nodeCrypto.webcrypto as unknown as Crypto
    }
}

const crypto = await loadCrypto()
export default crypto
