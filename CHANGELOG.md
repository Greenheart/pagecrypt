# Changelog for `pagecrypt`

## 2.0.0 - 2021-04-23

### Features

-   Use `node-forge` instead of `cryptojs` for encryption + decryption.
-   Use `vite` instead of `snowpack` for simplified and more performant web build process.
-   Small design + UX improvements for the decryption template.

## 1.2.0 - 2021-03-15

### Features

-   Expose new `encryptHTML()` function to easily get the encrypted HTML file contents when using the JS API.
-   Improved documentation

### Fixes

-   Cleanup code and move into separate smaller functions
-   dev: Improve test command to always install latest package build

---

## 1.1.0 - 2021-03-14

### Features

-   Added JS API

Usage:

```js
import { encrypt } from 'pagecrypt'

await encrypt('input.html', 'output.html', 'strong password')
```

-   Improved documentation
-   Added basic testing setup to easily verify `pagecrypt` builds

### Fixes

-   Updated how `decrypt-template.html` is loaded to allow JS API to work from any directory, and not just project root.

---

## 1.0.1 - 2021-03-11

-   Improved `test.html` sample page.

---

## 1.0.0 - 2021-03-10

-   Initial release
