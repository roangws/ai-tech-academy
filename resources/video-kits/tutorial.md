---
name: tutorial
description: Turn a screen recording of a talk, class, or demo into a finished, graphics-packaged video. Cuts the screen, webcam and microphone channels on one frame grid from a word-level transcript, then builds a HyperFrames composition with section cards, chips, panels, rings and counters. Use for ANY request to build, cut, edit or package a video in this project, including a bare "Build my video" or "set everything up for me" - the user is not expected to name this skill or know any step of the process. Also triggers on: cut my recording, edit my class, package my talk, screen studio, OBS, QuickTime, turn this lecture into a video, add graphics to my presentation recording.
---

# Class video

Build one finished class video from one recording.

## What this is

A long screen recording is three channels: the slide, the face, and the voice.
This skill cuts all three on ONE frame grid from a word-level transcript, then
draws a graphics layer over the top with a Python generator.

The rule that makes it work: **you only ever write two files by hand**,
`work/plan.py` (which sentences stay, what layout each beat uses) and
`work/build.py` (what graphics appear). Everything else is a generator.
`index.html` is output. Never edit it.

## Step zero: you do the setup, not the user

**Assume the user knows nothing about this pipeline and should never need to.**
They dropped their recording in `footage/` and pasted three sentences: what the
video is about, what people should remember, and their name. That is all they
were asked for. Everything else is yours.

Never ask them for a file path, a library, a flag, a font, or a tool name. Never
tell them to run a command. Run it.

```bash
python3 work/doctor.py       # what is installed, what is missing
python3 work/detect.py       # reads footage/, writes work/sources.json
python3 work/sync.py         # ONLY if detect.py says the channels differ
```

`doctor.py` prints the exact install command for anything missing. **Run those
commands for them**, then run `doctor.py` again until it prints `ready.`

`detect.py` probes every media file with ffprobe and works out which is the
screen, which is the camera, and which is the microphone. it does not care
which tool made them. Read its warnings out loud to the user; they matter:

| Tool | What you get | What it means |
| ---- | ------------ | ------------- |
| Screen Studio | screen, webcam, microphone, system audio as separate files, one start time | the best case, nothing to reconcile |
| OBS | one file per source, or one file with several audio tracks | both handled; set `audio_track` in `sources.json` to pick a track |
| QuickTime | usually one screen recording with the microphone inside it, often no webcam | works; see "No webcam" below |

Fonts need no action. The HyperFrames compiler fetches every font family named
in the CSS from Google Fonts and injects deterministic `@font-face` rules at
build time, caching them under `~/.cache/hyperframes/fonts`. `check` logs exactly
which faces it pulled. Run `python3 work/getfonts.py` only when the user wants
the project self-contained and renderable with no network; it drops the faces in
`assets/fonts/` and `buildlib` embeds them instead.

Then write `series.json` (their name as `presenter`), `meta.json` and `BRIEF.md`
from their three sentences. Fill in what you can infer; do not interview them.
Their "what people should remember" sentence becomes the `end_card` takeaway.

### Two devices, one take

One Screen Studio or OBS recording shares a start time across every channel and
needs no sync. **A phone filming the presenter plus a separate screen capture
does not.** They were started by hand, seconds apart. Cutting them on one grid
without correcting that puts every word out of sync for the whole video.

`detect.py` warns when channel lengths differ by more than 0.5s. When it does,
run `python3 work/sync.py` **before** `mkmedia.py`. It matches the loudness
envelope of each file against a reference and writes:

```json
"offsets": {"screen": -6.5}
```

The number is what you ADD to reference time to reach that file's own time, so a
file that started 6.5s late gets `-6.5`. `mkmedia.py` then cuts each channel on
its own shifted grid.

Read the confidence it prints. Above 40% is solid. Below that, extract one frame
from each source at the same corrected moment and confirm by eye before cutting
the whole video. If a channel has no sound at all it cannot be matched; say so
and set the offset by hand.

A phone camera is usually vertical and often 4K. `mkmedia.py` fills a 1920x1080
frame from the centre, so the presenter layouts get the 16:9 source they expect.
Tell the user their vertical footage is being centre-cropped.

### No webcam channel

`detect.py` sets `"cam": null` and warns. The build still works and produces a
slide-only video: no presenter card, no cutting to a face. In that mode
`planlib` refuses every presenter layout (`cam`, `pip`, `splitR`, `splitL`,
`cardpip`) with a clear error, `buildlib` omits the presenter element, and
`pipcheck.py` has nothing to measure and exits.

Tell the user once, plainly, that recording a camera next time gets them cuts to
their face and a presenter card. Do not nag, and do not refuse to build.

### Oversize source

Anything above 1080p is fitted down to 1920x1080 by `mkmedia.py`. A 4K source
kills long renders; a 1080p source upscales to 4K cleanly in the browser. Say so
once if the warning fires.

## Before you build

Read these four files in the project, in this order. Do not skip them.

1. `RULES.md`. the hard rules. Breaking one means a re-export.
2. `BRIEF.md`. what this particular class is.
3. `frame.md`. the house style: palette, type, motion, don'ts.
4. `work/sentences.txt`. the actual script. Read the whole thing.

Then read `references/pipeline.md` in this skill and follow it in order.

## The pipeline in one screen

```bash
# from the class root
python3 work/doctor.py                    # tools and libraries
python3 work/detect.py                    # footage/ -> work/sources.json
python3 work/sync.py                      # only when channels differ in length
python3 work/transcribe.py                # -> work/transcript.json  (local Whisper)
cd work && python3 sents.py && cd ..      # -> work/sentences.txt
python3 work/decktext.py                  # -> work/decktext.txt     (if a .pptx exists)
python3 work/slides.py                    # -> work/slidemap.txt + work/slideframes/

# --- you write work/plan.py here ---
cd work && python3 plan.py && cd ..       # -> work/plan.json  (cheap, iterate freely)
python3 work/pipcheck.py                  # face time + presenter-card corner
# settle BOTH of those before cutting media

python3 work/mkmedia.py                   # -> assets/*.mp4, assets/voice-final.wav
python3 work/uichk.py 6                   # both lines must read 0%

# --- you write work/build.py here ---
python3 work/build.py                     # -> index.html
npm run check                             # must be 0 errors
bash work/render.sh <OutputName>
cd work && python3 subs.py && cd ..       # -> renders/*.srt + chapters.txt
```

## The four gates

Do not move past a gate until it passes. Every gate exists because skipping it
cost a full re-export at least once.

| Gate | Command | Must say |
| ---- | ------- | -------- |
| No pops | `python3 plan.py` | `ok: zero speech cuts land on a large presenter` |
| Face time | `python3 work/pipcheck.py` | `no slide-only stretch is longer than 65s` |
| Clean capture | `python3 work/uichk.py 6` | both artefacts at `0%` |
| Composition | `npm run check` | 0 lint, runtime, layout, motion errors; contrast AA |

Plus one measurement before you render:

```bash
ffmpeg -hide_banner -nostats -i assets/voice-final.wav -af ebur128=peak=true -f null - 2>&1 | tail -8
```

About -14 LUFS integrated, true peak under -1.5 dBFS. If the peak is near 0,
re-run `python3 work/mkmedia.py --audio-only`.

## References

- `references/pipeline.md`. every step, with what to check and why.
- `references/buildlib-api.md`. everything you can draw.
- `references/troubleshooting.md`. every failure seen so far and its fix.
- `references/review.md`. the optional TwelveLabs critic pass and how to judge it.

## Judgement, not automation

Stop and show the user two things, and only these two: the **beat table**
after `plan.py`, and a handful of **extracted frames** before you call it done.
Everything else you decide and report. Keep both in plain language: they have
not read `RULES.md` and do not know what a `pip` beat is. They should not be asked about file
paths, library versions, or flags.

Three things the scripts cannot decide:

- **Which beat to promote to full frame.** Pick a moment where looking at the
  presenter helps: an opinion, a warning, a joke, a turn. Never the middle of a
  list being read out.
- **Whether a graphic earns its place.** When you are not sure, show the slide
  and let it play. A layout change every 20 to 40 seconds, not every 8.
- **Whether a critic's finding is real.** Extract the frame and look at it. A
  finding you can see is a defect. A finding you cannot see is noise. A finding
  that contradicts a rule in `RULES.md` loses, and the rule wins.
