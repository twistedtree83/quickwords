import {
  BASE_FONT_PX,
  EMPHASIS_SCALE,
  LINE_HEIGHT_RATIO,
} from './typography'
import type { Preset } from './types'

/**
 * Presets are data. The Renderer reads every visual decision from here and
 * branches only on transition family — never on which preset it was handed.
 *
 * Three, not more. They are meant to read as three different intentions, not
 * three colourways of one idea:
 *
 *   Plain     — flat, blunt, no motion. Gets out of the way of the words.
 *   Paper     — editorial. Serif, ink on off-white, phrases rising into place.
 *   Volt      — loud. Tight sans on near-black, emphasis in a colour that
 *               does not occur in nature.
 *
 * Type comes from system stacks so nothing is fetched at render time. A real
 * web font would sharpen all three, and would make the font-load gate from #7
 * genuinely load-bearing.
 */

export const PLAIN: Preset = {
  id: 'plain',
  name: 'Plain',

  background: '#0b0b0f',
  color: '#8b8b96',
  emphasisColor: '#ffffff',

  fontStack: 'system-ui, -apple-system, "Segoe UI", sans-serif',
  weightOrdinary: 400,
  weightEmphasis: 700,
  baseFontPx: BASE_FONT_PX,
  emphasisScale: EMPHASIS_SCALE,
  lineHeightRatio: LINE_HEIGHT_RATIO,

  transition: 'cut',
  easing: 'linear',
}

export const PAPER: Preset = {
  id: 'paper',
  name: 'Paper',

  background: '#f4f1ea',
  color: '#6b6558',
  emphasisColor: '#1a1815',

  fontStack: 'Georgia, "Times New Roman", serif',
  weightOrdinary: 400,
  weightEmphasis: 700,
  baseFontPx: 116,
  emphasisScale: 1.5,
  lineHeightRatio: 1.28,

  transition: 'rise',
  easing: 'outCubic',
}

export const VOLT: Preset = {
  id: 'volt',
  name: 'Volt',

  background: '#08090c',
  color: '#5a5f6b',
  emphasisColor: '#d6ff3f',

  fontStack: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  weightOrdinary: 500,
  weightEmphasis: 800,
  baseFontPx: 124,
  emphasisScale: 1.55,
  lineHeightRatio: 1.12,

  transition: 'fade',
  easing: 'outCubic',
}

export const PRESETS: Preset[] = [PLAIN, PAPER, VOLT]

export const DEFAULT_PRESET = PLAIN

export const presetById = (id: string): Preset =>
  PRESETS.find((preset) => preset.id === id) ?? DEFAULT_PRESET
