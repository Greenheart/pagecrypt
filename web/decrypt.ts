import { parse } from '../src/base64'

function find<T>(selector: string): T {
    const element = document.querySelector(selector) as T
    if (element) return element
    throw new Error('No element found with selector: ' + selector)
}

const pwd = find<HTMLInputElement>('#pwd')
const msg = find<HTMLParagraphElement>('#msg')
const form = find<HTMLFormElement>('form')
const unlock = find<HTMLInputElement>('#unlock')
const languageSelect = find<HTMLSelectElement>('#language')

const messages = {
    en: {
        title: 'Protected Page',
        protected: 'This page is password protected.',
        password: 'Password',
        unlock: 'Unlock',
        unlocking: 'Unlocking…',
        wrongPassword: 'Incorrect password. Try again.',
        missingPayload: 'The encrypted content is missing or invalid.',
        missingCrypto: 'This browser does not support decryption.',
        language: 'Language',
    },
    'zh-CN': {
        title: '受密码保护的页面',
        protected: '此页面受密码保护。',
        password: '输入密码',
        unlock: '解锁',
        unlocking: '正在解锁…',
        wrongPassword: '密码不正确，请重试。',
        missingPayload: '加密内容缺失或无效。',
        missingCrypto: '此浏览器不支持解密。',
        language: '语言',
    },
}
type Language = keyof typeof messages
type Message = 'protected' | 'wrongPassword' | 'missingPayload' | 'missingCrypto'
let language: Language = document.documentElement.lang === 'zh-CN' ? 'zh-CN' : 'en'
let message: Message = 'protected'
let busy = false
let ready = false

function render() {
    const text = messages[language]
    document.documentElement.lang = language
    document.title = text.title
    languageSelect.value = language
    languageSelect.setAttribute('aria-label', text.language)
    msg.textContent = text[message]
    msg.classList.toggle('error', message !== 'protected')
    pwd.placeholder = text.password
    pwd.setAttribute('aria-label', text.password)
    pwd.setAttribute('aria-invalid', String(message === 'wrongPassword'))
    pwd.disabled = busy || !ready
    unlock.value = busy ? text.unlocking : text.unlock
    unlock.disabled = busy || !ready
    form.setAttribute('aria-busy', String(busy))
}

languageSelect.addEventListener('change', () => {
    language = languageSelect.value === 'zh-CN' ? 'zh-CN' : 'en'
    render()
})
pwd.addEventListener('input', () => {
    if (message === 'wrongPassword') {
        message = 'protected'
        render()
    }
})
render()

let salt: Uint8Array<ArrayBuffer>,
    iv: Uint8Array<ArrayBuffer>,
    ciphertext: Uint8Array<ArrayBuffer>,
    iterations: number

const subtle =
    window.crypto?.subtle ||
    (window.crypto as unknown as { webkitSubtle: Crypto['subtle'] })?.webkitSubtle

document.addEventListener('DOMContentLoaded', async () => {
    if (!subtle) {
        message = 'missingCrypto'
        render()
        return
    }
    const payload = document.querySelector<HTMLPreElement>('pre[data-i]')
    try {
        if (!payload?.textContent) throw new Error('Missing payload')
        iterations = Number(payload.dataset.i)
        const bytes = parse(payload.textContent.trim())
        salt = bytes.slice(0, 32)
        iv = bytes.slice(32, 48)
        ciphertext = bytes.slice(48)
    } catch {
        message = 'missingPayload'
        render()
        return
    }
    ready = true
    render()

    // Password links use the fragment, which is removed from the address bar.
    if (location.hash) {
        const parts = location.href.split('#')
        pwd.value = parts[1]
        history.replaceState(null, '', parts[0])
    }

    if (sessionStorage.k || pwd.value) {
        await decrypt()
    } else {
        pwd.focus()
    }
})

form.addEventListener('submit', async (event) => {
    event.preventDefault()
    await decrypt()
})

async function decrypt() {
    if (!ready || busy) return
    busy = true
    message = 'protected'
    render()
    await new Promise((resolve) => setTimeout(resolve, 60))

    try {
        const decrypted = await decryptFile({ salt, iv, ciphertext, iterations }, pwd.value)
        document.write(decrypted)
        document.close()
    } catch {
        if (sessionStorage.k) {
            sessionStorage.removeItem('k')
        } else {
            message = 'wrongPassword'
        }
        busy = false
        pwd.value = ''
        render()
        pwd.focus()
    }
}

async function deriveKey(
    salt: Uint8Array<ArrayBuffer>,
    password: string,
    iterations: number,
): Promise<CryptoKey> {
    const encoder = new TextEncoder()
    const baseKey = await subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
        'deriveKey',
    ])
    return await subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        true,
        ['decrypt'],
    )
}

async function importKey(key: JsonWebKey) {
    return subtle.importKey('jwk', key, 'AES-GCM', true, ['decrypt'])
}

async function decryptFile(
    {
        salt,
        iv,
        ciphertext,
        iterations,
    }: {
        salt: Uint8Array<ArrayBuffer>
        iv: Uint8Array<ArrayBuffer>
        ciphertext: Uint8Array<ArrayBuffer>
        iterations: number
    },
    password: string,
) {
    const decoder = new TextDecoder()

    const key = sessionStorage.k
        ? await importKey(JSON.parse(sessionStorage.k))
        : await deriveKey(salt, password, iterations)

    const data = new Uint8Array(await subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext))
    if (!data) throw 'Malformed data'

    // If no exception were thrown, decryption succeded and we can save the key.
    sessionStorage.k = JSON.stringify(await subtle.exportKey('jwk', key))

    return decoder.decode(data)
}
