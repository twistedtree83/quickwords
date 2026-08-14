import { expect, test } from '@playwright/test'
import type { RenderDiagnostics } from '../src/diagnostics'

declare global {
  interface Window {
    __kinetic?: RenderDiagnostics
  }
}

/**
 * The project's load-bearing risk: real-time capture holding 30fps at
 * 1080x1920. Everything about "the render takes as long as the video" rests on
 * it, and it has no workaround — if this fails the fallbacks are dropping to
 * 720x1280 or reopening the offline-encoder decision, both of which are
 * architectural calls for a human.
 */
const LONG_INPUT = Array.from({ length: 60 }, (_, i) => `word${i}`).join(' ')

test('sustains its frame budget through a long render at 1080x1920', async ({
  page,
}) => {
  test.setTimeout(180_000)

  await page.goto('/')
  await page.getByRole('textbox').fill(LONG_INPUT)
  await page.getByRole('button', { name: /render/i }).click()

  await expect
    .poll(() => page.evaluate(() => window.__kinetic?.byteLength ?? 0), {
      timeout: 120_000,
      intervals: [1000],
    })
    .toBeGreaterThan(0)

  const d = (await page.evaluate(() => window.__kinetic))!
  const expectedFrames = Math.round((d.timelineDurationMs / 1000) * 30)
  const dropRatio = d.droppedFrames / expectedFrames

  console.log(
    [
      '',
      '  capture perf @ 1080x1920',
      `    timeline duration : ${d.timelineDurationMs}ms`,
      `    wall clock        : ${Math.round(d.elapsedMs)}ms`,
      `    frames expected   : ${expectedFrames}`,
      `    frames drawn      : ${d.framesDrawn}`,
      `    frames dropped    : ${d.droppedFrames} (${(dropRatio * 100).toFixed(1)}%)`,
      `    output            : ${(d.byteLength / 1024).toFixed(0)} KB ${d.mimeType}`,
      '',
    ].join('\n'),
  )

  expect(dropRatio).toBeLessThan(0.1)
  expect(Math.abs(d.elapsedMs - d.timelineDurationMs)).toBeLessThan(500)
})
