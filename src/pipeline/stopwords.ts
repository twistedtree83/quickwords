/**
 * Connective tissue: words that hold a sentence together without carrying it.
 *
 * Shared, because two different rules depend on the same judgement — emphasis
 * suppresses these, and the Scorer refuses to bind a number to one ("40
 * seconds" is a measurement, "3rd at" is not).
 */
const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'so', 'yet', 'nor', 'for',
  'of', 'to', 'in', 'on', 'at', 'by', 'from', 'with', 'into', 'over',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'am',
  'it', 'its', 'this', 'that', 'these', 'those', 'there', 'here',
  'i', 'we', 'you', 'they', 'he', 'she', 'them', 'us', 'me', 'my',
  'our', 'your', 'their', 'his', 'her',
  'as', 'if', 'than', 'then', 'when', 'while', 'because',
  'do', 'does', 'did', 'have', 'has', 'had',
  'will', 'would', 'can', 'could', 'should', 'may', 'might', 'must',
  'not', 'no', 'up', 'out', 'about', 'just', 'very',
  // Interrogatives and determiners. These kept surfacing in review as
  // emphasised words — they are grammar, not content.
  'what', 'which', 'who', 'whom', 'whose', 'where', 'why', 'how', 'whether',
  'such', 'own', 'only', 'also', 'even', 'ever', 'back', 'still', 'well',
  'one', 'get', 'got', 'been',
])

/** Punctuation removed, casing kept — shouting has to stay detectable. */
export const bareWordPreservingCase = (token: string) =>
  token.replace(/[^\p{L}\p{N}'-]/gu, '')

export const strip = bareWordPreservingCase

export const bareWord = (token: string) => strip(token).toLowerCase()

export const isStopword = (token: string) => STOPWORDS.has(bareWord(token))
