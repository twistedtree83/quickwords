import { score } from './pipeline/scorer'
import { compile } from './pipeline/choreographer'
import { renderFrame } from './pipeline/renderer'
import { PRESETS } from './pipeline/presets'
import { FRAME_HEIGHT, FRAME_WIDTH } from './pipeline/frame'
import type { Preset } from './pipeline/types'

/** Short, with one clear emphasis, so a thumbnail shows the contrast. */
const SAMPLE = 'we cut it to 40 seconds'

/** A frame partway through the first phrase, so entry motion is visible. */
const RESTING_MS = 260

/**
 * The preset picker.
 *
 * Thumbnails animate on hover because motion is most of what separates these
 * three — a static thumbnail hides the axis you are actually choosing on.
 */
export function mountPicker(
  container: HTMLElement,
  selected: string,
  onChange: (preset: Preset) => void,
): void {
  const timeline = compile(score(SAMPLE), PRESETS[0]!, { bpm: 120 })

  for (const preset of PRESETS) {
    const label = document.createElement('label')
    label.className = 'swatch'

    const input = document.createElement('input')
    input.type = 'radio'
    input.name = 'preset'
    input.value = preset.id
    input.checked = preset.id === selected

    const canvas = document.createElement('canvas')
    canvas.width = FRAME_WIDTH
    canvas.height = FRAME_HEIGHT
    const ctx = canvas.getContext('2d')!

    const name = document.createElement('span')
    name.className = 'swatch__name'
    name.textContent = preset.name

    renderFrame(timeline, RESTING_MS, ctx, preset)

    let loop = 0
    const stop = () => {
      cancelAnimationFrame(loop)
      renderFrame(timeline, RESTING_MS, ctx, preset)
    }
    const start = () => {
      cancelAnimationFrame(loop)
      const startedAt = performance.now()
      const tick = () => {
        const elapsed = (performance.now() - startedAt) % timeline.durationMs
        renderFrame(timeline, elapsed, ctx, preset)
        loop = requestAnimationFrame(tick)
      }
      loop = requestAnimationFrame(tick)
    }

    label.addEventListener('mouseenter', start)
    label.addEventListener('mouseleave', stop)
    input.addEventListener('focus', start)
    input.addEventListener('blur', stop)
    input.addEventListener('change', () => onChange(preset))

    label.append(input, canvas, name)
    container.append(label)
  }
}
