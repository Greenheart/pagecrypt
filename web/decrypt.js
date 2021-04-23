import forge from 'node-forge'

const find = document.querySelector.bind(document)
const [pwd, iframe, header, msg, locked, unlocked] = [
    'input',
    'iframe',
    'header',
    '#msg',
    '#locked',
    '#unlocked',
].map(find)

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
        const decrypted = decryptFile(pl, pwd.value)
        if (!decrypted) throw 'Malformed data'

        success('Success!')

        // Set default iframe link targets to _top so all links break out of the iframe
        iframe.srcdoc = decrypted.replace(
            '<head>',
            '<head><base href="." target="_top">',
        )

        window.setTimeout(() => {
            find('main').remove()
            show(iframe)
            document.querySelectorAll('script').forEach((s) => s.remove())
        }, 1000)
    } catch (e) {
        error('Wrong password.')
        pwd.value = ''
    }
})

if (pl === '') {
    pwd.disabled = true
    error('No encrypted payload.')
}

function decryptFile(pl, password) {
    const salt = forge.util.decode64(pl.salt)
    const key = forge.pkcs5.pbkdf2(password, salt, 1e5, 32)

    const decipher = forge.cipher.createDecipher('AES-GCM', key)
    decipher.start({
        iv: forge.util.decode64(pl.iv),
        tag: new forge.util.ByteStringBuffer(forge.util.decode64(pl.tag)),
    })
    decipher.update(forge.util.createBuffer(forge.util.decode64(pl.data)))
    decipher.finish()

    const decryptedBuffer = forge.util.createBuffer()
    decryptedBuffer.putBuffer(decipher.output)
    return decryptedBuffer.toString()
}
