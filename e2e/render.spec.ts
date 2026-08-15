import { expect, test } from '@playwright/test'
import type { RenderDiagnostics } from '../src/diagnostics'

declare global {
  interface Window {
    __kinetic?: RenderDiagnostics
  }
}

const TEXT = 'shipping beats polishing every single time'

/** Renders and waits for the result panel. Nothing downloads on its own. */
async function render(page: import('@playwright/test').Page, text = TEXT) {
  await page.getByRole('textbox').fill(text)
  await page.getByRole('button', { name: /^render$/i }).click()
  await expect
    .poll(() => page.evaluate(() => window.__kinetic?.byteLength ?? 0), {
      timeout: 60_000,
    })
    .toBeGreaterThan(0)
}

test('offers the finished video for playback rather than downloading it', async ({
  page,
}) => {
  await page.goto('/')
  await render(page)

  // The result replaces the preview, playable in place.
  await expect(page.locator('#result-video')).toBeVisible()
  await expect(page.locator('#result-video')).toHaveAttribute('src', /^blob:/)
  await expect(page.locator('#preview')).toBeHidden()
})

test('shows how far a render has got and how long is left', async ({ page }) => {
  await page.goto('/')
  // Long enough that the render is observable rather than a flash.
  await page.getByRole('textbox').fill(
    'We cut the build from eleven minutes to forty seconds. Nobody asked us to do it. The support queue is quieter now, and that was the whole point.',
  )
  await page.getByRole('button', { name: /^render$/i }).click()

  const bar = page.locator('#progress-bar')
  await expect(page.locator('#progress')).toBeVisible()

  // Determinate, not a spinner: the value climbs because the duration is known.
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            document.querySelector<HTMLProgressElement>('#progress-bar')!.value,
        ),
      { timeout: 30_000 },
    )
    .toBeGreaterThan(0.15)

  await expect(page.locator('#progress-label')).toContainText(/\d+s left/)

  await expect
    .poll(() => page.evaluate(() => window.__kinetic?.byteLength ?? 0), {
      timeout: 60_000,
    })
    .toBeGreaterThan(0)

  // Gone once there is a result to look at.
  await expect(page.locator('#progress')).toBeHidden()
  await expect(bar).toBeHidden()
})

test('does not download anything until asked', async ({ page }) => {
  await page.goto('/')

  const downloads: unknown[] = []
  page.on('download', (download) => downloads.push(download))

  await render(page)
  await page.waitForTimeout(1000)

  expect(downloads).toHaveLength(0)
})

test('downloads the file when the download button is pressed', async ({
  page,
}) => {
  await page.goto('/')
  await render(page)

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('link', { name: /download/i }).click()
  const download = await downloadPromise

  expect(await download.path()).toBeTruthy()
})

test('returns to the live preview when the result is dismissed', async ({
  page,
}) => {
  await page.goto('/')
  await render(page)

  await page.getByRole('button', { name: /back to preview/i }).click()

  await expect(page.locator('#preview')).toBeVisible()
  await expect(page.locator('#result-video')).toBeHidden()
})

test('records at 1080x1920', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('textbox').fill(TEXT)
  await page.getByRole('button', { name: /^render$/i }).click()
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
  await page.getByRole('button', { name: /^render$/i }).click()
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

test('does not draw a frame before fonts have resolved', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('textbox').fill(TEXT)
  await page.getByRole('button', { name: /^render$/i }).click()
  await expect
    .poll(() => page.evaluate(() => window.__kinetic?.byteLength ?? 0), {
      timeout: 60_000,
    })
    .toBeGreaterThan(0)

  const { fontsReadyAtFirstDraw } = (await page.evaluate(
    () => window.__kinetic,
  ))!

  expect(fontsReadyAtFirstDraw).toBe(true)
})

test('negotiates MP4 in a browser that can record it', async ({ page }) => {
  await page.goto('/')

  const mp4Capable = await page.evaluate(() =>
    MediaRecorder.isTypeSupported('video/mp4;codecs=avc1.42E01E'),
  )
  test.skip(!mp4Capable, 'this browser cannot record MP4')

  await page.getByRole('textbox').fill(TEXT)
  await page.getByRole('button', { name: /^render$/i }).click()
  await expect
    .poll(() => page.evaluate(() => window.__kinetic?.byteLength ?? 0), {
      timeout: 60_000,
    })
    .toBeGreaterThan(0)

  const { mimeType } = (await page.evaluate(() => window.__kinetic))!
  expect(mimeType).toMatch(/^video\/mp4/)
})

test('names the downloaded file for the format it actually recorded', async ({
  page,
}) => {
  await page.goto('/')
  await render(page)

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('link', { name: /download/i }).click()
  const download = await downloadPromise

  const { mimeType } = (await page.evaluate(() => window.__kinetic))!
  const expected = mimeType.includes('mp4') ? '.mp4' : '.webm'

  expect(download.suggestedFilename().endsWith(expected)).toBe(true)
})

test('pressing Render twice produces exactly one recording', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('textbox').fill(TEXT)

  const button = page.getByRole('button', { name: /^render$/i })
  await button.click()
  // Fires while the first render is still in flight.
  await button.dispatchEvent('click')

  await expect
    .poll(() => page.evaluate(() => window.__kinetic?.byteLength ?? 0), {
      timeout: 60_000,
    })
    .toBeGreaterThan(0)

  await page.waitForTimeout(1500)
  expect(await page.evaluate(() => window.__kinetic!.renderCount)).toBe(1)
})

test('refuses over-long input before starting a render', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('textbox').fill('word '.repeat(200))
  await page.getByRole('button', { name: /^render$/i }).click()

  await expect(page.locator('#status')).toContainText(/limit is 120/i)
  expect(await page.evaluate(() => window.__kinetic)).toBeUndefined()
})

test('declines right-to-left text rather than mangling it', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('textbox').fill('שלום עולם')
  await page.getByRole('button', { name: /^render$/i }).click()

  await expect(page.locator('#status')).toContainText(/right-to-left/i)
  expect(await page.evaluate(() => window.__kinetic)).toBeUndefined()
})

test('draws every pasted word at some point during the render', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('textbox').fill(TEXT)
  await page.getByRole('button', { name: /^render$/i }).click()
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
