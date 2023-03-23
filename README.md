# 🔐 PageCrypt - Password Protected Single Page Applications and HTML files

> Easily add client-side password-protection to your Single Page Applications and HTML files.

Inspired by [MaxLaumeister/PageCrypt](https://github.com/MaxLaumeister/PageCrypt), but rewritten to use native `Web Crypto API` and greatly improve UX + security. Thanks for sharing an excellent starting point to create this tool!

## Get started

**NOTE: Make sure you are using Node.js v16 or newer.**

```sh
npm i -D pagecrypt
```

There are 4 different ways to use `pagecrypt`:

### 1. Encrypt HTML in modern browsers, Deno or Node.js using `pagecrypt/core`

The `encryptHTML()` and `generatePassword()` functions are using Web Crypto API and will thus be able to run in any ESM compatible environment that supports Web Crypto API.

This allows you to use the same pagecrypt API in any environment where you can run modern JavaScript.

#### `encryptHTML(inputHTML: string, password: string, iterations?: number): Promise<string>`

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

// Optional: You can customize the number of password iterations if you want increased security.
const iterations = 3e6 // Same as 3_000_000
const customIterations = await encryptHTML(inputHTML, 'password', iterations)
```

#### `generatePassword(length: number, characters: string): string`

```js
import { generatePassword, encryptHTML } from 'pagecrypt/core'

// Generate a random password without any external dependencies
const password = generatePassword(64)
const encryptedHTML = await encryptHTML(inputHTML, password)
```

You can also provide a custom dictionary of characters to use in your password:

```ts
generatePassword(71, '!#$%&()*+,-./:;<=>?@[]^_{|}~0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz')
```

### 2. Node.js API

When working in a Node.js environment, you may prefer the `pagecrypt` Node.js build. This also includes the `encrypt()` function to read and write directly from and to the file system.

#### `encrypt(inputFile: string, outputFile: string, password: string, iterations: number): Promise<void>`

```js
import { encrypt } from 'pagecrypt'

// Encrypt a HTML file and write to the filesystem
await encrypt('index.html', 'encrypted.html', 'password')

// You can optionally customize the number of password iterations
const iterations = 3e6 // Same as 3_000_000
await encrypt('index.html', 'encrypted.html', 'password', iterations)
```

**NOTE:** Importing `pagecrypt` also gives you access to `generatePassword()` and `encryptHTML()` from `pagecrypt/core`.

```js
import { generatePassword, encryptHTML } from 'pagecrypt'

const password = generatePassword(48)
const iterations = 3e6 // Same as 3_000_000

const encrypted = await encryptHTML(inputHTML, password, iterations)
```

### 3. CLI

Encrypt a single HTML-file with one command:

```sh
npx pagecrypt <src> <dest> [password] [options]
```

Encrypt using a generated password with given length:

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
    -i, --iterations           The number of password iterations.
    -v, --version              Displays current version
    -h, --help                 Displays this message

  Examples
    $ pagecrypt index.html encrypted.html password
    $ pagecrypt index.html encrypted.html --generate-password 64
    $ pagecrypt index.html encrypted.html -g 64
    $ pagecrypt index.html encrypted.html password --iterations 3e6
    $ pagecrypt index.html encrypted.html -g 64 --i 3e6
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
        "pagecrypt": "^5.0.0"
    },
    "scripts": {
        "build": "...",
        "postbuild": "pagecrypt index.html encrypted.html password"
    }
}
```

## Deploying a SPA or Website Encrypted with `pagecrypt`

Since the output is a single HTML file, you can host it anywhere. This lets you bypass the need for server access to use HTTP basic authentication for password protection.

What this means in practice is that `pagecrypt` enables you to deploy private apps and websites to any static frontend hosting platform, often for free. Great for prototypes and client projects.

### Share a Magic Link to Let Users Open Protected Pages With a Single Click

To make it easier for your users to access protected pages, you can create a magic link by adding `#` followed by your password to your deployment URL:

`https://<link-to-your-page>#<password>`

Then users can simply click the link to load the protected SPA or website - a really smooth UX! Just make sure to keep the link safe by sharing it via E2E-encrypted chats and emails.

#### How to Create a Magic Link

1. Deploy your encrypted HTML file to any web server and copy the URL from your browser.
2. Create the link by starting with your URL, then writing an `#`, followed by your `password`. E.g. `https://example.com#password`
3. Make sure the link starts with the `https://` protocol to keep users safe.

Since this magic link feature is using the [URI Fragment](https://en.m.wikipedia.org/wiki/URI_fragment), it will not be sent across the internet once the user clicks the link. Only the first part before the `#` leaves the user's computer to fetch the HTML page, and the rest remains in the browser, used for local decryption. Additionally, the fragment is removed from the browser address field when the page loads. However, beware that the password remains as a history entry if you use magic links!

### Security Considerations

-   Most importantly, think twice about what kinds of sites and apps you publish to the open internet, even if they are encrypted.
-   If you use the magic link to login, beware that the password remains as a history entry! Feel free to submit a PR if you know a workaround for this!
-   Also keep in mind that the `sessionStorage` saves the encryption key (which is derived from the password) until the browser is restarted. This is what allows the rapid page reloads during the same session - at the cost of decreasing the security on your local device.
-   Only share magic links via secure channels, such as E2E-encrypted chats and emails.
-   `pagecrypt` only encrypts the contents of a single HTML file, so try to inline as much JS, CSS and other sensitive assets into this HTML file as possible. If you're unable to inline all sensitive assets, you can hide your other assets by placing them on another server, and then only reference the external resources within the `pagecrypt` protected HTML file instead. Of course, these could in turn be protected or hidden if you need to. If executed correctly, this allows you to completely hide what your webpage or app is about by only deploying a single HTML file to the public web. Neat!

---

## Development

Project structure:

-   `/web` - Web frontend for public webpage (`decrypt-template.html`).
-   `/src/core.ts` - pagecrypt core library.
-   `/src/index.ts` - pagecrypt Node.js library.
-   `/src/cli.ts` - pagecrypt CLI.
-   `/test` - simple testing setup.
-   `/scripts` - local scripts for development tasks.

## Setup a local development environment

1.  Install Node.js >= 16.0.0
2.  Run `npm install` in project root.

## Testing

First do one of the following:

-   `npm test` to run the tests.
-   `npm run test:build` to first build a new version of `pagecrypt` and then run the tests.

Then run `npm run verify` in another terminal and verify the test results at http://localhost:3000.

On the test results page you will find links to open output files in new tabs, buttons to copy passwords, and a special `#` link to verify that magic links decrypt the page immediately when the page loads.

To test `pagecrypt/core` and verify encryption in the browser, use the button at the bottom of the list. Download the file and then copy the password by clicking the button again to decrypt it. If you save the file to the same directory as the other generated files, you can use the links just like for other results. Use the reset button to encrypt another file.

---

**Welcome to submit issues and pull requests!**

## License

[AGPL-3.0](./LICENSE.md)

Copyright (c) 2015 Maximillian Laumeister
Copyright (c) 2021-2023 Samuel Plumppu

This is a complete rewrite of the MIT-licensed [PageCrypt](https://github.com/MaxLaumeister/PageCrypt) created by Maximillian Laumeister.
