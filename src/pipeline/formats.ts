/**
 * Which container the recording goes into.
 *
 * WebM is an awkward file to hand a social platform, and it used to be the
 * only thing a browser would record. It is not any more: current Chrome and
 * Safari record MP4/H.264 directly, so most visitors get a natively-accepted
 * upload with no encoder download and no transcoding step. That is what makes
 * real-time capture viable without ffmpeg.wasm.
 *
 * Taking a predicate rather than calling MediaRecorder directly keeps the
 * decision testable without a browser.
 */

/** Most preferred first. */
const PREFERENCE = [
  'video/mp4;codecs=avc1.42E01E',
  'video/mp4;codecs=avc1',
  'video/mp4',
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
] as const

export type SupportsType = (mimeType: string) => boolean

/** The best available container, or null if the browser can record none. */
export function negotiateMimeType(isSupported: SupportsType): string | null {
  return PREFERENCE.find((type) => isSupported(type)) ?? null
}

export function extensionFor(mimeType: string): 'mp4' | 'webm' {
  return mimeType.includes('mp4') ? 'mp4' : 'webm'
}

/**
 * WebM uploads are rejected or silently re-encoded by some platforms. The user
 * still gets a real file — a working file with a caveat beats a modal
 * explaining why there is no file — but they are told what they have.
 */
export function isAwkwardToUpload(mimeType: string): boolean {
  return extensionFor(mimeType) !== 'mp4'
}
