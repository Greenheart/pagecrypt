import { test, expect } from '@playwright/test'
import { readFile, readdir } from 'node:fs/promises'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { webcrypto } from 'node:crypto'

const workbenchURL = new URL('../build/index.html', import.meta.url).href
const sample =
    '<!doctype html><html lang="en"><meta charset="utf-8"><title>Round trip</title><body><h1>Private page 🔐 中文</h1><script>document.body.dataset.unlocked="yes"</script></body></html>'
const password = 'LongPassword-2026'

async function paste(page, html = sample, pass = password) {
    await page.locator('#modeText').click()
    await page.locator('#inputHTML').fill(html)
    await page.locator('#password').fill(pass)
    await page.locator('#confirmPassword').fill(pass)
}

// An independently encrypted payload exercises compatibility without using GUI encryption.
async function fixture(html = sample, pass = password, count = 2_000_000) {
    const salt = webcrypto.getRandomValues(new Uint8Array(32))
    const iv = webcrypto.getRandomValues(new Uint8Array(16))
    const base = await webcrypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(pass),
        'PBKDF2',
        false,
        ['deriveKey'],
    )
    const key = await webcrypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: count, hash: 'SHA-256' },
        base,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt'],
    )
    const ciphertext = await webcrypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        new TextEncoder().encode(html),
    )
    const encoded = Buffer.concat([salt, iv, new Uint8Array(ciphertext)]).toString('base64')
    return `<html><script>window.fixtureExecuted = true</script><pre class="hidden" data-i="${count.toExponential()}">${encoded}</pre></html>`
}

async function encryptedInput(page, html) {
    await page.locator('#tabDecrypt').click()
    await page
        .locator('#decryptFile')
        .setInputFiles({ name: 'private.html', mimeType: 'text/html', buffer: Buffer.from(html) })
    await expect(page.locator('#payloadInfo')).toBeVisible()
}

test.beforeEach(async ({ page }) => {
    await page.goto(workbenchURL)
    await expect(page.locator('#encryptButton')).toBeEnabled()
})

test('encrypts offline and unlocks through the bilingual password page', async ({
    page,
    context,
}, testInfo) => {
    await context.setOffline(true)
    const networkRequests = []
    page.on('request', (request) => {
        if (/^https?:/.test(request.url())) networkRequests.push(request.url())
    })
    await paste(page)
    await page.locator('#encryptButton').click()
    await expect(page.locator('#verificationStatus')).toHaveText(
        '✓ Decrypted and matched the original',
    )
    await expect(page.locator('#outputHash')).toHaveValue(/^[0-9a-f]{64}$/)
    const pendingDownload = page.waitForEvent('download')
    await page.locator('#saveEncrypted').click()
    const download = await pendingDownload
    expect(download.suggestedFilename()).toBe('encrypted.html')
    const path = testInfo.outputPath('encrypted.html')
    await download.saveAs(path)
    const html = await readFile(path, 'utf8')
    expect(html).not.toContain('Private page 🔐 中文')
    expect(html).not.toContain(password)
    expect(html).toContain('data-i="2e+6"')
    const digest = Buffer.from(
        await webcrypto.subtle.digest('SHA-256', Buffer.from(html)),
    ).toString('hex')
    await expect(page.locator('#outputHash')).toHaveValue(digest)
    const unlocked = await context.newPage()
    await unlocked.goto(pathToFileURL(path).href)
    await expect(unlocked.locator('#msg')).toHaveText('This page is password protected.')
    await unlocked.locator('#language').selectOption('zh-CN')
    await expect(unlocked.locator('#msg')).toHaveText('此页面受密码保护。')
    await expect(unlocked.locator('#pwd')).toHaveAttribute('placeholder', '输入密码')
    await expect(unlocked.locator('#unlock')).toHaveValue('解锁')
    await unlocked.locator('#pwd').fill('incorrect')
    await unlocked.locator('#unlock').click()
    await expect(unlocked.locator('#msg')).toHaveText('密码不正确，请重试。')
    await unlocked.locator('#language').selectOption('en')
    await expect(unlocked.locator('#msg')).toHaveText('Incorrect password. Try again.')
    await unlocked.locator('input[type="password"]').fill(password)
    await unlocked.locator('#language').selectOption('zh-CN')
    await expect(unlocked.locator('#pwd')).toHaveValue(password)
    await unlocked.locator('input[type="submit"]').click()
    await expect(unlocked.locator('h1')).toHaveText('Private page 🔐 中文')
    await expect(unlocked).toHaveTitle('Round trip')
    await expect(unlocked.locator('body')).toHaveAttribute('data-unlocked', 'yes')
    await unlocked.reload()
    await expect(unlocked.locator('h1')).toHaveText('Private page 🔐 中文')
    expect(networkRequests).toEqual([])
})

test('defaults to English and translates input, errors, results and controls without clearing data', async ({
    page,
}) => {
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.locator('h1')).toHaveText('Protect a page with a password.')
    await page.locator('#encryptButton').click()
    await page.locator('#language').selectOption('zh-CN')
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')
    await expect(page.locator('#encryptMessage')).toHaveText('请先选择文件或粘贴 HTML。')
    await expect(page.locator('#password')).toHaveAttribute(
        'placeholder',
        '输入一个较长且独立的密码',
    )
    await paste(page)
    await page.locator('#encryptButton').click()
    await expect(page.locator('#encryptResult')).toBeVisible()
    await page.locator('[data-toggle="resultPassword"]').click()
    await page.locator('#language').selectOption('en')
    await expect(page.locator('#inputHTML')).toHaveValue(sample)
    await expect(page.locator('#resultPassword')).toHaveValue(password)
    await expect(page.locator('[data-toggle="resultPassword"]')).toHaveText('Hide')
    await expect(page.locator('#encryptMessage')).toHaveText(
        'Your encrypted page is ready to download.',
    )
    await expect(page.locator('#verificationStatus')).toHaveText(
        '✓ Decrypted and matched the original',
    )
    await page.locator('#language').selectOption('zh-CN')
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')
    await expect(page.locator('#password')).toHaveValue('')
    await expect(page.locator('#inputHTML')).toHaveValue('')
})

test('restores Unicode source without executing it and rejects an incorrect password', async ({
    page,
}, testInfo) => {
    const unicodePassword = ' 空格、中文与 emoji 🔑 '
    await encryptedInput(page, await fixture(sample, unicodePassword))
    await expect(page.locator('#payloadInfo')).toContainText('2,000,000')
    await page.locator('#decryptPassword').fill('incorrect')
    await page.locator('#decryptButton').click()
    await expect(page.locator('#decryptMessage')).toHaveText(
        'The password is incorrect, or the encrypted file has changed.',
    )
    await expect(page.locator('#decryptResult')).toBeHidden()
    await page.locator('#decryptPassword').fill(unicodePassword)
    await page.locator('#decryptButton').click()
    await expect(page.locator('#decryptedSource')).toHaveValue(sample)
    expect(await page.evaluate(() => window.fixtureExecuted)).toBeUndefined()
    await expect(page.locator('body')).not.toHaveAttribute('data-unlocked', 'yes')
    const pending = page.waitForEvent('download')
    await page.locator('#saveDecrypted').click()
    const download = await pending
    const path = testInfo.outputPath('restored.html')
    await download.saveAs(path)
    expect(await readFile(path, 'utf8')).toBe(sample)
    await page.locator('#language').selectOption('zh-CN')
    await expect(page.locator('#decryptMessage')).toHaveText('原始 HTML 已准备好，可以下载。')
    await expect(page.locator('#payloadInfo')).toHaveText('PageCrypt 文件 · 2,000,000 次迭代')
    await page.locator('#decryptPassword').fill('changed')
    await expect(page.locator('#decryptResult')).toBeHidden()
    await expect(page.locator('#decryptedSource')).toHaveValue('')
})

test('supports uploaded HTML, custom iterations, random passwords, and password links', async ({
    page,
    context,
}, testInfo) => {
    await page
        .locator('#inputFile')
        .setInputFiles({ name: '测试.html', mimeType: 'text/html', buffer: Buffer.from(sample) })
    await expect(page.locator('#fileLabel')).toHaveText('测试.html')
    await expect(page.locator('#outputName')).toHaveValue('测试.encrypted.html')
    await page.locator('#generateEnabled').check()
    await expect(page.locator('#password')).toHaveValue(/^[A-Za-z0-9]{80}$/)
    await page.locator('#passwordLength').fill('32')
    await page.locator('#passwordLength').blur()
    await expect(page.locator('#password')).toHaveValue(/^[A-Za-z0-9]{32}$/)
    await page.locator('#charsetEnabled').check()
    await page.locator('#charset').fill('abc123')
    await page.locator('#charset').blur()
    await expect(page.locator('#password')).toHaveValue(/^[abc123]{32}$/)
    await page.locator('#iterationsEnabled').check()
    await page.locator('#iterations').fill('3e6')
    await page.locator('#magicEnabled').check()
    await page.locator('#deploymentURL').fill('https://example.com/private.html#old')
    await page.locator('#encryptButton').click()
    await expect(page.locator('#encryptResult')).toBeVisible()
    const generated = await page.locator('#resultPassword').inputValue()
    await expect(page.locator('#magicResult')).toHaveValue(
        `https://example.com/private.html#${generated}`,
    )
    const pending = page.waitForEvent('download')
    await page.locator('#saveEncrypted').click()
    const download = await pending
    const path = testInfo.outputPath('magic.html')
    await download.saveAs(path)
    expect(await readFile(path, 'utf8')).toContain('data-i="3e+6"')
    const unlocked = await context.newPage()
    await unlocked.goto(pathToFileURL(path).href + '#' + generated)
    await expect(unlocked.locator('h1')).toHaveText('Private page 🔐 中文')
    await page.locator('#iterations').fill('2000000')
    await expect(page.locator('#encryptResult')).toBeHidden()
    await expect(page.locator('#resultPassword')).toHaveValue('')
})

test('cancels a running worker and can encrypt again', async ({ page }) => {
    await paste(page)
    await page.locator('#iterationsEnabled').check()
    await page.locator('#iterations').fill('20000000')
    await page.locator('#encryptButton').click()
    await expect(page.locator('#encryptMessage')).toHaveText('Encrypting your page…')
    await page.locator('#language').selectOption('zh-CN')
    await expect(page.locator('#encryptMessage')).toHaveText('正在加密网页…')
    await page.locator('#cancelEncrypt').click()
    await expect(page.locator('#encryptMessage')).toHaveText('操作已取消。')
    await expect(page.locator('#encryptButton')).toBeEnabled()
    await expect(page.locator('#encryptResult')).toBeHidden()
    await page.locator('#iterationsEnabled').uncheck()
    await page.locator('#encryptButton').click()
    await expect(page.locator('#encryptResult')).toBeVisible({ timeout: 20_000 })
})

test('validates filenames, passwords, iteration counts, and character sets', async ({ page }) => {
    await paste(page)
    await page.locator('#confirmPassword').fill('different')
    await page.locator('#encryptButton').click()
    await expect(page.locator('#encryptMessage')).toHaveText('The passwords do not match.')
    await page.locator('#confirmPassword').fill(password)
    await page.locator('#outputName').fill('../unsafe.html')
    await page.locator('#encryptButton').click()
    await expect(page.locator('#encryptMessage')).toContainText('without a folder path')
    await page.locator('#outputName').fill('encrypted.html')
    await page.locator('#iterationsEnabled').check()
    for (const value of ['0', '-1', '1.5', '2147483648', 'Infinity', '']) {
        await page.locator('#iterations').fill(value)
        await page.locator('#encryptButton').click()
        await expect(page.locator('#encryptMessage')).toHaveText(
            'Enter a whole number from 1 to 2,147,483,647.',
        )
    }
    await page.locator('#iterationsEnabled').uncheck()
    await page.locator('#generateEnabled').check()
    await expect(page.locator('#password')).not.toHaveValue('')
    await page.locator('#charsetEnabled').check()
    for (const charset of ['', '🔐']) {
        await page.locator('#charset').fill(charset)
        await page.locator('#charset').blur()
        await expect(page.locator('#encryptMessage')).toHaveText(
            'Use 1–255 characters without emoji or control characters.',
        )
        await expect(page.locator('#password')).toHaveValue('')
    }
    await page.locator('#clearEncrypt').click()
    await expect(page.locator('#password')).toBeEditable()
    await expect(page.locator('#generatorOptions')).toBeHidden()
    await expect(page.locator('#summaryIterations')).toHaveText('2,000,000')
})

test('rejects malformed payloads and invalid UTF-8', async ({ page }) => {
    await page.locator('#inputFile').setInputFiles({
        name: 'invalid.html',
        mimeType: 'text/html',
        buffer: Buffer.from([0xc3, 0x28]),
    })
    await expect(page.locator('#encryptMessage')).toContainText('not valid UTF-8')
    await page.locator('#tabDecrypt').click()
    for (const html of [
        '<h1>Plain HTML</h1>',
        '<pre data-i="2e6">AAAA</pre>',
        '<pre data-i="2e6">A===</pre>',
    ]) {
        await page.locator('#decryptFile').setInputFiles({
            name: 'broken.html',
            mimeType: 'text/html',
            buffer: Buffer.from(html),
        })
        await expect(page.locator('#decryptMessage')).toHaveText(
            'No valid PageCrypt payload was found in this file.',
        )
    }
})

test('works without browser storage, supports keyboard tabs, and fits a mobile viewport', async ({
    page,
}, testInfo) => {
    await page.addInitScript(() => {
        Object.defineProperty(window, 'localStorage', {
            get() {
                throw new DOMException('Blocked', 'SecurityError')
            },
        })
    })
    await page.reload()
    await page.locator('#language').selectOption('zh-CN')
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')
    await page.locator('#tabEncrypt').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('#tabDecrypt')).toBeFocused()
    await expect(page.locator('#decryptPanel')).toBeVisible()
    await page.keyboard.press('End')
    await expect(page.locator('#helpPanel')).toBeVisible()
    await page.keyboard.press('Home')
    await expect(page.locator('#encryptPanel')).toBeVisible()
    await page.screenshot({ path: testInfo.outputPath('desktop-zh.png'), fullPage: true })
    await page.setViewportSize({ width: 390, height: 844 })
    for (const locale of ['en', 'zh-CN']) {
        await page.locator('#language').selectOption(locale)
        for (const tab of ['tabEncrypt', 'tabDecrypt', 'tabHelp']) {
            await page.locator(`#${tab}`).click()
            expect(
                await page.evaluate(
                    () => document.documentElement.scrollWidth <= window.innerWidth,
                ),
            ).toBe(true)
        }
    }
    await page.locator('#tabEncrypt').click()
    await page.locator('#language').selectOption('en')
    await page.screenshot({ path: testInfo.outputPath('mobile-en.png'), fullPage: true })
})

test('the build contains only one HTML file and no external runtime assets', async ({ page }) => {
    expect(await readdir(fileURLToPath(new URL('../build', import.meta.url)))).toEqual([
        'index.html',
    ])
    const html = await readFile(fileURLToPath(workbenchURL), 'utf8')
    expect(html).not.toMatch(/<script[^>]+src=/i)
    expect(html).not.toMatch(/<link[^>]+rel="stylesheet"/i)
    await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveAttribute(
        'content',
        /connect-src 'none'/,
    )
})
