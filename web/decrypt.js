import { base64 } from 'rfc4648'

const find = document.querySelector.bind(document)
const [pwd, header, msg, form, load] = [
    'input',
    'header',
    '#msg',
    'form',
    '#load',
].map(find)

let salt, iv, ciphertext

document.addEventListener('DOMContentLoaded', async () => {
    const pl = find('pre').innerText
    if (!pl) {
        pwd.disabled = true
        error('No encrypted payload.')
    }

    const bytes = base64.parse(pl)
    salt = bytes.slice(0, 32)
    iv = bytes.slice(32, 32 + 16)
    ciphertext = bytes.slice(32 + 16)

    if (sessionStorage.k) {
        await decrypt()
    } else {
        hide(load)
        show(form)
        header.classList.replace('hidden', 'flex')
        pwd.focus()
    }
})

const subtle = window.crypto?.subtle || window.crypto?.webkitSubtle

if (!window.crypto.subtle) {
    error('Please use a modern browser.')
    pwd.disabled = true
}

function show(element) {
    element.classList.remove('hidden')
}

function hide(element) {
    element.classList.add('hidden')
}

function error(text) {
    msg.innerText = text
    header.classList.add('text-red-600')
}

form.addEventListener('submit', async (event) => {
    event.preventDefault()
    await decrypt()
})

async function sleep(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function decrypt() {
    load.lastElementChild.innerText = 'Decrypting...'
    hide(header)
    hide(form)
    show(load)
    await sleep(60)

    try {
        const decrypted = await decryptFile({ salt, iv, ciphertext }, pwd.value)

        document.write(decrypted)
        document.close()
    } catch (e) {
        hide(load)
        show(form)
        header.classList.replace('hidden', 'flex')

        if (sessionStorage.k) {
            // Delete invalid key
            sessionStorage.removeItem('k')
        } else {
            // Only show when user actually entered a password themselves.
            error('Wrong password.')
        }

        pwd.value = ''
        pwd.focus()
    }
}

async function deriveKey(salt, password) {
    const encoder = new TextEncoder()
    const baseKey = await subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        true,
        ['deriveKey'],
    )
    return await subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: 2e6, hash: 'SHA-256' },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        true,
        ['decrypt'],
    )
}

async function importKey(key) {
    return subtle.importKey('jwk', key, 'AES-GCM', true, ['decrypt'])
}

async function decryptFile({ salt, iv, ciphertext }, password) {
    const decoder = new TextDecoder()

    const key = sessionStorage.k
        ? await importKey(JSON.parse(sessionStorage.k))
        : await deriveKey(salt, password)

    const data = new Uint8Array(
        await subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext),
    )
    if (!data) throw 'Malformed data'

    // If no exception were thrown, decryption succeded and we can save the key.
    sessionStorage.k = JSON.stringify(await subtle.exportKey('jwk', key))

    return decoder.decode(data)
}
