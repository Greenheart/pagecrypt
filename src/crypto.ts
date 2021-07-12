// Isomorphic pattern to load Web Crypto in both browsers and Node.js
async function loadCrypto(): Promise<Crypto> {
    if (globalThis && globalThis.crypto) {
        // Running in browsers from 2018 and newer.
        return new Promise((resolve, _reject) => resolve(globalThis.crypto))
    } else {
        // Running in Node.js >= 15
        const cryptoLocal = await import('crypto')
        return ((cryptoLocal.webcrypto as unknown) as Crypto)
    }
}

const crypto = await loadCrypto()
export default crypto
