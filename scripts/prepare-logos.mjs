#!/usr/bin/env node
/**
 * Normalise supplied employer marks into one set the roster can render.
 *
 *   node scripts/prepare-logos.mjs
 *
 * Logos arrive in whatever shape their owner ships them, and four arrived in
 * four: a 2152x314 SVG typemark, a 2560x764 PNG wordmark, a 200x200 JPEG app
 * icon, and a 320x320 PNG whose wordmark occupies about 40% of its own canvas
 * and floats in transparent padding.
 *
 * Rendered at a common CSS height that last one comes out roughly six pixels
 * tall while the others come out eighteen, so the card would be showing four
 * marks at four sizes and one of them illegible. The fix belongs in the asset,
 * not in a per-logo class in the component: trim every file to the box its own
 * ink actually occupies, then resize all of them to one height. After that a
 * single `h-[18px] w-auto` is correct for every mark, whatever its canvas was.
 *
 * Output is PNG with alpha at 2x, so the marks sit on the light chip the cards
 * draw behind them without carrying a white rectangle of their own.
 *
 * `sharp` comes with Next, so this adds no dependency.
 */
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public/images/logos");
const HOME = process.env.HOME;

/** Rendered at 18px tall in the card, so 36 is the 2x source. */
const HEIGHT = 36;

const LOGOS = [
  { src: `${HOME}/Downloads/orange-typemark.svg`, out: "coderabbit.png", density: 600 },
  { src: `${HOME}/Downloads/BAYHAUS-Creative-logo-scaled.png`, out: "bayhaus.png" },
  // The app icon is square and its dark ground is part of the mark, so it is
  // resized but never trimmed: trimming would eat the rounded corners.
  { src: `${HOME}/Downloads/n_aaible_logo.jpeg`, out: "n-aible.png", keepBox: true },

  /*
    The two community partners, added 9 Aug.

    Both break the 36px rule above, and it is the same break for two different
    reasons: neither is only a roster mark any more. The partner band renders a
    lockup at 26px and a square mark at 44, on cards that are 600px wide, so a
    36px-tall source is under-resolution at 1x and visibly soft at 2x. They ship
    at a height that serves the largest place each one is drawn.

    The AI Collective's file is also the one on Liz Zhang's board card, which
    still asks for 18px. Downscaling is free and upscaling is not, so one
    high-resolution file serves both.
  */
  {
    src: `${HOME}/Downloads/692db3b0a2a851c307e344f2_AI Collective Logo with words (transparent).png`,
    out: "ai-collective.png",
    height: 120,
  },
  /*
    THE LOCKUP, NOT THE APP ICON, replaced 9 Aug on Roan's instruction.

    This was fetched from https://www.multimodalsociety.com/assets/logo.png —
    the 256px square their own header renders — and that file is a black-grounded
    icon, so it needed `keepBox` and a full-bleed treatment in the card, and the
    organisation's name had to be set in type beside it.

    Roan supplied the real lockup: mark plus "THE MULTIMODAL SOCIETY" in one
    4000x913 file with a transparent ground. It reads its own name, so it is now
    the same kind of object as The AI Collective's and gets the same treatment —
    trimmed, alpha, on the light chip, with nothing set beside it. `keepBox` is
    gone with the square, and so are `setNameInType` and `markHasOwnGround` in
    content.ts.

    120 tall for the same reason The AI Collective's is: this file serves the
    partner band at 26px and Liz Zhang's board card at 18, and downscaling is
    free where upscaling is not.
  */
  {
    src: `${HOME}/Downloads/multimodal-society-lockup-on-light.png`,
    out: "multimodal-society.png",
    height: 120,
  },
];

await mkdir(OUT, { recursive: true });

for (const { src, out, density, keepBox, height = HEIGHT } of LOGOS) {
  /* A published URL is as valid a source as a download, and fetching it keeps
     the provenance in this file instead of in somebody's Downloads folder. */
  const input = src.startsWith("https://")
    ? Buffer.from(await (await fetch(src)).arrayBuffer())
    : src;

  let img = sharp(input, density ? { density } : undefined);

  if (!keepBox) {
    // Trim whatever the file uses as its own background, transparent or white.
    img = img.trim({ threshold: 12 });
  }

  const buf = await img
    .resize({ height, fit: "inside", withoutEnlargement: false })
    .png({ compressionLevel: 9 })
    .toBuffer();

  await sharp(buf).toFile(join(OUT, out));
  /* Not `{ width, height }`: `height` is the loop's own binding above, and
     destructuring it here is a TDZ error rather than a shadow. */
  const written = await sharp(join(OUT, out)).metadata();
  console.log(`${out.padEnd(20)} ${written.width}x${written.height}`);
}
