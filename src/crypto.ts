/**
 * Get a reference to the Web Crypto API in any modern JS environment
 *
 * @returns An object implementing the Web Crypto API.
 */
async function loadCrypto(): Promise<Crypto> {
    if ((window && window.crypto) || (globalThis && globalThis.crypto)) {
        // Running in browsers released after 2014, and other
        // runtimes with `globalThis` like Deno or CloudFlare Workers
        const subtle =
            window.crypto.subtle ||
            globalThis.crypto.subtle ||
            (
                window.crypto as unknown as {
                    webkitSubtle: Crypto['subtle']
                }
            )?.webkitSubtle

        return new Promise((resolve) =>
            resolve({
                getRandomValues: window.crypto.getRandomValues,
                subtle,
            }),
        )
    } else {
        // Running in Node.js >= 15
        const nodeCrypto = await import('crypto')
        return nodeCrypto.webcrypto as unknown as Crypto
    }
}

const crypto = await loadCrypto()
export default crypto
