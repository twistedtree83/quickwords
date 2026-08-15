/**
 * Whether a token is a URL.
 *
 * Deliberately narrow: an explicit scheme, or a `www.` prefix. Matching bare
 * domains would catch "e.g." and "hello.world" and underline them, which is a
 * worse failure than missing an unprefixed link.
 */
const LINK = /^(?:https?:\/\/\S+|www\.\S+\.\S+)$/i

export const isLink = (token: string): boolean =>
  LINK.test(stripTrailingPunctuation(token))

/** A link at the end of a sentence still ends in a full stop. */
const stripTrailingPunctuation = (token: string) =>
  token.replace(/[.,;:!?)\]"'”’]+$/, '')
