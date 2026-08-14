import { defineConfig } from 'vitest/config'

export default defineConfig({
  server: { port: 5173 },
  build: {
    // Paths are resolved from the Vite root, so no node:path import is needed.
    rollupOptions: {
      input: { main: 'index.html', review: 'review.html' },
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
