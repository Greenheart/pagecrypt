# 🔐 PageCrypt - Password Protected Single Page Applications and HTML files

> Easily add client-side password-protection to your Single Page Applications and HTML files.

Inspired by [MaxLaumeister/PageCrypt](https://github.com/MaxLaumeister/PageCrypt), but rewritten to use native `Web Crypto API` and greatly improve UX + security. Thanks for sharing an excellent starting point to create this tool!

## Get started

There are 4 different ways to use `pagecrypt`:

### 1. Encrypt HTML in modern browsers, Deno or Node.js using `pagecrypt/core`

The `encryptHTML()` and `generatePassword()` functions are using Web Crypto API and will thus be able to run in any ESM compatible environment that supports Web Crypto API.

This allows you to use the same pagecrypt API in any environment where you can run modern JavaScript.

#### `encryptHTML(inputHTML: string, password: string): Promise<string>`

```js
import { encryptHTML } from 'pagecrypt/core'

const inputHTML = `
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8">
        </head>
        <body>
            Secret
        </body>
    </html>
`

// Encrypt a HTML string and return an encrypted HTML string.
// Write it to a file or send as an HTTPS response.
const encryptedHTML = await encryptHTML(inputHTML, 'password')
```

#### `generatePassword(length: number): string`

```js
import { generatePassword, encryptHTML } from 'pagecrypt/core'

// Generate a random password without any external dependencies
const password = generatePassword(64)
const encryptedHTML = await encryptHTML('html string', password)
```

### 2. Node.js API

When working in a Node.js environment, you may prefer the `pagecrypt` Node.js build. This also includes the `encrypt()` function to read and write directly from and to the file system.

#### `encrypt(inputFile: string, outputFile: string, password: string): Promise<void>`

```js
import { encrypt } from 'pagecrypt'

// Encrypt a HTML file and write to the filesystem
await encrypt('index.html', 'encrypted.html', 'password')
```

**NOTE:** Importing `pagecrypt` also gives you access to `generatePassword()` and `encryptHTML()` from `pagecrypt/core`.

```js
import { generatePassword, encryptHTML } from 'pagecrypt'

const password = generatePassword(48)

const encrypted = await encryptHTML(inputHTML, password)
```

### 3. CLI

Encrypt a single HTML-file with one command:

```sh
npx pagecrypt <src> <dest> [password] [options]
```

Encrypt using a generate password with given length:

```sh
npx pagecrypt <src> <dest> -g <length>
```

#### 3.1. CLI Help

```
  Description
    Encrypt the <src> HTML file with [password] and save the result in the <dest> HTML file.

  Usage
    $ pagecrypt <src> <dest> [password] [options]

  Options
    -g, --generate-password    Generate a random password with given length. Must be a number if used.
    -v, --version              Displays current version
    -h, --help                 Displays this message

  Examples
    $ pagecrypt index.html encrypted.html password
    $ pagecrypt index.html encrypted.html --generate-password 64
    $ pagecrypt index.html encrypted.html -g 64
```

### 4. Automate `pagecrypt` in your build process

Use either the `pagecrypt` Node.js API or the CLI to automatically encrypt the builds for your single page applications.

```sh
npm i -D pagecrypt
```

package.json:

```json
{
    "devDependencies": {
        "pagecrypt": "^3.0.0"
    },
    "scripts": {
        "build": "...",
        "postbuild": "pagecrypt index.html encrypted.html password"
    }
}
```

---

## Development

Project structure:

-   `/web` - Web frontend for public webpage (`decrypt-template.html`). Built using Vite & Tailwind CSS.
-   `/src/core.ts` - pagecrypt core library.
-   `/src/index.ts` - pagecrypt Node.js library.
-   `/src/cli.ts` - pagecrypt CLI.
-   `/test` - simple testing setup.
-   `/scripts` - local scripts for development tasks.

## Setup a local development environment

1.  Install Node.js >= 15.0.0
2.  Run `npm install` in project root.
3.  Install and use [`mkcert`](https://github.com/FiloSottile/mkcert) to generate local certificates to enable HTTPS for the development server. For example `mkcert localhost 192.168.1.32` to generate a two files ending with `*.pem`.
4.  Update `vite.config.js` to load the generated `*.pem` files in the `https` section.
5.  To use `npm run serve`, also update to the correct `*.pem` filenames in the npm script.

## Testing

`npm test` will run basic tests for JS API and CLI. Verify test results by opening the `test/out-*.html` files in your browser.

---

**Welcome to submit your pull requests!**
