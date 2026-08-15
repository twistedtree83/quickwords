# Kinetic

Paste text. Get a 9:16 kinetic-typography video. Under a minute, entirely in the browser.

**[Try it →](https://twistedtree83.github.io/quickwords/)**

---

## What it does

You wrote something worth posting. Making it a video takes forty minutes in Canva, so you post the plain text instead, or nothing.

Kinetic takes the text and gives back a file. No timeline, no layer panel, no project to save, no account. **From paste to downloaded file in under a minute, with three interactions.**

The part that makes it feel like more than a template filler: it reads the text before it animates it. It decides which words carry the sentence — the numbers, the names, the one verb it turns on — and gives those the emphasis while the connective tissue slips past. You didn't mark anything up.

Nothing leaves your machine. There is no server.

## Running it

```bash
npm install
npm run dev          # the app
npm run review       # emphasis review across the tuning corpus
npm test             # 142 unit tests, no browser
npm run test:e2e     # 16 Playwright tests, real recording
npm run typecheck
```

## How it works

```
text ──Scorer──▶ Phrase[] ──Choreographer──▶ Timeline ──Renderer──▶ frames ──Capture──▶ Blob
```

Three of the four stages are pure functions with no DOM, no canvas and no clock. All the interesting decisions here are about text and time, and none of them need a browser to be exercised.

- **Scorer** — tokenize, gather spans that must never break apart (quotes, proper nouns, a number and its unit), pack into phrases that fit the frame.
- **Emphasis** — ranked and budgeted, not thresholded. Every word scores for information content; each phrase spends a budget on its highest scorer. Author marks and quotation are forced; numbers, shouting and distinctiveness compete; stopwords never do.
- **Choreographer** — counts in whole subdivisions of the tempo before converting to milliseconds, so onsets land *on* the beat grid rather than near it.
- **Renderer** — a pure function of `(timeline, t)`. The same timestamp always produces the same frame. That constraint is why it can be tested through a recorded draw-call log instead of pixels, and it is the thing to defend in review.
- **Capture** — real-time `MediaRecorder`. The render takes as long as the video, which is the whole basis of the speed promise. Format is negotiated MP4-first, so most browsers produce a natively-uploadable file with no encoder download.

Presets are data, not code paths. Two presets differing only in `id` must produce byte-identical draw logs — asserted, so nobody can quietly add a branch.

## Known limits

- **Left-to-right scripts only.** RTL is detected and declined rather than drawn in visual order with the words reversed, which would produce a confident, wrong video.
- **No audio.** The feed autoplays muted, so a video that depends on sound fails by default.
- **9:16 only.** The preset model does not obstruct other ratios; nothing ships for them.
- **A very long URL renders small.** Words are never broken across lines, so an unbreakable token shrinks to fit. Whole-word integrity was chosen over legibility for that one case.
- **Desktop browsers.** The page is not broken on a phone, but real-time capture at 1080×1920 is not a promise mobile Safari can keep.

## Open

Two issues are open and both need a human: [tuning emphasis against real posts](https://github.com/twistedtree83/quickwords/issues/5) (needs a corpus of real writing — the placeholders are too clean) and [signing off the three preset designs](https://github.com/twistedtree83/quickwords/issues/9).
