import CryptoWorker from './worker?worker&inline'
import { version } from '../package.json'
import { t, localize, renderLanguage, setLanguage } from './i18n'

const $ = (id) => document.getElementById(id)
const DEFAULT_ITERATIONS = 2_000_000
const jobs = new Set()
const urls = new Set()
const state = {
    mode: 'file',
    inputHTML: '',
    encryptedInput: '',
    inputSequence: 0,
    decryptSequence: 0,
    inputLoading: false,
    decryptLoading: false,
    encryptJob: null,
    decryptJob: null,
    generatorJob: null,
    encrypted: null,
    decrypted: null,
}
const environmentReady = Boolean(globalThis.crypto?.subtle && globalThis.Worker)
let toastTimer

function label(id, key, values) {
    localize($(id), key, values)
}
function plain(id, text) {
    delete $(id).dataset.i18n
    delete $(id).dataset.i18nValues
    $(id).textContent = text
}
function notice(id, key = '', type = '', values) {
    if (key) label(id, key, values)
    else plain(id, '')
    $(id).className = 'notice' + (type ? ` ${type}` : '')
    $(id).hidden = !key
}
function toast(key) {
    label('toast', key)
    $('toast').hidden = false
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
        $('toast').hidden = true
    }, 3200)
}
function size(bytes) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(2)} MB`
}
function byteLength(text) {
    return new TextEncoder().encode(text).length
}
function currentInput() {
    return state.mode === 'file' ? state.inputHTML : $('inputHTML').value.replace(/^\uFEFF/, '')
}

function startJob(type, data, progress = () => {}) {
    let worker,
        settled = false,
        rejectTask
    const finish = () => {
        worker?.terminate()
        jobs.delete(job)
    }
    const job = {
        promise: null,
        cancel() {
            if (settled) return
            settled = true
            finish()
            rejectTask(new Error('cancelled'))
        },
    }
    job.promise = new Promise((resolve, reject) => {
        rejectTask = reject
        try {
            worker = new CryptoWorker()
            worker.onmessage = ({ data: message }) => {
                if (settled) return
                if (message.stage) {
                    progress(message.stage)
                    return
                }
                settled = true
                finish()
                if (message.error) reject(new Error(message.error))
                else resolve(message.result)
            }
            worker.onerror = (event) => {
                event.preventDefault()
                if (settled) return
                settled = true
                finish()
                reject(new Error('unsupportedBrowser'))
            }
            worker.postMessage({ type, data })
        } catch {
            settled = true
            finish()
            reject(new Error('unsupportedBrowser'))
        }
    })
    if (!settled) jobs.add(job)
    return job
}

function refreshBusy() {
    const encryptBusy = Boolean(state.encryptJob),
        decryptBusy = Boolean(state.decryptJob)
    $('encryptFields').disabled = encryptBusy || !environmentReady
    $('decryptFields').disabled = decryptBusy || !environmentReady
    $('encryptButton').disabled =
        encryptBusy || Boolean(state.generatorJob) || state.inputLoading || !environmentReady
    $('decryptButton').disabled = decryptBusy || state.decryptLoading || !environmentReady
    $('encryptButton').classList.toggle('busy', encryptBusy)
    $('decryptButton').classList.toggle('busy', decryptBusy)
    $('cancelEncrypt').hidden = !encryptBusy
    $('cancelDecrypt').hidden = !decryptBusy
    $('clearEncrypt').disabled = encryptBusy
    $('clearDecrypt').disabled = decryptBusy
    $('generateNow').disabled = Boolean(state.generatorJob)
}
function resetVisibility(id) {
    $(id).type = 'password'
    const button = document.querySelector(`[data-toggle="${id}"]`)
    button.setAttribute('aria-pressed', 'false')
    localize(button, 'show')
}
function invalidateEncrypted() {
    state.encrypted = null
    $('encryptResult').hidden = true
    for (const id of ['resultPassword', 'magicResult', 'outputHash']) $(id).value = ''
    resetVisibility('resultPassword')
}
function invalidateDecrypted() {
    state.decrypted = null
    $('decryptResult').hidden = true
    $('decryptedSource').value = ''
}
function safeName(value) {
    const name = value.trim()
    if (
        !name ||
        name.length > 180 ||
        /[\\/:*?"<>|\x00-\x1F]/.test(name) ||
        !/\.html?$/i.test(name)
    ) {
        throw new Error('invalidName')
    }
    return name
}
function iterations() {
    const value = $('iterationsEnabled').checked
        ? Number($('iterations').value)
        : DEFAULT_ITERATIONS
    if (!Number.isInteger(value) || value < 1 || value > 2_147_483_647)
        throw new Error('invalidIterations')
    return value
}
function updateSummary() {
    try {
        const count = iterations()
        plain('summaryIterations', count.toLocaleString('en-US'))
        notice(
            'iterationWarning',
            count < DEFAULT_ITERATIONS
                ? 'lowIterations'
                : count > 10_000_000
                  ? 'highIterations'
                  : '',
            'warning',
        )
    } catch {
        label('summaryIterations', 'invalidSetting')
        notice('iterationWarning', 'invalidIterations', 'warning')
    }
    label('summaryPassword', $('generateEnabled').checked ? 'generated' : 'manual')
}
function dependencyWarning(html) {
    const warning = $('inputWarnings')
    warning.replaceChildren()
    const keys = []
    if (/<pre\b[^>]*\bdata-i\s*=/i.test(html)) keys.push('alreadyEncrypted')
    if (
        /<(?:script|img|link|iframe|video|audio|source|embed|object)\b[^>]*\b(?:src|href|poster|data)\s*=\s*["'](?!data:|#|about:)[^"']+/i.test(
            html,
        ) ||
        /url\(\s*["']?(?!data:|#)[^\s)"']+/i.test(html)
    )
        keys.push('linkedResources')
    for (const key of keys) {
        const paragraph = document.createElement('p')
        localize(paragraph, key)
        warning.appendChild(paragraph)
    }
    warning.hidden = !keys.length
}
function setInputMode(mode) {
    state.mode = mode
    $('fileInputArea').hidden = mode !== 'file'
    $('textInputArea').hidden = mode !== 'text'
    for (const [id, value] of [
        ['modeFile', 'file'],
        ['modeText', 'text'],
    ]) {
        $(id).classList.toggle('selected', value === mode)
        $(id).setAttribute('aria-pressed', String(value === mode))
    }
    invalidateEncrypted()
    dependencyWarning(currentInput())
}
async function loadFile(file, encrypted = false) {
    if (!file || (encrypted ? state.decryptJob : state.encryptJob) || !environmentReady) return
    const sequenceKey = encrypted ? 'decryptSequence' : 'inputSequence'
    const loadingKey = encrypted ? 'decryptLoading' : 'inputLoading'
    const contentKey = encrypted ? 'encryptedInput' : 'inputHTML'
    const labelID = encrypted ? 'decryptFileLabel' : 'fileLabel'
    const detailID = encrypted ? 'decryptFileDetail' : 'fileDetail'
    const messageID = encrypted ? 'decryptMessage' : 'encryptMessage'
    const sequence = ++state[sequenceKey]
    state[loadingKey] = true
    state[contentKey] = ''
    if (encrypted) {
        invalidateDecrypted()
        notice('payloadInfo')
    } else {
        invalidateEncrypted()
        dependencyWarning('')
    }
    label(labelID, 'reading')
    label(detailID, encrypted ? 'encryptedFormat' : 'utf8')
    notice(messageID)
    refreshBusy()
    try {
        const html = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer())
        if (sequence !== state[sequenceKey]) return
        if (!html.length) throw new Error('emptyFile')
        if (encrypted) {
            const payload = await startJob('inspect', { html }).promise
            if (sequence !== state[sequenceKey]) return
            notice('payloadInfo', 'payloadInfo', 'info', {
                iterations: payload.iterations.toLocaleString('en-US'),
            })
        }
        state[contentKey] = html
        plain(labelID, file.name)
        label(detailID, 'fileLoaded', { size: size(file.size) })
        const stem = file.name.replace(/\.html?$/i, '').replace(/\.encrypted$/i, '')
        $(encrypted ? 'decryptedName' : 'outputName').value =
            stem + (encrypted ? '.decrypted.html' : '.encrypted.html')
        if (!encrypted) dependencyWarning(currentInput())
    } catch (error) {
        if (sequence !== state[sequenceKey]) return
        label(labelID, 'readFailed')
        notice(messageID, error.name === 'TypeError' ? 'invalidUTF8' : error.message, 'error')
    } finally {
        if (sequence === state[sequenceKey]) {
            state[loadingKey] = false
            refreshBusy()
        }
    }
}

async function generate() {
    state.generatorJob?.cancel()
    state.generatorJob = null
    invalidateEncrypted()
    $('password').value = ''
    $('confirmPassword').value = ''
    if (!$('generateEnabled').checked || !environmentReady) {
        refreshBusy()
        return
    }
    const job = startJob('generate', {
        length: Number($('passwordLength').value),
        characters: $('charsetEnabled').checked ? $('charset').value : undefined,
    })
    state.generatorJob = job
    refreshBusy()
    try {
        const result = await job.promise
        if (state.generatorJob !== job) return
        $('password').value = result.password
        notice('encryptMessage')
    } catch (error) {
        if (state.generatorJob === job) notice('encryptMessage', error.message, 'error')
    } finally {
        if (state.generatorJob === job) {
            state.generatorJob = null
            refreshBusy()
        }
    }
}
function generatorSettingsChanged() {
    $('generatorOptions').hidden = !$('generateEnabled').checked
    $('charsetArea').hidden = !$('charsetEnabled').checked
    $('confirmArea').hidden = $('generateEnabled').checked
    $('password').readOnly = $('generateEnabled').checked
    updateSummary()
    generate()
}
function makeMagicLink(password) {
    if (!$('magicEnabled').checked) return ''
    let url
    try {
        url = new URL($('deploymentURL').value.trim())
    } catch {
        throw new Error('invalidURL')
    }
    const localHTTP =
        url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    if ((!['https:', 'file:'].includes(url.protocol) && !localHTTP) || url.username || url.password)
        throw new Error('invalidURL')
    if (!/^[A-Za-z0-9._~-]+$/.test(password)) throw new Error('invalidLinkPassword')
    url.hash = ''
    return url.href + '#' + password
}
function saveText(text, name) {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/html;charset=utf-8' }))
    urls.add(url)
    const link = document.createElement('a')
    link.href = url
    link.download = name
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => {
        URL.revokeObjectURL(url)
        urls.delete(url)
    }, 60_000)
    toast('downloadStarted')
}
async function copyText(text) {
    if (!text) {
        toast('nothingToCopy')
        return
    }
    try {
        await navigator.clipboard.writeText(text)
    } catch {
        const previous = document.activeElement
        const area = document.createElement('textarea')
        area.value = text
        area.style.cssText = 'position:fixed;left:-9999px;top:0'
        document.body.appendChild(area)
        let copied = false
        try {
            area.select()
            copied = document.execCommand('copy')
        } catch {
            /* Use manual copying. */
        } finally {
            area.remove()
            previous?.focus()
        }
        if (!copied) {
            toast('copyFailed')
            return
        }
    }
    toast('copied')
}

$('encryptForm').addEventListener('submit', async (event) => {
    event.preventDefault()
    if (state.encryptJob || state.generatorJob || state.inputLoading || !environmentReady) return
    try {
        const html = currentInput(),
            password = $('password').value
        if (!html) throw new Error('missingHTML')
        if (!password) throw new Error('missingPassword')
        if (!$('generateEnabled').checked && password !== $('confirmPassword').value)
            throw new Error('passwordMismatch')
        const name = safeName($('outputName').value),
            count = iterations(),
            magic = makeMagicLink(password)
        invalidateEncrypted()
        const started = performance.now()
        const job = startJob(
            'encrypt',
            { html, password, iterations: count, verify: $('verifyEnabled').checked },
            (key) => notice('encryptMessage', key, 'info'),
        )
        state.encryptJob = job
        refreshBusy()
        const result = await job.promise
        state.encrypted = { ...result, name, password, magic }
        plain('resultName', name)
        label('resultMeta', 'resultMeta', {
            size: size(byteLength(result.html)),
            seconds: ((performance.now() - started) / 1000).toFixed(1),
        })
        label('verificationStatus', result.verified ? 'verified' : 'notVerified')
        $('resultPassword').value = password
        $('outputHash').value = result.sha256
        $('magicResult').value = magic
        $('magicResultArea').hidden = !magic
        $('encryptResult').hidden = false
        notice('encryptMessage', 'encryptDone')
        $('saveEncrypted').focus()
    } catch (error) {
        notice('encryptMessage', error.message, error.message === 'cancelled' ? 'info' : 'error')
    } finally {
        state.encryptJob = null
        refreshBusy()
    }
})
$('decryptForm').addEventListener('submit', async (event) => {
    event.preventDefault()
    if (state.decryptJob || state.decryptLoading || !environmentReady) return
    try {
        if (!state.encryptedInput) throw new Error('missingEncrypted')
        if (!$('decryptPassword').value) throw new Error('missingPassword')
        const name = safeName($('decryptedName').value)
        invalidateDecrypted()
        const job = startJob(
            'decrypt',
            { html: state.encryptedInput, password: $('decryptPassword').value },
            (key) => notice('decryptMessage', key, 'info'),
        )
        state.decryptJob = job
        refreshBusy()
        const result = await job.promise
        state.decrypted = { html: result.html, name }
        $('decryptedSource').value = result.html
        label('decryptedMeta', 'decryptedMeta', { size: size(byteLength(result.html)) })
        $('decryptResult').hidden = false
        notice('decryptMessage', 'decryptDone')
        $('saveDecrypted').focus()
    } catch (error) {
        notice('decryptMessage', error.message, error.message === 'cancelled' ? 'info' : 'error')
    } finally {
        state.decryptJob = null
        refreshBusy()
    }
})

$('language').addEventListener('change', (event) => setLanguage(event.target.value))
$('modeFile').addEventListener('click', () => setInputMode('file'))
$('modeText').addEventListener('click', () => setInputMode('text'))
$('inputFile').addEventListener('change', (event) => loadFile(event.target.files[0]))
$('decryptFile').addEventListener('change', (event) => loadFile(event.target.files[0], true))
for (const [id, encrypted] of [
    ['dropZone', false],
    ['decryptDropZone', true],
]) {
    const zone = $(id)
    zone.addEventListener('dragover', (event) => {
        event.preventDefault()
        zone.classList.add('dragging')
    })
    zone.addEventListener('dragleave', () => zone.classList.remove('dragging'))
    zone.addEventListener('drop', (event) => {
        event.preventDefault()
        zone.classList.remove('dragging')
        if (event.dataTransfer.files.length !== 1) {
            toast('oneFile')
            return
        }
        loadFile(event.dataTransfer.files[0], encrypted)
    })
}
$('encryptForm').addEventListener('input', invalidateEncrypted)
$('decryptForm').addEventListener('input', invalidateDecrypted)
$('inputHTML').addEventListener('input', () => {
    $('textSize').textContent = size(byteLength(currentInput()))
    dependencyWarning(currentInput())
})
$('loadExample').addEventListener('click', () => {
    $('inputHTML').value =
        `<!DOCTYPE html>\n<html lang="${document.documentElement.lang}">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>${t('exampleTitle')}</title>\n  <style>body{font-family:system-ui;max-width:700px;margin:80px auto;padding:24px;line-height:1.8}h1{color:#166d57}</style>\n</head>\n<body>\n  <h1>${t('exampleHeading')}</h1>\n  <p>${t('exampleBody')}</p>\n</body>\n</html>`
    $('inputHTML').dispatchEvent(new Event('input', { bubbles: true }))
})
for (const id of ['generateEnabled', 'charsetEnabled'])
    $(id).addEventListener('change', generatorSettingsChanged)
for (const id of ['passwordLength', 'charset']) {
    $(id).addEventListener('input', () => {
        $('password').value = ''
        state.generatorJob?.cancel()
        state.generatorJob = null
        refreshBusy()
    })
    $(id).addEventListener('change', generate)
}
$('generateNow').addEventListener('click', generate)
$('iterationsEnabled').addEventListener('change', () => {
    $('iterationsArea').hidden = !$('iterationsEnabled').checked
    updateSummary()
})
$('iterations').addEventListener('input', updateSummary)
$('magicEnabled').addEventListener('change', () => {
    $('magicArea').hidden = !$('magicEnabled').checked
})
for (const button of document.querySelectorAll('[data-toggle]')) {
    button.addEventListener('click', () => {
        const input = $(button.dataset.toggle),
            show = input.type === 'password'
        input.type = show ? 'text' : 'password'
        localize(button, show ? 'hide' : 'show')
        button.setAttribute('aria-pressed', String(show))
    })
}
for (const [button, input] of [
    ['copyPassword', 'password'],
    ['copyResultPassword', 'resultPassword'],
    ['copyMagic', 'magicResult'],
    ['copyDecrypted', 'decryptedSource'],
]) {
    $(button).addEventListener('click', () => copyText($(input).value))
}
$('cancelEncrypt').addEventListener('click', () => state.encryptJob?.cancel())
$('cancelDecrypt').addEventListener('click', () => state.decryptJob?.cancel())
$('saveEncrypted').addEventListener('click', () => {
    if (state.encrypted) saveText(state.encrypted.html, state.encrypted.name)
})
$('saveDecrypted').addEventListener('click', () => {
    if (state.decrypted) saveText(state.decrypted.html, state.decrypted.name)
})
$('clearEncrypt').addEventListener('click', () => {
    state.inputSequence++
    state.inputLoading = false
    state.generatorJob?.cancel()
    state.generatorJob = null
    state.inputHTML = ''
    $('encryptForm').reset()
    $('password').readOnly = false
    resetVisibility('password')
    for (const id of ['generatorOptions', 'charsetArea', 'iterationsArea', 'magicArea'])
        $(id).hidden = true
    $('confirmArea').hidden = false
    label('fileLabel', 'chooseHTML')
    label('fileDetail', 'utf8')
    $('textSize').textContent = '0 B'
    notice('encryptMessage')
    setInputMode('file')
    updateSummary()
    refreshBusy()
})
$('clearDecrypt').addEventListener('click', () => {
    state.decryptSequence++
    state.decryptLoading = false
    state.encryptedInput = ''
    $('decryptForm').reset()
    resetVisibility('decryptPassword')
    label('decryptFileLabel', 'chooseEncrypted')
    label('decryptFileDetail', 'encryptedFormat')
    invalidateDecrypted()
    notice('decryptMessage')
    notice('payloadInfo')
    refreshBusy()
})
const tabs = [...document.querySelectorAll('.tab')]
function switchTab(button) {
    for (const tab of tabs) {
        const active = tab === button
        tab.classList.toggle('active', active)
        tab.setAttribute('aria-selected', String(active))
        tab.tabIndex = active ? 0 : -1
        $(tab.getAttribute('aria-controls')).hidden = !active
    }
}
for (const [index, tab] of tabs.entries()) {
    tab.addEventListener('click', () => switchTab(tab))
    tab.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
        event.preventDefault()
        const next =
            event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? tabs.length - 1
                  : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
        switchTab(tabs[next])
        tabs[next].focus()
    })
}
window.addEventListener('pagehide', () => {
    for (const job of [...jobs]) job.cancel()
    for (const url of urls) URL.revokeObjectURL(url)
    urls.clear()
})
document.addEventListener('dragover', (event) => event.preventDefault())
document.addEventListener('drop', (event) => event.preventDefault())
label('version', 'version', { version })
if (!environmentReady) {
    notice('environmentError', 'unsupportedBrowser', 'error')
    label('runtimeStatus', 'unsupportedBrowser')
}
renderLanguage()
updateSummary()
refreshBusy()
