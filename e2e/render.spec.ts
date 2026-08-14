import { expect, test } from '@playwright/test'
import type { RenderDiagnostics } from '../src/diagnostics'

declare global {
  interface Window {
    __kinetic?: RenderDiagnostics
  }
}

const TEXT = 'shipping beats polishing every single time'

test('turns pasted text into a downloadable video file', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('textbox').fill(TEXT)

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: /render/i }).click()
  const download = await downloadPromise

  const path = await download.path()
  expect(path).toBeTruthy()

  const diagnostics = await page.evaluate(() => window.__kinetic)
  expect(diagnostics).toBeDefined()
  expect(diagnostics!.byteLength).toBeGreaterThan(0)
})

test('records at 1080x1920', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('textbox').fill(TEXT)
  await page.getByRole('button', { name: /render/i }).click()
  await expect
    .poll(() => page.evaluate(() => window.__kinetic?.byteLength ?? 0), {
      timeout: 60_000,
    })
    .toBeGreaterThan(0)

  // Dimensions come from a real decode of the recorded blob, not from what the
  // app believes it recorded.
  const dimensions = await page.evaluate(async () => {
    const blob = window.__kinetic!.blob
    const video = document.createElement('video')
    video.src = URL.createObjectURL(blob)
    video.muted = true
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve()
      video.onerror = () => reject(new Error('could not decode recording'))
    })
    return { width: video.videoWidth, height: video.videoHeight }
  })

  expect(dimensions).toEqual({ width: 1080, height: 1920 })
})

test('records for as long as the timeline says it should', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('textbox').fill(TEXT)
  await page.getByRole('button', { name: /render/i }).click()
  await expect
    .poll(() => page.evaluate(() => window.__kinetic?.byteLength ?? 0), {
      timeout: 60_000,
    })
    .toBeGreaterThan(0)

  const { elapsedMs, timelineDurationMs } = (await page.evaluate(
    () => window.__kinetic,
  ))!

  expect(Math.abs(elapsedMs - timelineDurationMs)).toBeLessThan(200)
})

test('draws every pasted word at some point during the render', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('textbox').fill(TEXT)
  await page.getByRole('button', { name: /render/i }).click()
  await expect
    .poll(() => page.evaluate(() => window.__kinetic?.byteLength ?? 0), {
      timeout: 60_000,
    })
    .toBeGreaterThan(0)

  const drawn = (await page.evaluate(() => window.__kinetic!.wordsDrawn))!

  for (const word of TEXT.split(' ')) {
    expect(drawn).toContain(word)
  }
})
