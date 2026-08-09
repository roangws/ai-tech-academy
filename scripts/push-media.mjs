/**
 * Push course media from a local folder into Supabase Storage.
 *
 * ------------------------------------------------------------------ why a script
 *
 * `src/` has no service-role client and is not getting one: every LMS read and
 * write goes through the caller's own session so that a policy bug is a policy
 * bug rather than a total bypass. Uploading course media is an authoring act
 * done from a laptop, not a request served to a reader, so it belongs out here
 * with scripts/seed-catalog.mjs, which already runs on exactly this pattern.
 *
 * The admin console gets its own upload path later, going through an
 * authenticated admin's client and the `course_media_write` policy. This stays
 * useful regardless: it is how you push forty podcast episodes without doing
 * forty things in a browser.
 *
 * ------------------------------------------------------------------------ usage
 *
 *   node --env-file=.env.local scripts/push-media.mjs
 *   node --env-file=.env.local scripts/push-media.mjs --dry
 *
 * Put files under `media/` in the repo root, mirroring the storage layout:
 *
 *   media/audio/gtm/04-account-brief.mp3      -> course-media (public)
 *   media/posters/gtm/04-account-brief.jpg    -> course-media (public)
 *   media/docs/gtm/04-account-brief-worksheet.pdf -> course-docs (private)
 *
 * `media/` is gitignored: audio does not belong in git, and a repo that grows by
 * 40MB an episode stops being clonable.
 *
 * The paths it prints are exactly what goes in `lesson_blocks.payload.path`.
 * Nothing here writes to the database — attaching a file to a lesson is a
 * separate, deliberate act.
 *
 * --------------------------------------------------------------- what it checks
 *
 * The bucket's own `file_size_limit` and `allowed_mime_types` will reject a bad
 * upload, but they do it from inside the Storage API with an error about a MIME
 * type, several seconds into a 50MB transfer. Checking here means the answer is
 * a sentence about your file, immediately — the same argument
 * src/app/actions/profile.ts makes about the avatar limit.
 */

import { createClient } from "@supabase/supabase-js";
import { readdir, stat, readFile } from "node:fs/promises";
import { join, extname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const MEDIA = join(ROOT, "media");

/** Mirrors the bucket definitions in the course_media_buckets migration. */
const ROUTES = {
  audio: { bucket: "course-media", types: { ".mp3": "audio/mpeg", ".m4a": "audio/mp4" } },
  posters: {
    bucket: "course-media",
    types: { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".png": "image/png" },
  },
  docs: {
    bucket: "course-docs",
    types: {
      ".pdf": "application/pdf",
      ".md": "text/markdown",
      ".csv": "text/csv",
      ".txt": "text/plain",
      ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    },
  },
};

/* Matches the project-wide upload cap, which clamps the bucket setting. A bigger
   number in the migration would be a promise the platform does not keep. */
const MAX_BYTES = 52428800;

const dry = process.argv.includes("--dry");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Missing credentials. This needs the service-role key, because the storage\n" +
      "write policies require an admin or an assigned instructor and a script has\n" +
      "neither.\n\n" +
      "  node --env-file=.env.local scripts/push-media.mjs\n",
  );
  process.exit(1);
}

/** Every file under media/, as a storage path relative to it. */
async function walk(dir, base = dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full, base)));
    else out.push(relative(base, full).split(sep).join("/"));
  }
  return out;
}

const files = await walk(MEDIA);

if (files.length === 0) {
  console.log(`Nothing in ${relative(ROOT, MEDIA)}/. Layout:\n` +
    "  media/audio/<courseId>/<file>.mp3\n" +
    "  media/posters/<courseId>/<file>.jpg\n" +
    "  media/docs/<courseId>/<file>.pdf");
  process.exit(0);
}

const db = createClient(url, key, { auth: { persistSession: false } });

let pushed = 0;
let skipped = 0;

for (const path of files) {
  const [kind, courseId, ...rest] = path.split("/");
  const route = ROUTES[kind];

  if (!route || !courseId || rest.length === 0) {
    console.warn(`! skip  ${path}\n        expected <audio|posters|docs>/<courseId>/<file>`);
    skipped += 1;
    continue;
  }

  const ext = extname(path).toLowerCase();
  const contentType = route.types[ext];
  if (!contentType) {
    console.warn(
      `! skip  ${path}\n        ${ext || "no extension"} is not allowed in ${route.bucket}; ` +
        `allowed: ${Object.keys(route.types).join(" ")}`,
    );
    skipped += 1;
    continue;
  }

  /* The CHECK constraint on lesson_blocks.payload will reject a path this script
     was happy to upload, which would leave an orphan in the bucket that nothing
     references. Cheaper to say so here. */
  if (!/^[a-z0-9._-]+$/.test(rest.join("/"))) {
    console.warn(
      `! skip  ${path}\n        filename must be lowercase [a-z0-9._-] to satisfy the ` +
        `lesson_blocks payload constraint`,
    );
    skipped += 1;
    continue;
  }

  const full = join(MEDIA, path);
  const { size } = await stat(full);
  if (size > MAX_BYTES) {
    console.warn(
      `! skip  ${path}\n        ${(size / 1048576).toFixed(1)}MB exceeds the ${MAX_BYTES / 1048576}MB ` +
        `project upload limit. Re-encode, or raise the limit in the dashboard first.`,
    );
    skipped += 1;
    continue;
  }

  if (dry) {
    console.log(`  would push ${route.bucket.padEnd(12)} ${path}  (${(size / 1048576).toFixed(1)}MB)`);
    pushed += 1;
    continue;
  }

  const { error } = await db.storage
    .from(route.bucket)
    .upload(path, await readFile(full), { contentType, upsert: true });

  if (error) {
    console.error(`✗ ${path}\n  ${error.message}`);
    process.exit(1);
  }

  console.log(`✓ ${route.bucket.padEnd(12)} ${path}  (${(size / 1048576).toFixed(1)}MB)`);
  pushed += 1;
}

console.log(
  `\n${dry ? "would push" : "pushed"} ${pushed}, skipped ${skipped}.\n` +
    "Paths above go straight into lesson_blocks.payload.path — nothing here writes\n" +
    "to the database, because attaching a file to a lesson is a separate decision.",
);
