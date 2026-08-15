/**
 * Content words common enough to carry little information.
 *
 * Not stopwords — these are real nouns and verbs that mean something. But
 * "problem", "team" and "work" appear in every second post, so emphasising
 * them tells a reader nothing they could not have guessed. "Observability",
 * "rollback" and "12,000" do.
 *
 * This is a crude stand-in for word frequency: information content is roughly
 * the inverse of how often a word appears, and a two-tier split captures most
 * of that without shipping a frequency table.
 *
 * Kept separate from the stopword list because the two do different jobs —
 * stopwords are suppressed outright, these merely rank low.
 */
const COMMONPLACE = new Set([
  'time', 'year', 'day', 'week', 'month', 'hour', 'minute', 'moment', 'today',
  'people', 'person', 'man', 'woman', 'child', 'kid', 'guy', 'friend', 'family',
  'team', 'group', 'company', 'business', 'work', 'job', 'career', 'office',
  'thing', 'things', 'stuff', 'way', 'ways', 'part', 'place', 'point', 'kind',
  'case', 'fact', 'idea', 'reason', 'question', 'answer', 'problem', 'issue',
  'result', 'change', 'need', 'help', 'use', 'lot', 'bit', 'end', 'start',
  'life', 'world', 'home', 'house', 'room', 'city', 'country', 'area', 'side',
  'hand', 'head', 'eye', 'face', 'foot', 'body', 'name', 'word', 'words',
  'story', 'book', 'page', 'line', 'list', 'number', 'money', 'price', 'cost',
  'week', 'night', 'morning', 'today', 'tomorrow', 'yesterday', 'week',
  'good', 'bad', 'great', 'best', 'better', 'worse', 'worst', 'big', 'small',
  'new', 'old', 'young', 'long', 'short', 'high', 'low', 'right', 'wrong',
  'first', 'last', 'next', 'same', 'different', 'own', 'other', 'another',
  'many', 'much', 'more', 'most', 'less', 'least', 'few', 'little', 'every',
  'all', 'some', 'any', 'each', 'both', 'half', 'whole', 'real', 'sure',
  'hard', 'easy', 'simple', 'nice', 'fine', 'true', 'false', 'clear', 'able',
  'get', 'got', 'go', 'went', 'gone', 'going', 'come', 'came', 'coming',
  'make', 'made', 'making', 'take', 'took', 'taken', 'taking', 'give', 'gave',
  'put', 'keep', 'kept', 'let', 'know', 'knew', 'known', 'think', 'thought',
  'say', 'said', 'saying', 'tell', 'told', 'ask', 'asked', 'want', 'wanted',
  'need', 'needed', 'try', 'tried', 'trying', 'use', 'used', 'using', 'find',
  'found', 'look', 'looked', 'looking', 'see', 'saw', 'seen', 'seeing',
  'feel', 'felt', 'seem', 'seemed', 'become', 'became', 'turn', 'turned',
  'work', 'worked', 'working', 'call', 'called', 'talk', 'talked', 'speak',
  'run', 'ran', 'running', 'move', 'moved', 'leave', 'left', 'stay', 'stayed',
  'start', 'started', 'stop', 'stopped', 'begin', 'began', 'end', 'ended',
  'help', 'helped', 'show', 'showed', 'shown', 'mean', 'meant', 'happen',
  'happened', 'live', 'lived', 'love', 'loved', 'like', 'liked', 'hate',
  'read', 'write', 'wrote', 'written', 'learn', 'learned', 'teach', 'taught',
  'build', 'built', 'building', 'add', 'added', 'set', 'sent', 'send',
  'today', 'always', 'never', 'often', 'sometimes', 'usually', 'really',
  'actually', 'probably', 'maybe', 'perhaps', 'still', 'already', 'yet',
  'again', 'once', 'twice', 'now', 'soon', 'later', 'early', 'late', 'ago',
  'here', 'there', 'everywhere', 'anywhere', 'somewhere', 'nowhere',
  'everyone', 'everybody', 'someone', 'somebody', 'anyone', 'anybody',
  'nobody', 'nothing', 'something', 'anything', 'everything',
])

/**
 * Matches the plural and third-person forms too.
 *
 * Without this, "want" ranks as commonplace while "wants" ranks as
 * distinctive, and review showed exactly that — "wants", "tells" and "things"
 * were being emphasised alongside their base forms being ignored. Crude
 * stemming beats listing every inflection.
 */
export function isCommonplace(bare: string): boolean {
  if (COMMONPLACE.has(bare)) return true

  if (bare.endsWith('es') && COMMONPLACE.has(bare.slice(0, -2))) return true
  if (bare.endsWith('s') && COMMONPLACE.has(bare.slice(0, -1))) return true

  return false
}
