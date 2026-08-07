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
  { src: `${HOME}/Downloads/berkeley-university-logo-png_seeklogo-322154.png`, out: "berkeley.png" },
  // The app icon is square and its dark ground is part of the mark, so it is
  // resized but never trimmed: trimming would eat the rounded corners.
  { src: `${HOME}/Downloads/n_aaible_logo.jpeg`, out: "n-aible.png", keepBox: true },
];

await mkdir(OUT, { recursive: true });

for (const { src, out, density, keepBox } of LOGOS) {
  let img = sharp(src, density ? { density } : undefined);

  if (!keepBox) {
    // Trim whatever the file uses as its own background, transparent or white.
    img = img.trim({ threshold: 12 });
  }

  const buf = await img
    .resize({ height: HEIGHT, fit: "inside", withoutEnlargement: false })
    .png({ compressionLevel: 9 })
    .toBuffer();

  await sharp(buf).toFile(join(OUT, out));
  const { width, height } = await sharp(join(OUT, out)).metadata();
  console.log(`${out.padEnd(16)} ${width}x${height}`);
}
