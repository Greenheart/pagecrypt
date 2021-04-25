import { base64 } from 'rfc4648'

const find = document.querySelector.bind(document)
const [pwd, iframe, header, msg, locked, unlocked] = [
    'input',
    'iframe',
    'header',
    '#msg',
    '#locked',
    '#unlocked',
].map(find)

if (window.pl === '') {
    pwd.disabled = true
    error('No encrypted payload.')
}

const bytes = base64.parse(window.pl)
const salt = bytes.slice(0, 32)
const iv = bytes.slice(32, 32 + 16)
const ciphertext = bytes.slice(32 + 16)

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
    header.classList.toggle('text-red-600', true)
    header.classList.toggle('text-green-600', false)
    show(locked)
    hide(unlocked)
}

function success(text) {
    msg.innerText = text
    header.classList.toggle('text-green-600', true)
    header.classList.toggle('text-red-600', false)
    show(unlocked)
    hide(locked)
}

function status(text) {
    msg.innerText = text
    header.classList.toggle('text-green-600', false)
    header.classList.toggle('text-red-600', false)
    show(locked)
    hide(unlocked)
}

async function sleep(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

find('form').addEventListener('submit', async (event) => {
    event.preventDefault()

    try {
        status('Decrypting...')
        await sleep(60)
        const decrypted = await decryptFile({ salt, iv, ciphertext }, pwd.value)
        if (!decrypted) throw 'Malformed data'

        success('Success!')

        // Set default iframe link targets to _top so all links break out of the iframe
        iframe.srcdoc = decrypted.replace(
            '<head>',
            '<head><base href="." target="_top">',
        )
        const match = decrypted.match(/<title[^>]*>([^<]+)<\/title>/)
        const title = match ? match[1] : ''

        window.setTimeout(() => {
            if (title) {
                iframe.title = title
                find('title').innerText = title
            }
            find('main').remove()
            show(iframe)
            document.querySelectorAll('script').forEach((s) => s.remove())
        }, 1000)
    } catch (e) {
        error('Wrong password.')
        pwd.value = ''
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
