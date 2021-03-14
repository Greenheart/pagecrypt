# Changelog for `pagecrypt`

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

## 1.0.1 - 2021-03-11

-   Improved `test.html` sample page.

## 1.0.0 - 2021-03-10

-   Initial release
