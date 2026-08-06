#!/usr/bin/env python3
"""
Build the homepage's placeholder image set.

Two sources, no random stock photography:

  1. Real stills cropped from public/media/tutorial-2.mp4 for the lesson
     poster, the course-preview poster, the outcomes photo and Roan's
     portrait. These are on-brand because they are the actual course footage.

  2. Generated brand covers for the five learning paths and generated avatar
     tiles for the people we do not have photographs of yet. Both are drawn
     from the design tokens, so they read as a deliberate system rather than
     as mismatched stock.

Drop real photographs over any file in public/images/people/ using the same
filename and they will be picked up with no code change.

Usage:  python3 scripts/build-placeholders.py
"""

import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
PEOPLE = ROOT / "public/images/people"
SCENES = ROOT / "public/images/scenes"
PATHS = ROOT / "public/images/paths"
VIDEO = ROOT / "public/media/tutorial-2.mp4"

for d in (PEOPLE, SCENES, PATHS):
    d.mkdir(parents=True, exist_ok=True)

# Design tokens (kept in sync with src/app/globals.css).
INK = (16, 24, 32)
INK_MUTED = (92, 110, 127)
SURFACE = (255, 255, 255)
SURFACE_SUBTLE = (238, 243, 247)
LINE = (216, 225, 232)
ACCENT = (6, 108, 148)
CREST = (2, 177, 224)
CREST_TINT = (207, 237, 249)
DEEP = (8, 43, 58)

BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
REG = "/System/Library/Fonts/Supplemental/Arial.ttf"


def font(path, size):
    return ImageFont.truetype(path, size)


def centre(draw, box, text, f, fill):
    x0, y0, x1, y1 = box
    l, t, r, b = draw.textbbox((0, 0), text, font=f)
    draw.text((x0 + (x1 - x0 - (r - l)) / 2 - l, y0 + (y1 - y0 - (b - t)) / 2 - t), text, font=f, fill=fill)


def grab(seconds, out, crop=None, size=None):
    """Pull one frame from the tutorial footage."""
    tmp = out.with_suffix(".raw.jpg")
    subprocess.run(
        ["ffmpeg", "-v", "error", "-ss", str(seconds), "-i", str(VIDEO),
         "-frames:v", "1", "-q:v", "2", str(tmp), "-y"],
        check=True,
    )
    im = Image.open(tmp).convert("RGB")
    if crop:
        im = im.crop(crop)
    if size:
        im = im.resize(size, Image.LANCZOS)
    im.save(out, quality=88)
    tmp.unlink()
    print("frame ->", out.relative_to(ROOT))


def crest(draw, x, y, scale, ring=SURFACE):
    """The brand shield, drawn to the geometry in the logo package."""
    def p(px, py):
        return (x + px * scale, y + py * scale)

    draw.rounded_rectangle([p(8, 6), p(112, 96)], radius=26 * scale, fill=CREST)
    draw.pieslice([p(8, 26), p(112, 130)], 0, 180, fill=CREST)
    draw.polygon([p(55, 40), p(77, 92), p(33, 92)], fill=CREST_TINT)
    draw.rectangle([p(69, 40), p(87, 92)], fill=(255, 255, 255))


def avatar(name, initials, tint):
    """A person placeholder: flat tint, initials, hairline. 800x1000, 4:5."""
    w, h = 800, 1000
    im = Image.new("RGB", (w, h), tint)
    d = ImageDraw.Draw(im)
    r = 200
    box = (w / 2 - r, h / 2 - r, w / 2 + r, h / 2 + r)
    d.ellipse(box, fill=SURFACE)
    centre(d, box, initials, font(BOLD, 150 if len(initials) > 2 else 175), INK_MUTED)
    im.save(PEOPLE / name, quality=90)
    print("avatar ->", name)


def path_cover(name, letter, bg, fg):
    """
    A branded course cover, 1200x675.

    Deliberately text-free apart from the path letter: the card body already
    prints the title, and a centre-weighted composition survives any crop the
    grid asks for (16:9 in the standard card, 3:4 in the featured card).
    """
    w, h = 1200, 675
    im = Image.new("RGB", (w, h), bg)
    d = ImageDraw.Draw(im)

    # Quiet diagonal field, one step lighter than the ground. No gradient.
    for i in range(-4, 18):
        d.line([(i * 96, h + 40), (i * 96 + 340, -40)], fill=tuple(min(255, c + 10) for c in bg), width=2)

    cx, cy = w / 2, h / 2
    crest(d, cx - 60 * 1.15, cy - 118, 1.15)

    d.line([(cx - 34, cy + 62), (cx + 34, cy + 62)], fill=fg, width=3)

    im.save(PATHS / name, quality=90)
    print("cover  ->", name)


# --------------------------------------------------------------- real stills
grab(1.2, SCENES / "lesson-poster.jpg", size=(1280, 720))
grab(4.6, SCENES / "course-preview.jpg", size=(1280, 720))
# The team band takes a wide desk-level slice so it reads as a different
# moment from the two talking-head stills.
grab(0.4, SCENES / "team-band.jpg", crop=(0, 330, 1280, 690), size=(2100, 590))
# Square portrait crop for the lead instructor, taken from the same footage.
grab(1.2, PEOPLE / "roan-weigert.jpg", crop=(400, 20, 880, 620), size=(800, 1000))

def outcome_sheet():
    """
    A preview of the outcome sheet itself.

    The outcomes section is about an artifact, so it shows the artifact. The
    source footage is a single talking-head shot with no workstation frame in
    it, and a third crop of the same face read as filler. The numbers match
    the learner story on the same page.
    """
    w, h = 1200, 750
    im = Image.new("RGB", (w, h), SURFACE_SUBTLE)
    d = ImageDraw.Draw(im)

    px, py, pw = 40, 34, w - 80
    d.rounded_rectangle([px, py, px + pw, h - 34], radius=14, fill=SURFACE, outline=LINE, width=2)

    x = px + 56
    d.text((x, py + 46), "OUTCOME SHEET", font=font(BOLD, 22), fill=INK_MUTED)
    d.text((x, py + 86), "Weekly pipeline reporting", font=font(BOLD, 46), fill=INK)
    d.text((x, py + 148), "Path A  ·  Module 5  ·  Measured 14 days after launch",
           font=font(REG, 26), fill=INK_MUTED)
    d.line([(x, py + 200), (px + pw - 56, py + 200)], fill=LINE, width=2)

    rows = [("Time per cycle", "6 h 00", "0 h 40"), ("Manual steps", "23", "4"),
            ("People involved", "3", "1")]
    cy = py + 238
    d.text((x, cy), "MEASURE", font=font(BOLD, 17), fill=INK_MUTED)
    d.text((x + 520, cy), "BEFORE", font=font(BOLD, 17), fill=INK_MUTED)
    d.text((x + 740, cy), "AFTER", font=font(BOLD, 17), fill=ACCENT)
    cy += 40
    for label, before, after in rows:
        d.text((x, cy + 6), label, font=font(REG, 29), fill=INK)
        d.text((x + 520, cy + 6), before, font=font(REG, 29), fill=INK_MUTED)
        d.text((x + 740, cy + 6), after, font=font(BOLD, 29), fill=ACCENT)
        cy += 62
        d.line([(x, cy - 8), (px + pw - 56, cy - 8)], fill=LINE, width=1)

    d.rounded_rectangle([x, cy + 22, x + 330, cy + 84], radius=8, fill=(226, 242, 233))
    d.text((x + 24, cy + 42), "Deployment verified", font=font(BOLD, 27), fill=(15, 106, 75))

    im.save(SCENES / "outcome-review.jpg", quality=92)
    print("artifact ->  outcome-review.jpg")


outcome_sheet()

# ------------------------------------------------------------------- avatars
TINTS = [SURFACE_SUBTLE, (233, 240, 246), (236, 244, 248), (231, 238, 245),
         (238, 243, 247), (234, 241, 246), (237, 243, 248), (232, 239, 245),
         (235, 242, 247), (230, 238, 244)]

PEOPLE_LIST = [
    ("specialist-gtm.jpg", "GTM"),
    ("specialist-media.jpg", "MED"),
    ("specialist-infra.jpg", "INF"),
    ("board-revops.jpg", "RO"),
    ("board-post.jpg", "PP"),
    ("board-field.jpg", "FO"),
    ("board-platform.jpg", "PE"),
    ("board-smb.jpg", "SB"),
    ("board-learning.jpg", "LD"),
    ("learner-track-a.jpg", "TA"),
]
for i, (fn, initials) in enumerate(PEOPLE_LIST):
    avatar(fn, initials, TINTS[i % len(TINTS)])

# --------------------------------------------------------------- path covers
COVERS = [
    ("path-a.jpg", "PATH A", DEEP, (255, 255, 255)),
    ("path-b.jpg", "PATH B", (10, 58, 85), (255, 255, 255)),
    ("path-c.jpg", "PATH C", (12, 74, 96), (255, 255, 255)),
    ("path-d.jpg", "PATH D", (6, 62, 82), (255, 255, 255)),
    ("path-e.jpg", "PATH E", (14, 88, 112), (255, 255, 255)),
]
for args in COVERS:
    path_cover(*args)

print("\nDone. Replace any file in public/images/people/ with a real photograph")
print("using the same filename to swap it in.")
