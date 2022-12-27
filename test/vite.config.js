import { defineConfig } from 'vite'

export default defineConfig({
    build: {
        target: 'esnext',
    },
    optimizeDeps: {
        esbuildOptions: { target: 'esnext' },
    },
})
