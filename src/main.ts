import { score } from './pipeline/scorer'
import { compile } from './pipeline/choreographer'
import { renderFrame, wordsVisibleAt } from './pipeline/renderer'
import { record, type Recording } from './pipeline/capture'
import { extensionFor, isAwkwardToUpload } from './pipeline/formats'
import { DEFAULT_PRESET, presetById } from './pipeline/presets'
import { canRecord, describeProblem } from './pipeline/guards'
import { mountPicker } from './picker'
import type { RenderDiagnostics } from './diagnostics'

declare global {
  interface Window {
    __kinetic?: RenderDiagnostics
  }
}

const textarea = document.querySelector<HTMLTextAreaElement>('#text')!
const renderButton = document.querySelector<HTMLButtonElement>('#render')!
const status = document.querySelector<HTMLParagraphElement>('#status')!
const picker = document.querySelector<HTMLFieldSetElement>('#picker')!
const tempo = document.querySelector<HTMLInputElement>('#tempo')!
const tempoValue = document.querySelector<HTMLOutputElement>('#tempo-value')!
const progress = document.querySelector<HTMLDivElement>('#progress')!
const progressBar = document.querySelector<HTMLProgressElement>('#progress-bar')!
const progressLabel = document.querySelector<HTMLSpanElement>('#progress-label')!
const result = document.querySelector<HTMLDivElement>('#result')!
const resultVideo = document.querySelector<HTMLVideoElement>('#result-video')!
const downloadLink = document.querySelector<HTMLAnchorElement>('#download')!
const discardButton = document.querySelector<HTMLButtonElement>('#discard')!
const canvas = document.querySelector<HTMLCanvasElement>('#preview')!
const ctx = canvas.getContext('2d')!

/** Only the two choices persist. No accounts, no saved projects, no history. */
const REMEMBERED = { preset: 'kinetic.preset', tempo: 'kinetic.tempo' } as const

const remembered = (key: string): string | null => {
  try {
    return localStorage.getItem(key)
  } catch {
    // Private browsing or blocked storage: a forgotten preference is not worth
    // breaking the page over.
    return null
  }
}

const remember = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* see above */
  }
}

let preset = presetById(remembered(REMEMBERED.preset) ?? DEFAULT_PRESET.id)
tempo.value = remembered(REMEMBERED.tempo) ?? tempo.value

const bpm = () => Number(tempo.value)
const sampleText = () => textarea.value.trim() || 'paste your text'

/** Preview only — no file is produced, so pace can be judged before rendering. */
function updatePreview(): void {
  showPreview()
  const timeline = compile(score(sampleText()), preset, { bpm: bpm() })
  const first = timeline.events[0]
  renderFrame(timeline, first ? first.onsetMs + first.holdMs / 2 : 0, ctx, preset)
  tempoValue.textContent = `${bpm()} bpm · ${(timeline.durationMs / 1000).toFixed(1)}s`
}

/** The canvas and the finished video occupy the same place; never both. */
function showPreview(): void {
  result.hidden = true
  canvas.hidden = false
  resultVideo.pause()
}

function showResult(): void {
  canvas.hidden = true
  result.hidden = false
}

discardButton.addEventListener('click', showPreview)

mountPicker(picker, preset.id, (chosen) => {
  preset = chosen
  remember(REMEMBERED.preset, chosen.id)
  updatePreview()
})

tempo.addEventListener('input', () => {
  remember(REMEMBERED.tempo, tempo.value)
  updatePreview()
})
textarea.addEventListener('input', () => {
  updatePreview()
  // Warn while typing, so an over-long post is trimmed before the wait rather
  // than discovered after it.
  const problem = describeProblem(textarea.value)
  status.textContent = textarea.value.trim() === '' ? '' : (problem ?? '')
})
updatePreview()

// Checked on arrival, not after the text is pasted and Render is pressed.
if (!canRecord(window)) {
  renderButton.disabled = true
  status.textContent =
    'This browser cannot record video from a canvas, so Kinetic cannot make you a file. Chrome or Safari will work.'
}

/** Guards re-entry: a second press must not start an overlapping recording. */
let rendering = false
let renderCount = 0

/**
 * Render progress.
 *
 * Determinate rather than a spinner: real-time capture means the render takes
 * exactly as long as the video, so the remaining time is known rather than
 * guessed. A spinner would be claiming otherwise.
 *
 * The bar is driven from the draw loop, which runs ~60 times a second, so
 * writes are throttled to whole percent and whole second changes — the DOM
 * does not need updating sixty times to show the same number.
 */
let lastPercent = -1
let lastSecondsLeft = -1

function startProgress(): void {
  lastPercent = -1
  lastSecondsLeft = -1
  progressBar.value = 0
  progressLabel.textContent = ''
  progress.hidden = false
}

function reportProgress(fraction: number, remainingMs: number): void {
  const clamped = Math.min(1, Math.max(0, fraction))
  const percent = Math.round(clamped * 100)
  const secondsLeft = Math.max(0, Math.ceil(remainingMs / 1000))

  if (percent !== lastPercent) {
    progressBar.value = clamped
    lastPercent = percent
  }
  if (secondsLeft !== lastSecondsLeft) {
    progressLabel.textContent = `Recording — ${secondsLeft}s left`
    lastSecondsLeft = secondsLeft
  }
}

function stopProgress(): void {
  progress.hidden = true
}

renderButton.addEventListener('click', async () => {
  if (rendering) return

  // Snapshotted here: everything downstream uses this text, so editing the
  // textarea mid-render cannot produce a file that is half one draft and half
  // another.
  const text = textarea.value.trim()

  const problem = describeProblem(text)
  if (problem !== null) {
    status.textContent = problem
    return
  }

  const timeline = compile(score(text), preset, { bpm: bpm() })

  rendering = true
  renderButton.disabled = true
  status.textContent = ''
  startProgress()

  // rAF throttles in a background tab, which can silently truncate or stretch
  // a real-time recording. Noticed and reported rather than hidden.
  let backgrounded = false
  const watchVisibility = () => {
    if (document.hidden) backgrounded = true
  }
  document.addEventListener('visibilitychange', watchVisibility)

  // Canvas silently substitutes a fallback for a web font that has not
  // finished loading: the preview looks right, the video looks wrong, and
  // nothing anywhere reports a problem. Gate the first draw on it.
  await document.fonts.ready
  const fontsReadyAtFirstDraw = document.fonts.status === 'loaded'

  const wordsDrawn = new Set<string>()
  const recording = await record(canvas, timeline, (tMs) => {
    renderFrame(timeline, tMs, ctx, preset)
    for (const event of wordsVisibleAt(timeline, tMs)) wordsDrawn.add(event.text)
    reportProgress(tMs / timeline.durationMs, timeline.durationMs - tMs)
  })

  stopProgress()

  renderCount += 1
  window.__kinetic = {
    blob: recording.blob,
    renderCount,
    byteLength: recording.blob.size,
    mimeType: recording.mimeType,
    droppedFrames: recording.droppedFrames,
    framesDrawn: recording.framesDrawn,
    elapsedMs: recording.elapsedMs,
    timelineDurationMs: timeline.durationMs,
    wordsDrawn: [...wordsDrawn],
    fontsReadyAtFirstDraw,
  }

  document.removeEventListener('visibilitychange', watchVisibility)

  offerResult(recording.blob, recording.mimeType)

  rendering = false
  renderButton.disabled = false
  status.textContent = backgrounded
    ? 'Done, but the tab was in the background during the render, which can drop or stretch frames. Worth re-rendering with this tab visible.'
    : describe(recording)
})

function describe(recording: Recording): string {
  const size = `${(recording.blob.size / 1024).toFixed(0)} KB`
  const parts = [`Done — ${extensionFor(recording.mimeType)}, ${size}.`]

  if (isAwkwardToUpload(recording.mimeType)) {
    parts.push(
      'This browser can only record WebM. The file works, but some platforms reject it — Chrome or Safari will give you an MP4.',
    )
  }
  if (recording.droppedFrames > 0) {
    parts.push(
      `${recording.droppedFrames} frames dropped — worth re-rendering if it looks uneven.`,
    )
  }

  return parts.join(' ')
}

let lastObjectUrl: string | null = null

/**
 * Hands the finished video back to be watched, and offers the download.
 *
 * Nothing is saved without being asked for. A file that appears in Downloads
 * unbidden is a file you have not seen yet — and the first thing anyone wants
 * after a render is to find out whether it is any good.
 *
 * The object URL is revoked only when the next render replaces it, so the
 * video and the download link both stay live for as long as they are on screen.
 */
function offerResult(blob: Blob, mimeType: string): void {
  if (lastObjectUrl !== null) URL.revokeObjectURL(lastObjectUrl)
  const url = URL.createObjectURL(blob)
  lastObjectUrl = url

  downloadLink.href = url
  downloadLink.download = `kinetic.${extensionFor(mimeType)}`

  resultVideo.src = url
  showResult()
  // Autoplay is allowed because the video is muted — it carries no audio track
  // at all. A rejected play promise just leaves the controls waiting.
  void resultVideo.play().catch(() => {})
}
