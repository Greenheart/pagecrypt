# PageCrypt - Password Protected HTML Pages

> A CLI to add client-side password-protection for HTML files

Inspired by [MaxLaumeister/PageCrypt](https://github.com/MaxLaumeister/PageCrypt). Thanks for sharing an excellent starting point to create this CLI!

## Usage

### CLI

It's easy to start encrypting a single HTML-file:

```sh
npx pagecrypt [input.html] [output.html] [password]
```

### Automate `pagecrypt` in your build process

```sh
npm i -D pagecrypt
```

package.json:

```json
{
    "devDependencies": {
        "pagecrypt": "^0.1.0"
    },
    "scripts": {
        "build": "...",
        "postbuild": "pagecrypt index.html encrypted.html strong-password"
    }
}
```

### Node.js API

You can use `pagecrypt` in your Node.js scripts:

#### `encrypt(inputFile: string, outputFile: string, password: string): Promise<void>`

```js
import { encrypt } from 'pagecrypt'

// Encrypt a HTML file and write to the filesystem
await encrypt('input.html', 'output.html', 'strong password')
```

#### `encryptHTML(inputHTML: string, password: string): string`

```js
import { encryptHTML } from 'pagecrypt'

// Encrypt a HTML string and return an encrypted HTML string that can be written to a file or sent in a HTTPS response to a browser.
const encryptedHTML = await encryptHTML(
    `<!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8">
        </head>
        <body>
            Secret
        </body>
    </html>
`,
    'strong password',
)
```

---

## Development

The project consists of two parts:

-   `/web` - Web frontend for public webpage (`decrypt-template.html`). Built using Snowpack & TailwindCSS.
-   `/index.js` - pagecrypt CLI.

## Testing

`npm test` will run basic tests for JS API and CLI. Verify results by opening `test/out-js.html` and `test/out-cli.html` in your browser.

---

**Welcome to submit your pull requests!**
