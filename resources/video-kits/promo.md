---
name: promo
description: Build a short vertical social ad that stops the scroll. Opens as ordinary phone footage, breaks into something impossible on the music drop, then cuts on the beat to a lockup. Generates every shot with an AI video model, ranks candidates for realism, and assembles on a BPM grid. Use for ANY request to make an ad, a promo, a commercial, a paid social creative or a product teaser, including a bare "make me an ad" - the user is not expected to name this skill. Triggers on: ad, advert, promo, commercial, creative, paid social, Reels ad, TikTok ad, product teaser, launch clip, hook, scroll stopper.
---

# Promo

A 20 to 30 second vertical ad that survives the scroll.

## The structure that works

**The viral trap.** The first seconds must look like a video someone actually
shot on a phone. No music, no titles, no branding, just diegetic sound. Then at
the drop, reality breaks. The viewer's thought is "wait, is this AI?" and that
question is the engagement.

```
0.0 - 2.6    THE TRAP      ordinary phone footage, diegetic audio only, no music
2.6          THE BREAK     music enters ON the drop, the impossible happens
2.6 - 10     ESCALATE      surreal shots, cut on the beat
10 - 14      BREAKDOWN     the offer, in words, over a dimmed scene
14 - 21      RAPID FIRE    one impossible shot every two beats
21 - 24.5    SLAMS         three short lines, then the payoff line
24.5 - 28    LOCKUP        logo, domain, call to action
```

Research behind it: normal, then impossible scale, then "is this AI?". The trap
is what buys the next 25 seconds.

## Everything is on the beat

Pick the music first. Find its BPM and the exact second of the drop. Every cut,
every word, every flash lands on `beat(k) = drop + k * 60/BPM`.

A worked grid from a delivered ad: drop at 2.6s, BPM 125.95, so
`b(k) = 2.6 + k * 0.4764`. Cuts at b6, b10, b8, b5x2, b43. Nothing is placed at
a round number.

## Read first

1. `RULES.md`. hard rules, including the ones about faces and text.
2. `BRIEF.md`. the product, the offer, the language.
3. `frame.md`. type, colour, motion.

## The order

```bash
python3 scripts/beats.py <bpm> <drop>        # print the grid, plan against it
python3 scripts/gen_shots.py                 # specs/*.json -> clips/*.mp4
python3 scripts/rank.py cold-open <a> <b>    # pick the opener on realism
python3 scripts/frames.py clips/*.mp4        # QA every clip before assembling
# author index.html against the grid
npm run check && npm run render
python3 scripts/critic.py renders/out.mp4 qa/prompt.txt qa/pass1.md   # optional
```

## References

- `references/shots.md`. how to write a prompt that generates a usable shot.
- `references/assembly.md`. the beat grid, audio ducking, text over motion.
- `references/gotchas.md`. every failure seen, and its fix.

## Judgement

Generate **two candidates for the cold open** and rank them for realism before
committing. The opener carries the whole ad: one delivered spot scored its two
options 9/10 and 8/10 on realism, and the difference was visible.

Show the user the cold-open candidates and the beat plan. Everything else you
decide.
