/**
 * The tuning corpus.
 *
 * `source` is not decoration. Placeholder posts were written for this repo,
 * which makes them cleaner and more regular than anything anyone actually
 * posts — tuning the heuristics against them would fit the model to prose that
 * does not exist. Only `real` entries count toward the 20–30 the review needs.
 *
 * Replace placeholders with real posts as they come in. Keep the ids stable so
 * a review can be compared against an earlier one.
 */
export type CorpusPost = {
  id: string
  text: string
  source: 'real' | 'placeholder'
  /** What this entry is here to exercise. */
  probe: string
}

export const CORPUS: CorpusPost[] = [
  {
    id: 'p01',
    source: 'placeholder',
    probe: 'plain numbers — the quantitative claim must land',
    text: 'We cut our build time from 11 minutes to 40 seconds. Same test coverage. Same machines. We just stopped rebuilding things that had not changed.',
  },
  {
    id: 'p02',
    source: 'placeholder',
    probe: 'currency and percentage in one post',
    text: 'That one config change saved us $12,000 a year and cut cold starts by 23%. It was four lines.',
  },
  {
    id: 'p03',
    source: 'placeholder',
    probe: 'no terminal punctuation at all — budget must carry the breaking',
    text: 'nobody tells you that the hardest part of shipping is deciding what not to build and then living with that decision every single day afterwards',
  },
  {
    id: 'p04',
    source: 'placeholder',
    probe: 'quoted span mid-sentence',
    text: 'A customer told us the dashboard was "completely unusable on a phone" and she was right. We had never once opened it on a phone.',
  },
  {
    id: 'p05',
    source: 'placeholder',
    probe: 'shouting for emphasis',
    text: 'Your users do NOT care which framework you chose. They care that the page loads before they lose interest.',
  },
  {
    id: 'p06',
    source: 'placeholder',
    probe: 'very short post — duration floor',
    text: 'Ship it. Then measure it.',
  },
  {
    id: 'p07',
    source: 'placeholder',
    probe: 'question opening, common LinkedIn hook',
    text: 'What if the reason your team ships slowly has nothing to do with your team? We spent six weeks on process. The bottleneck was one flaky test.',
  },
  {
    id: 'p08',
    source: 'placeholder',
    probe: 'multi-word proper noun mid-sentence',
    text: 'I flew to New York for a meeting that could have been an email. The email would have been better. The bagel was excellent.',
  },
  {
    id: 'p09',
    source: 'placeholder',
    probe: 'em dashes and semicolons — soft break variety',
    text: 'Good code is not clever; it is obvious. The best compliment a reviewer can give you — the only one that matters — is that they had nothing to say.',
  },
  {
    id: 'p10',
    source: 'placeholder',
    probe: 'emoji in the middle of prose',
    text: 'Six months of work shipped this morning 🚀 and the only thing anyone noticed was that the button moved four pixels to the left.',
  },
  {
    id: 'p11',
    source: 'placeholder',
    probe: 'a long unbreakable token (URL)',
    text: 'Full writeup here: https://example.com/engineering/why-we-deleted-forty-thousand-lines-of-code — the short version is that we were wrong.',
  },
  {
    id: 'p12',
    source: 'placeholder',
    probe: 'author asterisk override',
    text: 'The feature nobody asked for is the one that *quietly* keeps everybody using the product.',
  },
  {
    id: 'p13',
    source: 'placeholder',
    probe: 'dense stopword prose — emphasis must not fire on everything',
    text: 'It was not that we did not have the data. It was that none of us had ever gone and looked at it.',
  },
  {
    id: 'p14',
    source: 'placeholder',
    probe: 'list-like structure with sentence fragments',
    text: 'Three things I got wrong this year. Hiring too late. Shipping too slowly. Explaining too little.',
  },
  {
    id: 'p15',
    source: 'placeholder',
    probe: 'long compound words and jargon',
    text: 'Our observability infrastructure was generating four terabytes of logs that absolutely nobody had ever queried.',
  },
  {
    id: 'p16',
    source: 'placeholder',
    probe: 'numbers as words rather than digits',
    text: 'Eleven people reviewed that pull request. Nobody caught the bug. The intern found it in about ninety seconds.',
  },
  {
    id: 'p17',
    source: 'placeholder',
    probe: 'a sentence that lands on a stopword',
    text: 'Everybody wants to talk about what to build. Almost nobody wants to talk about what to kill.',
  },
  {
    id: 'p18',
    source: 'placeholder',
    probe: 'hyphenated compound',
    text: 'We replaced a state-of-the-art recommendation engine with a hand-written list of twelve items. Engagement went up.',
  },
  {
    id: 'p19',
    source: 'placeholder',
    probe: 'time and date formats',
    text: 'On March 3rd at 4am our primary database ran out of disk. By 4:06am it had healed itself. Nobody had built that.',
  },
  {
    id: 'p20',
    source: 'placeholder',
    probe: 'very long single sentence, no hard break',
    text: 'The thing about technical debt is that it never announces itself as technical debt, it announces itself as a two week estimate for something that used to take an afternoon',
  },
  {
    id: 'p21',
    source: 'placeholder',
    probe: 'acronym that should read as shouting or not',
    text: 'Our API returned 200 OK for every error for about three weeks. The monitoring was green the entire time.',
  },
  {
    id: 'p22',
    source: 'placeholder',
    probe: 'sentence-initial capital that is not a proper noun',
    text: 'Measuring the wrong thing carefully is worse than measuring the right thing roughly.',
  },
  {
    id: 'p23',
    source: 'placeholder',
    probe: 'multiplier and ratio notation',
    text: 'We made the query 40x faster by deleting it. Turns out the result was never displayed anywhere.',
  },
  {
    id: 'p24',
    source: 'placeholder',
    probe: 'closing line that is the whole point',
    text: 'I used to think the job was writing code. The job is deciding what the code is for.',
  },
]

export const realPostCount = () =>
  CORPUS.filter((post) => post.source === 'real').length
