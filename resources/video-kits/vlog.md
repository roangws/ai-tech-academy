---
name: vlog
description: Cut a day of loose camera clips into a story-driven vlog. Transcribes every clip, groups them into acts on the time gaps, picks the keeps, snaps cuts to word boundaries, adds keyword cards and B-roll cutaways over speech, and lays a ducked music bed under it. Use for ANY request to cut, edit or assemble a vlog, a day-in-the-life, a travel video, an event recap or a pile of camera clips, including a bare "edit my vlog" or "make a video from this footage" - the user is not expected to name this skill. Triggers on: vlog, day in the life, hackathon, travel video, event recap, cut my footage, lots of clips, GoPro, iPhone clips, YouTube video.
---

# Vlog

Many clips, one story.

## What makes this different from a talking-head edit

A vlog is not one recording with cuts taken out. It is 40 to 80 separate clips
shot over a day, most of them unusable, and the edit is mostly **selection**.
The work is: transcribe everything, find the story, and throw away 80 percent.

Three things carry a vlog, and all three are non-obvious:

1. **Acts come from the time gaps.** Sort clips by timestamp. A long gap between
   clips is a scene change in real life, so it is a scene change in the edit.
   One approved 7:42 vlog was 5 acts found exactly this way.
2. **B-roll plays over speech, it does not replace it.** A cutaway is a
   full-frame opaque overlay with its audio dropped. The voice underneath keeps
   running. This is what makes it feel edited rather than assembled.
3. **The ending is a turn, not a summary.** Find the one moment that reframes the
   day and hold it back. Cut a cold-open tease of it before the intro.

## Read first

1. `RULES.md`. hard rules.
2. `BRIEF.md`. what this day was.
3. `edit/project.md`. the running log. Append to it every session, never rewrite.

## The order, and why

```bash
python3 scripts/scan.py                 # inventory + gaps + dead-audio flags
python3 scripts/transcribe.py           # EVERY clip, local Whisper
python3 scripts/build_edl.py            # keeps -> word-snapped ranges -> edl.json
python3 scripts/anchors.py snapshot     # pin overlays to SOURCE moments
python3 scripts/make_cards.py           # ProRes 4444 alpha cards
python3 scripts/make_broll.py           # cutaways as opaque overlays
python3 scripts/render.py               # picture only, from edl_base.json
python3 scripts/composite.py            # remap overlays to REAL durations
python3 scripts/mix_music.py            # duck + loudnorm
```

**Never trust EDL seconds for overlay placement.** Frame rounding drifts: one
edit planned 461.78s and rendered 463.42s, a 1.64s error that put every card in
the wrong place. `composite.py` measures the real segment durations off disk and
remaps every overlay and music region to true time. This is the single most
expensive lesson in the whole pipeline.

**Transcribe everything, including what looks like B-roll.** A classifier that
skips "silent" clips will drop clips that are full of speech. Two clips were
missed that way on a real edit. Whole-day transcription is cheap.

## References

- `references/pipeline.md`. every step in detail, with the numbers.
- `references/story.md`. finding the acts, the cold open, the turn.
- `references/gotchas.md`. every failure seen, and its fix.

## Judgement

Show the user the **act outline and the keep list** before cutting anything, and
the **draft** before the final render. They give notes by timestamp after
watching; work through them in order and log each one in `edit/project.md`.

Expect five or six passes. That is normal and it is where the video gets good.
