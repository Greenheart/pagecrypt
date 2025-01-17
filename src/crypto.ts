/**
 * Get a reference to the Web Crypto API in any modern JS environment
 *
 * @returns An object implementing the Web Crypto API.
 */
async function loadCrypto(): Promise<Crypto> {
    if (globalThis?.crypto) {
        // `globalThis` exists in modern browsers and runtimes like Deno, Bun or CloudFlare Workers
        return globalThis.crypto
    } else if (window?.crypto) {
        // Some older browsers released after 2017 only expose the crypto API via the window.
        return window.crypto
    } else {
        // Node.js
        return (await import('crypto')).webcrypto as unknown as Crypto
    }
}

const crypto = await loadCrypto()
export default crypto
