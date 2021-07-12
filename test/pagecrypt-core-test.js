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

document.querySelector('#download').addEventListener('click', async (e) => {
    const password = 'asd'
    console.log('random password: ', generatePassword(16))
    console.time('🔐 Encrypting')
    const html = await encryptHTML(testHTML, password)
    download('out-browser-encrypted.html', html)
    console.timeEnd('🔐 Encrypting')
})

const testHTML = `
    <!DOCTYPE html>
    <html lang="en">

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Secret!</title>
    </head>

    <style>
        body {
            display: flex;
            font-size: 2rem;
            text-align: center;
            font-weight: 100;
            margin-top: 20vh;
            justify-content: center;
            align-items: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
    </style>

    <body>
        This content is secret & encrypted.<br>
        It can only be unlocked with the password.
        <script>
            console.log('Scripts have localStorage access: ', localStorage.thisShouldNotThrowAnyExceptions)
            history.pushState({}, 'History API works', '#secret-route')
        </script>
    </body>

    </html>`
