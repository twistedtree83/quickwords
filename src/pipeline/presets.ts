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
 * Three distinct looks are designed in #9; this is the one extracted from the
 * Renderer, proving the seam holds.
 */
export const DEFAULT_PRESET: Preset = {
  id: 'plain',
  name: 'Plain',

  background: '#0b0b0f',
  color: '#8b8b96',
  emphasisColor: '#ffffff',

  fontStack: 'system-ui, sans-serif',
  weightOrdinary: 400,
  weightEmphasis: 700,
  baseFontPx: BASE_FONT_PX,
  emphasisScale: EMPHASIS_SCALE,
  lineHeightRatio: LINE_HEIGHT_RATIO,

  transition: 'cut',
  easing: 'linear',
}

export const PRESETS: Preset[] = [DEFAULT_PRESET]
