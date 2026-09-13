---
name: micro-drama
description: Build a serialised vertical micro-drama - a soap-opera style Reels series with recurring characters, a family injustice, and a cliffhanger every episode. Generates a character bible as reference images, then every scene as a video clip keyed to those references, and stitches each episode. Use for ANY request to make a series, a Reels novela, a micro-drama, a recurring-character short, or episodic vertical content, including a bare "make me a series" - the user is not expected to name this skill. Triggers on: series, episodes, novela, telenovela, micro drama, soap opera, recurring characters, Reels series, cliffhanger, season, character bible.
---

# Micro-drama

A serialised vertical drama with characters people come back for.

## Why this format

Measured against a week of the top ten AI Reels in one market, four of the top
ten were the same thing: **serialised family injustice**. The top one did 7.1M
views on a 205k-follower account. The format carries, not the channel.

The skeleton all four shared:

1. **The injustice is said out loud in the first 2 seconds.** Not implied. Said.
2. **The villain is inside the family.** A mother, a stepmother, a spouse. The
   betrayal is by someone who should love them.
3. **The protagonist is despised and deserves to win.** The viewer takes a side.
4. **The characters are not human.** Anthropomorphic: fruit, animals, objects
   with a face. This does two jobs. It makes a heavy subject watchable, and it
   is instant visual identity you own outright, with no likeness risk.
5. **The cut lands mid-story.** The comments fill with "part 2". A comment is the
   most valuable signal you can get.
6. **The moral is stated.** People share it to teach someone. Grandparents tag
   grandchildren.

A second, lighter format also works and should be mixed in: **one character
dancing**, no dialogue, 20 to 30 seconds, on a loop. One such clip did 1.7M
views and 89k shares. It builds love for a character, which feeds the drama.

Post order: drama, drama, dance, drama, drama, dance. The dances bring new
people in; the drama keeps them.

## Consistency is a literal string

There is no character memory between generations. A character is consistent
because **the same literal description appears in every single prompt**, word for
word, alongside a reference image. Write the cast once in `cast/cast.json` and
never paraphrase it.

## The order

```bash
python3 scripts/cast.py            # character bible -> cast/*.png reference sheets
python3 scripts/episode.py ep01    # episodes/ep01/spec.json -> clips
python3 scripts/qa.py ep01         # frames from every clip, checked before stitching
python3 scripts/stitch.py ep01     # clips -> one episode
```

## Read first

1. `RULES.md`. hard rules, especially about faces and delivery.
2. `SERIES.md`. the cast, the arc, the moral.

## References

- `references/format.md`. episode structure, hooks, cliffhangers, the moral.
- `references/generation.md`. prompt shape, reference images, what breaks.
- `references/gotchas.md`. every failure seen, and its fix.

## Judgement

Show the user the **cast sheets** before generating any episode, and the
**frames** of every clip before stitching. A character that comes out wrong in
episode 1 is wrong for the whole season.
