# Changelog for `pagecrypt`

## 3.0.0 - 2021-04-24

### Features

-   Replace `node-forge` with the standard Web Crypto API - both in Node.js and in browsers.

    -   This greatly improves performance, bundle size and security compared to `v1.x` and `v2.x`.
    -   This allows using the same native code both for encryption in Node.js and decryption in the browser, simplifying the codebase.

-   `decrypt-template.html` file size reduced from `290 KB` to `10 KB` - (**96 % less boilerplate code**). This ensures the encrypted page will be the clear majority of the code shipped to the user.
-   PBKDF2 default iteration count increased from `1e5` to `2e6`, greatly improving security.

### Fixes

-   Fix [#6](https://github.com/Greenheart/pagecrypt/issues/6): Replace `vite preview` with `sirv-cli` to fix upstream issue
-   Upgrade to Tailwind CSS 2.1.2
-   Cleanup web/index.html to reduce unused characters
-   Update README with instructions for enabling `https` for localhost
-   Use stronger test password

---

## 2.0.0 - 2021-04-23

### Features

-   Use `node-forge` instead of `cryptojs` for encryption + decryption.
-   Use `vite` instead of `snowpack` for simplified and more performant web build process.
-   Small design + UX improvements for the decryption template.

---

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
