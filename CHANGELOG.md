# Changelog for `pagecrypt`

## 6.1.1 - 2023-07-17

### Fixes

-   Maintenance: Update dev dependencies to latest versions.

## 6.1.0 - 2023-03-24

### Features

Two improvements inspired by [Harry Rabin](https://github.com/harryrabin) - thank you!

-   Better operational security by removing logging of predefined passwords when encrypting via the pagecrypt CLI.
-   Better operational security by removing the GitHub link in the web template, to make it harder for attackers to analyse the project.

### Fixes

-   Improved documentation for generating a password with a custom character set `generatePassword(length: number, characters: string)`.
-   Upgrade dependencies to latest versions.
-   Export TypeScript type definitions in npm package - Thanks to [Bjorn Lu](https://github.com/bluwy) and <https://github.com/bluwy/publint>

## 6.0.1 - 2022-12-31

### Fixes

-   Cleanup README. No code changes.

## 6.0.0 - 2022-12-27

This is a major upgrade, reducing the amount of CSS by 50%, removing about 40% of the required third-party npm modules, and adding support for a custom number of password `iterations` which allows for greatly improved security.

### Breaking changes

-   License changed to AGPL-3.0. If you prefer the MIT license, you can keep using pagecrypt 5.x.

### Features

-   Improved security: It's now possible to specify a custom number of password `iterations` for both `encryptHTML()` and `encrypt()`. See usage examples in [README](./README.md) to learn more.
-   Added support for specifying the new `iterations` option through the CLI. See usage examples in [README](./README.md) to learn more.

### Fixes

-   Prefer `globalThis` over `window` in Node 19 - thanks [@metonym](https://github.com/metonym)
-   Reduce CSS size with 50% by replacing Tailwind CSS with custom CSS. This also greatly simplifies the development and build setup for this project.
-   Update dependencies to latest versions.

## 5.4.0 - 2022-04-18

### Fixes

-   Update dependencies and verify that the project works with latest versions.
-   Clarified installation instructions.

---

## 5.3.0 - 2021-08-31

### Features

-   feature(ui): Add submit button to simplify mobile usage.
-   feature(ui): Build and use the latest decrypt template with new submit button

### Fixes

-   fix(deps): Update deps to latest minor and patch releases.
-   fix(build): Update build script with improved html template transformations
-   fix(build): Improve removal of the vite module inline script.
-   fix(build): Simplify build process to remove the steps no longer necessary.
-   fix(dev): Update dev template.

---

## 5.2.0 - 2021-08-15

Added dark mode as new default theme since it probably is what the primary audience prefers. Also added a bug fix for magic links to preserve the URL and allow hosting the output HTML files on other routes than `/`.

### Features

-   feature(ui): Add dark mode design by default.
-   feature(tests): Improve testing framework and simplify development
-   feature(tests): Update tests to use new dark template
-   feature(tests): Greatly improve testing DX by automating several manual steps and displaying everything neatly in the browser.
-   feature(build): Simplify package builds to greatly improve DX

### Fixes

-   fix(ui): Ensure full page URL except the hash is preserved when using magic links.
-   fix(tests): Improve testing html file
-   fix(package): Update dev command for consistency
-   fix(package): Automatically remove whitespace from new decrypt template builds
-   chore(deps): Update deps to latest minor and patch versions.

---

## 5.1.0 - 2021-07-30

Another major UX improvement incoming: Magic links to unlock encrypted pages with a single click!

Also slightly improved browser support for the `pagecrypt/core` module.

### Features

-   feature(ux): Implement + add docs for magic links that allow single-click unlocks
-   feature(core): Improve crypto loading to support older browsers for the core package.
-   feature(decrypt): Convert decryption script to TypeScript

### Fixes

-   docs(general): Highlight required Node.js version
-   fix(dev server): Remove `sirv-cli` dev dependency since we no longer need HTTPS for local dev.
-   docs(core): Clarify docstrings, improve terminology used and add link to related blog post.
-   docs(dev): Update testing and dev server instructions.
-   chore(test): Remove hardcoded test package version
-   chore(test): Improve browser encryption test

---

## 5.0.0 - 2021-07-15

### Features

-   BREAKING: feature(package): Convert modules to use ESM by default instead of CommonJS. Update your build tool to use `import` syntax instead of `require` - or keep using `pagecrypt@^4.0.1` which supports CommonJS `require`.

-   feature(package): Add a new `pagecrypt/core` module that can be imported to use the core library features in browsers, Deno and any other ESM compatible modern JS environment. For Node.js, the index import `pagecrypt` still works just like before.
-   feature(types): Add TypeScript definitions to improve DX and automation in TypeScript projects.
-   feature(crypto): Use isomorphic Web Crypto API to allow code reuse between Node.js, browsers and other ESM compatible environments.
-   feature(password generator): Use the isomorphic Web Crypto API to make project run in Node.js, browsers and other ESM compatible environments.
-   feature(build): Improve package build setup using esbuild and node-fs-extra

### Fixes

-   fix(package): Explicitly use CommonJS for config files.
-   chore(deps): Upgrade dependencies.

---

## 4.0.1 - 2021-05-04

### Fixes

-   fix(crypto): Ensure key derivation function is not extractable to fix bug in Chrome and Safari.

---

## 4.0.0 - 2021-04-29

Major UX and performance improvements!

This version uses `document.write()` to show the encrypted payload instead of using an `<iframe>` like `pagecrypt < v4` did. Since this means browsers won't have to create a separate DOM instance, this brings good performance improvements.

### Features

-   feature(UX): Major UX improvement - save CryptoKey to `sessionStorage` to gain massive UX + performance improvement on repeat visits.
-   feature(UX): Show results faster by removing the `<iframe>` and show content directly in the top-level document instead.
-   feature(DX): By removing the `<iframe>`, we also now allow embedded apps and webpages to use the full top-level document. Unlocks many new possible features that wouldn't work in `pagecrypt < v4`.
-   feature(UX): Show a loading state when loading large encrypted payloads.
-   feature(UX): Show loading spinner when decrypting for better UX.
-   feature(UX): Improve perceived loading performance by not blocking the main thread on page load.
    -   This was achieved in part by the loading state, but also by moving the encrypted payload from a render-blocking inline `<script>` into a `<pre>` that only contains the raw data.
    -   This way, the browser can do more work in parallel, which speeds up the initial page load.
-   feature(UX): Remove the success message and 1s timeout after successful decryption to improved perceived loading performance.
-   feature(build): Improve code transformations applied at build time to optimize `decrypt-template.html`
-   feature(UX): Add autofocus to password input when pageload has completed.

### Fixes

-   fix(build): Remove old iframe solution that's no longer relevant
-   fix(docs): Fix invalid docstring for `encryptHTML()`

---

## 3.3.0 - 2021-04-25

### Features

-   Set `<iframe>` and document `title` to improve accessibility for the page.

### Fixes

-   Clarify test instructions
-   Fix missing import in code sample

---

## 3.2.0 - 2021-04-24

### Features

-   Add password generator, built with the Node.js `crypto` module and without any external dependencies. Convenient, performant and secure.
-   CLI: Add `--generate-password` (alias `-g`) option to encrypt using a generated password of given length. See `README.md` for more info.
-   The password generator works well together with the JS API too.

### Fixes

-   Update tests and docs to describe new password generator feature.

---

## 3.1.0 - 2021-04-24

### Features

-   Replace `yargs` with `sade` and simplify CLI + dependencies. No breaking changes.
    -   This greatly improves both installation + runtime performance.
    -   It also simplifies the CLI implementation.
    -   The CLI API is preserved exactly like in 3.0.0

---

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
