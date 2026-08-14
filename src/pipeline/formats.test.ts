import { describe, expect, it } from 'vitest'
import { extensionFor, isAwkwardToUpload, negotiateMimeType } from './formats'

const supporting = (...types: string[]) => {
  const set = new Set(types)
  return (type: string) => set.has(type)
}

describe('format negotiation prefers what the feed accepts', () => {
  it('picks MP4 when the browser can record it', () => {
    const chosen = negotiateMimeType(
      supporting('video/mp4;codecs=avc1.42E01E', 'video/webm;codecs=vp8'),
    )

    expect(chosen).toMatch(/^video\/mp4/)
  })

  it('falls back to WebM rather than failing', () => {
    const chosen = negotiateMimeType(supporting('video/webm;codecs=vp8'))

    expect(chosen).toBe('video/webm;codecs=vp8')
  })

  it('prefers VP9 over VP8 when no MP4 is available', () => {
    const chosen = negotiateMimeType(
      supporting('video/webm;codecs=vp9', 'video/webm;codecs=vp8'),
    )

    expect(chosen).toBe('video/webm;codecs=vp9')
  })

  it('reports that nothing is supported rather than guessing', () => {
    expect(negotiateMimeType(supporting())).toBeNull()
  })
})

describe('the file is named for what it actually is', () => {
  it.each([
    ['video/mp4;codecs=avc1.42E01E', 'mp4'],
    ['video/mp4', 'mp4'],
    ['video/webm;codecs=vp8', 'webm'],
    ['video/webm', 'webm'],
  ])('names %s as .%s', (mimeType, extension) => {
    expect(extensionFor(mimeType)).toBe(extension)
  })
})

describe('the user is told when the file may not upload', () => {
  it('flags WebM as awkward', () => {
    expect(isAwkwardToUpload('video/webm;codecs=vp8')).toBe(true)
  })

  it('does not flag MP4', () => {
    expect(isAwkwardToUpload('video/mp4;codecs=avc1.42E01E')).toBe(false)
  })
})
