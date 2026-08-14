import { expect, test } from '@playwright/test'
import type { RenderDiagnostics } from '../src/diagnostics'

declare global {
  interface Window {
    __kinetic?: RenderDiagnostics
  }
}

test('a first-time visitor can render without typing anything', async ({
  page,
}) => {
  await page.goto('/')

  const textarea = page.getByRole('textbox')
  await expect(textarea).not.toBeEmpty()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: /render/i }).click()
  const download = await downloadPromise

  expect(await download.path()).toBeTruthy()
})

test('shows a preview before any file is produced', async ({ page }) => {
  await page.goto('/')

  // Something is on the canvas at load, with no render having happened.
  const painted = await page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('#preview')!
    const ctx = canvas.getContext('2d')!
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
    return data.some((channel) => channel !== 0)
  })

  expect(painted).toBe(true)
  expect(await page.evaluate(() => window.__kinetic)).toBeUndefined()
})

test('keeps the last render available after the prompt is gone', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /render/i }).click()

  await expect
    .poll(() => page.evaluate(() => window.__kinetic?.byteLength ?? 0), {
      timeout: 60_000,
    })
    .toBeGreaterThan(0)

  const link = page.locator('#saved-link')
  await expect(link).toBeVisible()
  await expect(link).toHaveAttribute('href', /^blob:/)
})

test('remembers preset and tempo, and nothing else', async ({ page }) => {
  await page.goto('/')

  // Click the swatch, as a person would — the radio itself is visually hidden
  // behind its own preview canvas.
  await page.locator('.swatch:has(input[value="volt"])').click()
  await page.locator('#tempo').fill('160')
  await page.locator('#tempo').dispatchEvent('input')

  await page.reload()

  await expect(page.locator('.swatch input[value="volt"]')).toBeChecked()
  await expect(page.locator('#tempo')).toHaveValue('160')

  const stored = await page.evaluate(() => ({ ...localStorage }))
  expect(Object.keys(stored).sort()).toEqual(['kinetic.preset', 'kinetic.tempo'])
})

test('states plainly that text never leaves the browser', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.privacy')).toContainText(/never leaves/i)
})

test('produces a video with no audio track', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /render/i }).click()

  await expect
    .poll(() => page.evaluate(() => window.__kinetic?.byteLength ?? 0), {
      timeout: 60_000,
    })
    .toBeGreaterThan(0)

  // The feed autoplays muted, so a video depending on sound fails by default.
  const hasAudio = await page.evaluate(async () => {
    const video = document.createElement('video')
    video.src = URL.createObjectURL(window.__kinetic!.blob)
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve()
      video.onerror = () => reject(new Error('could not decode recording'))
    })
    const probed = video as HTMLVideoElement & {
      mozHasAudio?: boolean
      webkitAudioDecodedByteCount?: number
    }
    return Boolean(probed.mozHasAudio) || (probed.webkitAudioDecodedByteCount ?? 0) > 0
  })

  expect(hasAudio).toBe(false)
})
