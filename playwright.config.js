import { defineConfig } from '@playwright/test'

export default defineConfig({
    testDir: './workbench/tests',
    timeout: 30_000,
    fullyParallel: true,
    workers: 2,
    use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 900 },
        trace: 'retain-on-failure',
    },
})
