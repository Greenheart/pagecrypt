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

function addBrowserEncrypted(inputHTML, storageKey, filename) {
    const btn = document.createElement('button')
    const label = 'Download Encrypted'
    btn.innerText = label

    if (sessionStorage[storageKey]) {
        btn.innerText = 'Copy Password'
        btn.dataset.pwd = sessionStorage[storageKey].split('#')[1]
        btn.addEventListener('click', copyPassword)
    } else {
        btn.addEventListener('click', async (e) => {
            const password = generatePassword(16)
            btn.dataset.pwd = password
            btn.innerText = 'Encrypting...'
            btn.disabled = true
            console.time('🔐 Encrypting')

            const html = await encryptHTML(inputHTML, password)

            const link = `/${filename}#${password}`
            sessionStorage[storageKey] = link
            btn.nextElementSibling.href = link
            btn.previousElementSibling.href = link

            download(filename, html)
            console.timeEnd('🔐 Encrypting')
            btn.disabled = false
            btn.innerText = 'Copy Password'

            const copyBtn = btn.cloneNode(true)
            copyBtn.addEventListener('click', copyPassword)
            btn.parentNode.replaceChild(copyBtn, btn)
        })
    }

    const link = document.createElement('a')
    link.innerText = filename
    link.target = '_blank'
    if (sessionStorage[storageKey]) {
        link.href = sessionStorage[storageKey].split('#')[0]
    }

    const magicLink = document.createElement('a')
    magicLink.innerText = '#'
    magicLink.target = '_blank'
    if (sessionStorage[storageKey]) {
        magicLink.href = sessionStorage[storageKey]
    }

    const div = document.createElement('div')
    div.id = filename
    div.appendChild(link)
    div.appendChild(btn)
    div.appendChild(magicLink)
    document.querySelector('.results').appendChild(div)
}

async function loadInputHTML(url) {
    return fetch(url)
        .then((res) => res.text())
        .then((html) =>
            html.replace(
                `<script type="module" src="/@vite/client"></script>`,
                '',
            ),
        )
}

async function main() {
    const [normalHTML, bigHTML] = await Promise.all([
        loadInputHTML('/test.html'),
        loadInputHTML('/test-big.html'),
    ])

    const BROWSER_TESTS = [
        {
            inputHTML: normalHTML,
            storageKey: 'link',
            filename: 'out-browser-gen.html',
        },
        {
            inputHTML: bigHTML,
            storageKey: 'link-big',
            filename: 'out-browser-gen-big.html',
        },
    ]

    for (const { inputHTML, storageKey, filename } of BROWSER_TESTS) {
        addBrowserEncrypted(inputHTML, storageKey, filename)
    }

    document.querySelector('#reset').addEventListener('click', () => {
        for (const { storageKey } of BROWSER_TESTS) {
            delete sessionStorage[storageKey]
        }

        window.location.reload()
    })
}

await main()
