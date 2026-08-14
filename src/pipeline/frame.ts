/** 9:16, sized for the feed. The canvas backing store is always this. */
export const FRAME_WIDTH = 1080
export const FRAME_HEIGHT = 1920

/**
 * The feed draws its own furniture over the video — author name, caption,
 * reaction buttons, progress bar. Content stays inside this margin so the
 * platform's chrome cannot cover the words.
 *
 * Vertical inset is far larger than horizontal because the overlays live at
 * the top and bottom, not the sides.
 */
export const SAFE_INSET_X = 96
export const SAFE_INSET_Y = 320

export const SAFE_LEFT = SAFE_INSET_X
export const SAFE_RIGHT = FRAME_WIDTH - SAFE_INSET_X
export const SAFE_TOP = SAFE_INSET_Y
export const SAFE_BOTTOM = FRAME_HEIGHT - SAFE_INSET_Y

export const SAFE_WIDTH = SAFE_RIGHT - SAFE_LEFT
export const SAFE_HEIGHT = SAFE_BOTTOM - SAFE_TOP
