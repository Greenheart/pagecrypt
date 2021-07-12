// TODO: This needs to use an locally imported version of the dist library to work properly.
import { generatePassword, encryptHTML } from '../lib/core.js'

function download(filename, text) {
    const element = document.createElement('a')
    element.setAttribute(
        'href',
        'data:text/plain;charset=utf-8,' + encodeURIComponent(text),
    )
    element.setAttribute('download', filename)

    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
}

document.querySelector('#download').addEventListener('click', async (e) => {
    const html = await encryptHTML(testHTML, generatePassword(16))
    download('browser-encrypted.html', html)
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

// TODO: Verify that it works to import the pagecrypt/core module
// TODO: Setup tests for repeated builds and tests
// TODO: Add way to verify the result in the browser. Maybe add link to copy and download the encrypted test page
