# Kinetic — PRD

Paste text. Get a 9:16 kinetic-typography video. Under a minute, entirely in the browser.

---

## Problem Statement

I write something worth posting — a lesson from shipping, a short observation, three sentences about a bug that cost me a day — and then it dies as a plain-text LinkedIn post that nobody stops scrolling for.

The advice is always "make it a video." So I open Canva or CapCut, pick a template, retype my words into a timeline, nudge keyframes, fight a font picker, export, and forty minutes later I have a fifteen-second video. The video is worth making. The forty minutes are not. So most days I post the plain text, or I post nothing.

Every tool in this space assumes I want to *edit* a video. I don't. I want to *have* one. I already wrote the words; the words are the content. What I need is something that takes text and gives back a file I can upload, with no timeline, no layer panel, no project to save, and no account to create.

The gap is not quality — it's activation energy. Anything that takes longer than the writing itself will not survive contact with a Tuesday.

## Solution

A single page. One textarea, three preset thumbnails, a Render button.

Paste a paragraph, pick a look, hit Render. A canvas plays your words back at you as kinetic typography — phrases arriving in time, the words that carry meaning landing harder than the ones that don't — and the same pass that plays it also records it. When the preview finishes, the file is already downloaded.

The thing that makes it feel like magic rather than a template filler is that **Kinetic reads the text before it animates it.** It decides which words matter — the numbers, the names, the one verb the sentence turns on — and gives those words the emphasis, while the connective tissue slips past quickly. You did not mark anything up. You pasted a paragraph and it found the beats.

There is no editor. There is no save. There is no server: the text never leaves the machine. Render time is roughly the length of the video, because the recording *is* the playback. Fifteen-second video, fifteen-second wait.

The design constraint the whole product is built around: **from paste to downloaded file, under a minute, with three interactions.**

## User Stories

### Core loop

1. As someone with a post to publish, I want to paste text into a single visible field on page load, so that I can start without navigating anywhere or deciding anything first.
2. As a first-time visitor, I want the page to arrive with example text already in the field, so that I can press Render immediately and understand what the tool does before I invest my own writing.
3. As someone evaluating the tool, I want to see a live preview of my text animating before I commit to rendering, so that I can judge the result without producing a file.
4. As someone who has pasted text, I want to choose between a small number of distinct visual presets, so that I can pick a look in seconds instead of configuring one.
5. As someone picking a preset, I want each preset thumbnail to animate on hover, so that I can judge motion without clicking through all of them.
6. As someone ready to export, I want a single Render button that produces a finished file, so that there is no export dialog, format matrix, or settings step between me and the result.
7. As someone rendering, I want to watch the video play while it records, so that the wait is the preview rather than a progress bar over nothing.
8. As someone rendering, I want to see how much time is left, so that I know whether to wait or switch tabs.
9. As someone whose render finished, I want the file to download automatically, so that posting it is the next thing I do rather than hunting for a download button.
10. As someone who missed the download, I want a persistent download link for the last render, so that a dismissed browser prompt does not cost me the whole render.
11. As someone who wants a second take, I want to edit the text and re-render without reloading or clearing anything, so that iterating costs one interaction.

### Reading the text

12. As someone pasting a paragraph, I want the emphasized words chosen for me, so that I get a designed result without marking anything up.
13. As someone writing about results, I want numbers, percentages, and currency amounts to always land as emphasis, so that the quantitative claim is the frame people screenshot.
14. As someone writing prose, I want filler and connective words to move past quickly rather than getting their own dramatic beat, so that the video does not feel padded.
15. As someone quoting, I want text inside quotation marks to be treated as a unit and emphasized, so that the quote reads as a quote.
16. As someone who typed a word in ALL CAPS, I want that treated as deliberate emphasis, so that my own signal is respected over the heuristics.
17. As someone unhappy with the automatic choice, I want to wrap a word in asterisks to force emphasis, so that I can override the machine without leaving the textarea.
18. As someone with a long sentence, I want it broken into short phrases at natural grammatical joints, so that the video reads in breaths rather than a word-by-word crawl.
19. As someone with punctuation, I want full stops and commas to produce proportionally different pauses, so that the rhythm matches how the sentence would be spoken.
20. As someone with a proper noun or product name, I want it kept intact rather than split across two phrases, so that names never break mid-air.

### The video itself

21. As someone posting to LinkedIn, I want a 9:16 vertical video, so that it fills a phone screen in the feed.
22. As someone posting to LinkedIn, I want an MP4 whenever the browser can produce one, so that the upload is accepted without me converting anything.
23. As someone on a browser that cannot produce MP4, I want a working WebM instead of a failure, so that I still get a file and I am told plainly what it is and where it may not upload.
24. As someone posting to a muted autoplay feed, I want the video to be fully legible with no sound, so that the format's own constraints do not undermine it.
25. As someone posting to a platform with a minimum video length, I want short text to still produce a video above that floor, so that a two-sentence post is not rejected on upload.
26. As someone pasting an essay, I want to be warned when my text is too long before I wait through a render, so that I trim it first rather than discovering it afterwards.
27. As someone with a long word or a URL, I want the type to fit the safe area rather than overflow the frame, so that nothing is clipped at the edges.
28. As someone posting to a feed with UI chrome over the video, I want content kept inside a safe margin, so that words are not hidden behind the platform's own overlays.
29. As someone rendering, I want the first and last moments of the video to hold, so that the video does not start or end mid-motion when the feed loops it.
30. As someone controlling pace, I want a tempo control, so that I can make a punchy three-line post fast and a reflective paragraph slow.

### Trust, failure, and edges

31. As someone pasting unpublished work, I want the text to never leave my machine, so that I can draft with it freely.
32. As a privacy-conscious visitor, I want that stated plainly on the page rather than buried in a policy, so that I can believe it without reading a document.
33. As someone on a slow machine, I want to be told if frames were dropped during recording, so that I know to re-render rather than posting a stuttering video.
34. As someone whose browser lacks the required recording API, I want to be told that on arrival rather than after pasting and pressing Render, so that I do not waste the effort.
35. As someone who pasted an emoji or an accented character, I want it rendered correctly, so that the video matches what I wrote.
36. As someone who pasted text in a right-to-left script, I want either correct rendering or an honest message that it is unsupported, so that I do not ship a broken video.
37. As someone who pressed Render twice, I want the second press ignored while a render is in flight, so that I do not get two overlapping recordings.
38. As someone who edited the text mid-render, I want the render to either finish with the original text or cleanly abort, so that I never get a video that is half one draft and half another.
39. As someone who switched tabs during a render, I want the recording to survive backgrounding or to fail loudly, so that I do not return to a silently truncated file.
40. As a returning user, I want my last-used preset and tempo remembered, so that my second video takes fewer decisions than my first.

## Implementation Decisions

### Stack

Vite and TypeScript, no UI framework. The interface is a textarea, three buttons, a canvas and a slider — a framework would be weight without leverage. Types carry their keep in the `Timeline` data model, which is the contract every module depends on. Vitest for the pure modules, Playwright for the one module that needs a real browser.

### Pipeline

Four stages, each a distinct module, connected by plain data:

```
text ──Scorer──▶ Phrase[] ──Choreographer──▶ Timeline ──Renderer──▶ frames ──Capture──▶ Blob
```

Three of the four stages are pure functions with no DOM, no canvas and no timers. That is deliberate: all of the interesting logic in this product is decision-making about text and time, and none of it needs a browser to be exercised. The browser-coupled surface is confined to the last stage and the app shell.

### Scorer — `score(text: string): Phrase[]`

Owns the entire question of "which words matter and where do phrases break." Takes a string, returns structured phrases. No configuration, no options object — the interface is one function of one argument, and everything it knows is internal.

Emphasis is heuristic and layered, with explicit user signals outranking inferred ones. Author overrides (asterisk-wrapping) rank above typographic signals (ALL CAPS, quoted spans), which rank above lexical signals (digits, currency, percentages, proper-noun shape), which rank above positional ones (the final content word of a sentence carries weight). A stopword list suppresses emphasis on connective tissue regardless of position.

Phrase breaking respects hard punctuation first, then coordinating conjunctions, then a character budget derived from the frame's safe area. A phrase never exceeds the budget and never splits a quoted span or a hyphenated compound.

The output shape is the contract:

```ts
type Word   = { text: string; weight: number; emphasis: boolean }
type Phrase = { words: Word[]; breakAfter: 'hard' | 'soft' }
```

The invariant that makes this testable without asserting on aesthetics: **every input word appears exactly once, in order, across the output phrases.** Emphasis quality is a judgement call; word conservation is not, and it catches the entire class of bugs where text silently disappears.

### Choreographer — `compile(phrases: Phrase[], preset: Preset, opts: { bpm: number }): Timeline`

Turns scored text into absolute time. Pure, deterministic, no clock access — it computes when things happen, it never waits for them.

Word onsets snap to a subdivision of a beat grid derived from the BPM. Emphasis words are allocated a full beat with a hold; unemphasized words take a subdivision and keep moving. Hard punctuation buys a rest, soft breaks buy a shorter one. Lead-in and tail-hold are added at the ends so the video does not begin or end mid-motion.

`Timeline` is the interface the renderer and the recorder both read:

```ts
type Timeline = {
  durationMs: number
  fps: number
  events: Array<{
    wordId: number
    phraseIndex: number
    onsetMs: number
    holdMs: number
    exitMs: number
  }>
}
```

Duration is computed, not configured — but it is clamped upward to clear the platform minimum, so a very short input still produces a postable video.

### Renderer — `renderFrame(timeline: Timeline, tMs: number, ctx: CanvasRenderingContext2D, preset: Preset): void`

Draws exactly one frame for one instant. It is a pure function of `(timeline, t)` in everything that matters: **the same `t` always produces the same frame.** It holds no animation state, owns no loop, and reads no clock. Whether `t` comes from a real-time loop or a test harness counting by 33ms is not its concern.

That property is the reason the renderer is testable at all, and it is the constraint to defend in review — any state that accumulates across frames breaks it.

Type is laid out against a safe area inset from the frame edge, with font size solved down until the phrase fits. Web fonts must be resolved before the first draw; canvas silently substitutes a fallback for a font that has not loaded, which produces a correct-looking preview and a wrong-looking video.

### Presets

Data, not code. A preset is a palette, a type stack, an easing family, a transition family, and a layout rule. Three ship. Adding a fourth is a new object, not a new code path — if a preset ever requires a branch in the renderer, the preset model is wrong and the transition family should absorb it instead.

### Capture — `record(canvas, timeline, opts): Promise<{ blob: Blob; mimeType: string; droppedFrames: number }>`

The one impure module, kept deliberately thin: negotiate a format, drive a real-time loop, hand back a Blob.

Recording is real-time via `canvas.captureStream()` into `MediaRecorder`. This is the decision the product's core promise rests on — the render takes as long as the video, with no multi-megabyte encoder to download first. The cost is real and accepted: real-time capture can drop frames under load, and the output format is whatever the browser will give us.

**Format negotiation is the mitigation for the WebM problem.** Capture probes `MediaRecorder.isTypeSupported` against an ordered preference list, MP4/H.264 first, WebM variants after. Current Chrome and Safari can record MP4 directly, so most visitors get a natively-accepted upload with no transcoding step. Browsers that cannot get a working WebM and an honest message about it — a real file with a caveat beats a modal explaining why there is no file. The returned `mimeType` is what the UI reports; it is never assumed.

Dropped frames are counted during capture and surfaced. A render that silently stutters is worse than one that admits it did.

Capture is defined as an interface with the real-time recorder as its first implementation. An offline frame-stepped encoder is a second implementation behind the same shape, if it is ever needed — but it is not in this scope, and the interface exists to keep that door open, not to walk through it now.

### No audio

The video has no audio track. The "beat" is a tempo grid, not a soundtrack. This dodges music licensing entirely, and it costs nothing where the video is going: the feed autoplays muted, so a video that depends on sound is a video that fails by default. Legibility in silence is a design requirement, not a limitation.

### Frame and safe area

9:16 at 1080×1920, targeting 30fps. Content is inset from the frame edge so platform UI chrome cannot cover the words. The preview canvas is scaled by CSS; the backing store is always render resolution, so what you preview is what you get.

## Testing Decisions

A good test here asserts on **external behavior and structural invariants**, never on internal steps. Concretely: it is legitimate to assert that no phrase exceeds the character budget, that word onsets increase monotonically, and that no input word is lost. It is not legitimate to assert that the scorer consulted the stopword list before the position heuristic, or that emphasis of a particular word in a particular sentence is `true` — that is aesthetic tuning, and encoding it in a test means every improvement to the heuristics arrives as a wall of red.

The dividing line: **if changing the output would be an improvement, the test should not fail.** Test the properties that must hold for any good output, not the specific output we happen to produce today.

All four modules are tested.

**Scorer** (Vitest). Word conservation — every input word appears exactly once, in order, across output phrases. No phrase exceeds the character budget. Quoted spans and hyphenated compounds are never split. Stopwords never carry emphasis. Author asterisk-overrides always do, outranking every inferred signal. Determinism: same input, same output. Degenerate inputs — empty string, one word, no punctuation, punctuation only, a 200-character URL, emoji, combining accents — return valid structures rather than throwing.

**Choreographer** (Vitest). Onsets increase monotonically and every word has one. Total duration is deterministic for a given input and BPM. Duration is clamped above the platform minimum for very short inputs. Onsets land on the beat grid. Phrase entry never overlaps the previous phrase's exit. Higher BPM yields shorter duration, monotonically — a property worth asserting across a range of tempos rather than at one value.

**Renderer** (Vitest, no browser). Tested through a recording proxy standing in for the canvas context, capturing the ordered sequence of draw calls and state changes. Two assertions carry the weight: **the same `t` produces an identical call log across invocations**, and rendering a timeline at a shuffled sequence of timestamps produces the same per-`t` output as rendering it in order — which is what proves the renderer is stateless. Beyond that: text drawn always falls within the safe area, and every word in the timeline is drawn at some point across a full sweep. Snapshots are over the call log, which diffs readably, rather than over pixels, which do not.

**Capture** (Playwright, real browser). One end-to-end path: load the page, enter fixture text, render, assert a non-empty Blob whose reported duration is within tolerance of `timeline.durationMs` and whose mimeType is one of the negotiated set. Separately, assert format negotiation picks MP4 where the browser supports it. Separately, assert the double-press guard: pressing Render twice yields exactly one recording. These are slow and comparatively brittle, so the suite stays small and covers only what genuinely cannot be established without a browser.

No prior art in this repo — it is empty. These are the first tests, and they set the pattern.

## Out of Scope

- **Any timeline, layer panel, or keyframe editing.** The absence of an editor *is* the product. A "just let me nudge this one word" feature is the beginning of Canva.
- **Audio, music beds, and voiceover.** Licensing cost, upload weight, and the feed is muted anyway.
- **Aspect ratios other than 9:16.** 1:1 and 4:5 are plausible next steps and the preset model should not obstruct them, but nothing ships for them here.
- **ffmpeg.wasm and any offline encoder.** Explicitly deferred. The Capture interface leaves room; this scope does not fill it.
- **Posting to LinkedIn directly.** The deliverable is a file. API posting means OAuth, an app review, and a backend — all three contradict the no-server, no-account design.
- **Accounts, saved projects, render history.** Nothing persists but the last preset and tempo, in local storage.
- **AI-generated or rewritten copy.** Kinetic animates your words. It does not write them.
- **Custom font upload, custom palettes, brand kits.** Three presets. Preset four is a future object in a future array.
- **Image, logo, or video backgrounds.** Type on a background. That is the whole visual vocabulary.
- **Mobile-browser rendering.** The page should not be broken on a phone, but real-time canvas capture at 1080×1920 is not a promise mobile Safari can keep, and it is not being made.
- **Right-to-left script support.** Detect and say so honestly. Do not silently ship a wrong video.

## Further Notes

**The risk that decides the product** is real-time capture quality on modest hardware. Everything else has a workaround; this one does not, because it is load-bearing for the "video-length render" promise. Build Capture early, on a deliberately weak machine, with a long input, and measure dropped frames before the presets get any polish. If real-time capture cannot hold 30fps at 1080×1920, the honest responses are to drop to 720×1280 or to reopen the offline-encoder decision — and it is much cheaper to learn that on day one than after three presets are built on the assumption.

**The scorer is where the gasp lives.** It is the only part a competitor cannot trivially clone, and it is the difference between "template filler" and "it understood my sentence." It is also the part most likely to be under-invested because it is invisible when it works. Budget real time for tuning it against actual LinkedIn posts — a corpus of twenty or thirty real ones, checked by eye, will teach more than any amount of heuristic theorising.

**Font loading is the classic silent failure** in this pipeline. Canvas substitutes a fallback without error for a font that has not finished loading, so the preview looks right, the video looks wrong, and nothing anywhere reports a problem. Gate the first draw on fonts being ready and treat it as a correctness requirement, not a polish item.

**Two dogfooding tests** decide whether this is finished, and neither is a unit test. First: paste this PRD's problem statement in and see whether the emphasis lands where a person would put it. Second — the one that actually matters — use it to make the post announcing it. If that post takes longer than writing the text did, the premise has not been met yet, whatever the test suite says.
