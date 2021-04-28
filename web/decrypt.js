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

    hide(load)
    show(form)
    header.classList.replace('hidden', 'flex')
    pwd.focus()
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

async function sleep(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

form.addEventListener('submit', async (event) => {
    event.preventDefault()

    load.lastElementChild.innerText = 'Decrypting...'
    hide(header)
    hide(form)
    show(load)

    try {
        await sleep(60)
        const decrypted = await decryptFile({ salt, iv, ciphertext }, pwd.value)
        if (!decrypted) throw 'Malformed data'

        document.write(decrypted)
        document.close()
    } catch (e) {
        hide(load)
        show(form)
        header.classList.replace('hidden', 'flex')
        error('Wrong password.')
        pwd.value = ''
        pwd.focus()
    }
})

async function decryptFile({ salt, iv, ciphertext }, password) {
    const decoder = new TextDecoder()
    const encoder = new TextEncoder()

    const baseKey = await subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveKey'],
    )
    const key = await subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: 2e6, hash: 'SHA-256' },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt'],
    )

    const data = new Uint8Array(
        await subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext),
    )
    return decoder.decode(data)
}
