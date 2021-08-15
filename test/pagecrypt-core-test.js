import { generatePassword, encryptHTML } from 'pagecrypt/core'

function download(filename, text) {
    const element = document.createElement('a')
    element.setAttribute(
        'href',
        'data:text/html;charset=utf-8,' + encodeURIComponent(text),
    )
    element.setAttribute('download', filename)

    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
}

const OUT_BROWSER_FILENAME = 'out-browser-gen.html'

async function copyPassword(e) {
    const labelBefore = e.target.innerText.slice()
    await navigator.clipboard.writeText(e.target.dataset.pwd)
    e.target.innerText = 'Copied!'
    setTimeout(() => {
        e.target.innerText = labelBefore
    }, 1500)
}

document
    .querySelectorAll('[data-pwd]')
    .forEach((btn) => btn.addEventListener('click', copyPassword))

function addBrowserEncrypted() {
    const btn = document.createElement('button')
    const label = 'Download Encrypted'
    btn.innerText = label

    if (sessionStorage.link) {
        btn.innerText = 'Copy Password'
        btn.dataset.pwd = sessionStorage.link.split('#')[1]
        btn.addEventListener('click', copyPassword)
    } else {
        btn.addEventListener('click', async (e) => {
            const password = generatePassword(16)
            btn.dataset.pwd = password
            btn.innerText = 'Encrypting...'
            btn.disabled = true
            console.time('🔐 Encrypting')

            const html = await encryptHTML(testHTML, password)

            const link = `/${OUT_BROWSER_FILENAME}#${password}`
            sessionStorage.link = link
            btn.nextElementSibling.href = link
            btn.previousElementSibling.href = link

            download(OUT_BROWSER_FILENAME, html)
            console.timeEnd('🔐 Encrypting')
            btn.disabled = false
            btn.innerText = 'Copy Password'

            const copyBtn = btn.cloneNode(true)
            copyBtn.addEventListener('click', copyPassword)
            btn.parentNode.replaceChild(copyBtn, btn)
        })
    }

    const link = document.createElement('a')
    link.innerText = OUT_BROWSER_FILENAME
    link.target = '_blank'
    if (sessionStorage.link) link.href = sessionStorage.link.split('#')[0]

    const magicLink = document.createElement('a')
    magicLink.innerText = '#'
    magicLink.target = '_blank'
    if (sessionStorage.link) magicLink.href = sessionStorage.link

    const div = document.createElement('div')
    div.id = OUT_BROWSER_FILENAME
    div.appendChild(link)
    div.appendChild(btn)
    div.appendChild(magicLink)
    document.querySelector('.results').appendChild(div)
}

addBrowserEncrypted()

document.querySelector('#reset').addEventListener('click', (e) => {
    delete sessionStorage.link
    window.location.reload()
})

const testHTML = await fetch('/test.html')
    .then((res) => res.text())
    .then((html) =>
        html.replace(`<script type="module" src="/@vite/client"></script>`, ''),
    )
