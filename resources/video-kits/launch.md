---
name: launch
description: Build a short launch film for a product, a tool, a plugin or a feature. A voiceover-led, designed piece that shows the problem, lands the product, gives the specs and ends on a lockup, built as a HyperFrames composition with generated narration and music. Use for ANY request to make a launch video, a product film, a demo, a release video, a feature announcement or a README video, including a bare "make a video for my tool" - the user is not expected to name this skill. Triggers on: launch video, product film, demo video, release, announcement, show off my tool, README video, plugin demo, feature video, keynote.
---

# Launch

A 20 to 30 second film that makes a small thing feel like a release.

## The structure

Five acts. Each is a gear change. The film gets faster, breaks, then composes
itself again.

| Act | Job |
| --- | --- |
| I. THE PROBLEM | Set the trap. Show the pain happening, not described. |
| II. THE REVEAL | The product lands. |
| III. THE SPECS | The numbers, fast. |
| IV. THE BREAK | The thing that makes it human, or funny, or real. |
| V. THE LOCKUP | Compose again. Name, install line, done. |

## The two things that make it work

**Demo, not poster.** The single biggest note on a real launch film was "it
doesn't look like an app". The fix was to stop describing the product and show
it running: a real window with traffic lights, a path, a prompt, a caret,
spinners resolving into ticks, a footer with a live connection dot and a counter
that climbs. The first and last acts became the product actually working.

**The hole.** Put a beat of nothing where the pain is. No voice, no music, no
motion. On a delivered film that hole is 1.15 seconds and it is the best moment
in it. Silence is the only way to show "nothing happened".

## Nothing holds still

The second big note was "not enough movement". Every element got a slow
continuous motion: a push on the whole frame, a drifting grid, a floating
window, a climbing counter, a sweeping row highlight, breathing rings, turning
diagrams. Nothing in the frame is static, and nothing moves fast.

## Read first

1. `BRIEF.md`. the product, the facts, the non-negotiables.
2. `frame.md`. colour, type, grid, motion, bans.
3. `SCRIPT.md`. the voiceover with measured timings.

## The order

```bash
python3 scripts/voice.py options     # 3 candidate voices, listen, pick one
python3 scripts/voice.py lines       # one API call PER LINE
python3 scripts/music.py             # the bed
python3 scripts/mix.py               # build the timed audio track
# author index.html against SCRIPT.md timings
npm run check && npm run render
python3 scripts/critic.py renders/out.mp4 qa/prompt.txt qa/pass1.md   # optional
```

## References

- `references/script.md`. writing and timing the voiceover.
- `references/design.md`. the editorial system, and why it is not a slide deck.
- `references/gotchas.md`. every failure seen, and its fix.

## Judgement

Generate three voice candidates and let the user pick. The read makes or breaks
this: it has to be sincere, because a knowing delivery kills the whole thing.

Show them the voice options and the first render. Everything else you decide.
