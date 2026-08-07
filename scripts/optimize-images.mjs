#!/usr/bin/env node
/**
 * Turn the generator's output into files a homepage can actually ship.
 *
 *   node scripts/optimize-images.mjs
 *
 * The model returns 2K PNGs at 7MB each. Thirty-five megabytes of cover art on
 * a page whose whole argument is that it respects the reader's time is not a
 * trade worth making, and nothing on this page displays them anywhere near
 * their native size: the widest a path cover is ever drawn is about 420 CSS
 * pixels, and a roster portrait is 48 to 56.
 *
 * So each group is resized to twice its largest drawn size and written as JPEG,
 * and the PNG is deleted. Everything here is regenerable from the prompts in
 * generate-images.mjs, so the source files are not worth keeping.
 *
 * Uses `sips`, which ships with macOS, to avoid adding an image dependency to a
 * project that needs one exactly here.
 */
import { execFile } from "node:child_process";
import { readdir, stat, unlink } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const GROUPS = [
  // Covers: drawn at 420px wide at most, so 1400 leaves room for a 2x display
  // and for the featured card's portrait crop, which uses the full height.
  { dir: "public/images/paths", max: 1400, quality: 72 },
  { dir: "public/images/scenes", max: 1600, quality: 74 },
  // Portraits: drawn at 48 to 56px in a circle. 240 is already generous.
  { dir: "public/images/placeholders", max: 240, quality: 80 },
];

let before = 0;
let after = 0;

for (const group of GROUPS) {
  const dir = join(ROOT, group.dir);
  let files;
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith(".png"));
  } catch {
    continue;
  }

  for (const file of files) {
    const src = join(dir, file);
    const out = src.replace(/\.png$/, ".jpg");

    before += (await stat(src)).size;
    await run("sips", [
      "-s", "format", "jpeg",
      "-s", "formatOptions", String(group.quality),
      "-Z", String(group.max),
      src, "--out", out,
    ]);
    await unlink(src);

    const size = (await stat(out)).size;
    after += size;
    console.log(`${group.dir}/${file.replace(/\.png$/, ".jpg")}  ${(size / 1024).toFixed(0)}kb`);
  }
}

if (before) {
  console.log(
    `\n${(before / 1e6).toFixed(1)}MB -> ${(after / 1e6).toFixed(1)}MB ` +
      `(${(100 - (after / before) * 100).toFixed(0)}% smaller)`,
  );
}
