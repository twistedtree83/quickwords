import { CORPUS, realPostCount, type CorpusPost } from './corpus/posts'
import { score } from './pipeline/scorer'
import { compile } from './pipeline/choreographer'
import { renderFrame } from './pipeline/renderer'
import { DEFAULT_PRESET } from './pipeline/presets'

const REQUIRED_REAL_POSTS = 20
const BPM = 120

const postList = document.querySelector<HTMLOListElement>('#posts')!
const statusBanner = document.querySelector<HTMLDivElement>('#corpus-status')!
const summary = document.querySelector<HTMLDivElement>('#summary')!
const stage = document.querySelector<HTMLCanvasElement>('#stage')!
const playerLabel = document.querySelector<HTMLParagraphElement>('#player-label')!
const ctx = stage.getContext('2d')!

const analyse = (post: CorpusPost) => {
  const phrases = score(post.text)
  const timeline = compile(phrases, DEFAULT_PRESET, { bpm: BPM })
  const words = phrases.flatMap((phrase) => phrase.words)
  const emphasised = words.filter((word) => word.emphasis)

  return {
    phrases,
    timeline,
    wordCount: words.length,
    emphasisRate: words.length === 0 ? 0 : emphasised.length / words.length,
  }
}

renderCorpusStatus()
renderSummary()
renderPosts()

function renderCorpusStatus(): void {
  const real = realPostCount()
  const short = REQUIRED_REAL_POSTS - real

  if (short <= 0) {
    statusBanner.className = 'banner banner--ok'
    statusBanner.textContent = `${real} real posts in the corpus. This review is meaningful.`
    return
  }

  statusBanner.className = 'banner banner--warn'
  statusBanner.textContent =
    `${real} of ${REQUIRED_REAL_POSTS} required real posts. ` +
    `${short} still needed — the rest are placeholders written for this repo, ` +
    `which are cleaner and more regular than anything anyone actually posts. ` +
    `Tuning against them fits the heuristics to prose that does not exist.`
}

function renderSummary(): void {
  const analyses = CORPUS.map(analyse)
  const overall =
    analyses.reduce((total, a) => total + a.emphasisRate, 0) / analyses.length
  const totalMs = analyses.reduce((total, a) => total + a.timeline.durationMs, 0)

  summary.innerHTML = [
    `<span>posts <b>${CORPUS.length}</b></span>`,
    `<span>mean emphasis rate <b>${(overall * 100).toFixed(0)}%</b></span>`,
    `<span>mean duration <b>${(totalMs / analyses.length / 1000).toFixed(1)}s</b></span>`,
  ].join('')
}

function renderPosts(): void {
  for (const post of CORPUS) {
    const { phrases, timeline, wordCount, emphasisRate } = analyse(post)

    const item = document.createElement('li')
    item.className = 'post'

    const meta = document.createElement('div')
    meta.className = 'post__meta'
    meta.innerHTML = [
      `<span class="tag">${post.id}</span>`,
      `<span class="tag tag--${post.source}">${post.source}</span>`,
      `<span>${post.probe}</span>`,
    ].join('')

    const phraseRow = document.createElement('div')
    phraseRow.className = 'phrases'
    for (const phrase of phrases) {
      const box = document.createElement('span')
      box.className = `phrase phrase--${phrase.breakAfter}`
      for (const word of phrase.words) {
        const span = document.createElement('span')
        span.className = word.emphasis ? 'word word--emphasis' : 'word'
        span.textContent = `${word.text} `
        box.append(span)
      }
      phraseRow.append(box)
    }

    const stats = document.createElement('div')
    stats.className = 'post__stats'
    stats.innerHTML = [
      `<span>phrases <b>${phrases.length}</b></span>`,
      `<span>words <b>${wordCount}</b></span>`,
      `<span>emphasised <b>${(emphasisRate * 100).toFixed(0)}%</b></span>`,
      `<span>duration <b>${(timeline.durationMs / 1000).toFixed(1)}s</b></span>`,
    ].join('')

    const play = document.createElement('button')
    play.type = 'button'
    play.className = 'post__play'
    play.textContent = 'Watch it'
    play.addEventListener('click', () => {
      playerLabel.textContent = `${post.id} — ${(timeline.durationMs / 1000).toFixed(1)}s`
      preview(timeline)
    })

    item.append(meta, phraseRow, stats, play)
    postList.append(item)
  }
}

let previewFrame = 0

/** Preview only — no recording. Capture is not involved in review. */
function preview(timeline: ReturnType<typeof compile>): void {
  cancelAnimationFrame(previewFrame)
  const startedAt = performance.now()

  const tick = () => {
    const elapsed = performance.now() - startedAt
    renderFrame(timeline, elapsed, ctx, DEFAULT_PRESET)
    if (elapsed < timeline.durationMs) {
      previewFrame = requestAnimationFrame(tick)
    }
  }

  previewFrame = requestAnimationFrame(tick)
}
