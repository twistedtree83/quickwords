import { defineConfig } from 'vitest/config'

/** The repo name. GitHub Pages serves the site from https://<user>.github.io/<REPO>/. */
const REPO = 'quickwords'

export default defineConfig(({ command }) => ({
  // Built assets need the Pages path prefix or every request 404s. The dev
  // server and Playwright serve from the root, so they keep '/'.
  base: command === 'build' ? `/${REPO}/` : '/',
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
}))
