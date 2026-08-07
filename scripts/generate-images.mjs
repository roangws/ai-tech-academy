#!/usr/bin/env node
/**
 * Image generation against GMI Cloud's inference queue.
 *
 *   node scripts/generate-images.mjs           # only what is missing
 *   node scripts/generate-images.mjs --force   # redraw everything
 *   node scripts/generate-images.mjs paths     # one group: paths | people
 *
 * The key lives in .env as `gmi-api-key` and .env is gitignored. Nothing here
 * writes the key anywhere, and the generated files are the only output.
 *
 * Two groups, and they follow different rules on purpose.
 *
 * `paths` are photographs of the work each path is about. They depict a kind of
 * job rather than a named individual, which is what a catalog cover is for, and
 * every one of them sits under that path's own hue as a scrim so the five
 * covers stay distinguishable at a glance and the text on top keeps its
 * contrast.
 *
 * `people` are portrait placeholders for seats on the instructor roster and the
 * review board, and they are deliberately NOT photographs. Those seats belong to
 * real practitioners whose names and employers have not cleared yet. A
 * photorealistic face in that slot asserts that a specific person exists and
 * reviewed this curriculum, which is the imagery version of invented copy and
 * the exact failure this project has already corrected once. Warm illustrated
 * figures read as a person pending without claiming one, and illustration is
 * also the more faithful reading of the humanist direction in the brief.
 */
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ENDPOINT = "https://console.gmicloud.ai/api/v1/ie/requestqueue/apikey/requests";
const MODEL = "gemini-3-pro-image";

/**
 * One shared direction string, appended to every prompt.
 *
 * The reference points are Anthropic's and OpenAI's editorial photography: real
 * people at real work in real rooms, warm and slightly imperfect, lit by
 * whatever light the room actually has. What it rules out is the stock-library
 * register this brief keeps away from, which is glossy, evenly lit, blue-tinted
 * and populated by people pretending to have a meeting.
 */
const LOOK = [
  "Shot on 35mm film, natural available light, warm and slightly muted colour,",
  "gentle grain, shallow depth of field, candid documentary framing, unposed,",
  "genuine expression, lived-in real workspace with everyday clutter,",
  "no text, no logos, no watermarks, no user interface overlays.",
  "Editorial photography, not stock photography: avoid glossy corporate lighting,",
  "avoid blue tint, avoid staged handshakes, avoid people pointing at screens together.",
].join(" ");

/**
 * Scene photographs that are not path covers. Same rule as the covers: these
 * show a kind of work, not a person the page will name.
 */
const SCENES = [
  {
    // Portrait, not landscape. The first version was 4:3 and the teams panel
    // runs it as a tall column beside the copy, so the crop had to throw away
    // two thirds of the width: three people spread along a table became one
    // person sliced by the panel edge, in a band that is about a group. A
    // vertical composition is the fix, because the frame then has the shape of
    // the slot it lives in and nothing has to be cut to fit.
    id: "team-session",
    aspect: "3:4",
    prompt:
      "Vertical composition. Three colleagues around the corner of a table in a " +
      "bright office, seen from slightly above, stacked in the frame rather than " +
      "in a row: one in the foreground leaning over an open laptop, two behind " +
      "mid-conversation. Relaxed and unhurried, warm daylight from a tall window " +
      "on one side.",
  },
];

const PATHS = [
  {
    id: "gtm",
    aspect: "4:5",
    prompt:
      "A woman in her late thirties sitting sideways on a desk in a bright open-plan " +
      "office, laptop balanced on her knees, mid-laugh at something off camera, " +
      "coffee cup and scribbled notes beside her, big windows behind her.",
  },
  {
    id: "media",
    aspect: "16:9",
    prompt:
      "A video editor in a dim edit suite lit mostly by their monitors, leaning back " +
      "in the chair with headphones round their neck, half smiling, shelves of drives " +
      "and a mug behind them.",
  },
  {
    // Path C was field operations and is now AI literacy, ethics and data
    // compliance, so the cover changed subject with it. One of the two calm
    // ones: four of the five covers came back mid-laugh, and a row of five
    // people laughing the same way stops reading as candid and starts reading
    // as a stock set. This one and `starter` carry an easy half-smile instead.
    id: "literacy",
    aspect: "16:9",
    prompt:
      "Two colleagues sitting across a table in a bright meeting room, printed " +
      "pages and an open laptop between them, mid-conversation, one listening " +
      "with a hand resting on the table and a calm half-smile, glass partition " +
      "and daylight behind them.",
  },
  {
    id: "infra",
    aspect: "16:9",
    // Redrawn once. The first version put the subject side-on to a monitor in a
    // dim room, and against the other four covers it read as the one with
    // nobody in it: a dark rectangle with a shape in front of a screen. The
    // brief for this set is people, so this one turns them toward the room and
    // gives the room a window.
    prompt:
      "A platform engineer in their thirties turned away from a desk of monitors to " +
      "face the room, leaning back with arms folded and laughing at a colleague out " +
      "of frame, daylight from a window to one side, plants and stickers and a " +
      "mechanical keyboard on the desk behind them.",
  },
  {
    id: "starter",
    aspect: "16:9",
    // The second calm one. See the note on `industry`.
    prompt:
      "A small business owner behind the counter of their own shop in the morning, " +
      "laptop open next to the till, sleeves rolled up, pausing to look at the " +
      "camera with a warm, quiet, closed-mouth smile, one hand resting on the " +
      "counter. Warm daylight through the shopfront. Composed, not laughing.",
  },
];

/**
 * Portrait placeholders. Same illustration language for all nine so the two
 * rosters read as one system, with the palette varying by the path each seat
 * serves. The brief is a figure, not a likeness: no rendered facial features,
 * because a face is the part that would start claiming a specific person.
 */
/*
  Full-bleed is the load-bearing instruction here, and the first version left it
  implicit.

  Asking for "generous negative space, centred composition, no border" produced
  a figure matted like a print: every one came back with a pale paper margin on
  all four sides. That is invisible on a 56px avatar and impossible to hide once
  the illustration became the whole card, where `object-cover` filled the tile
  with the margin and drew a light border down both edges of a dark panel.

  So the framing is now stated the way the render has to be built rather than
  the way it should look: the background colour reaches all four edges, and the
  words "poster", "print" and "paper" are named as things to avoid, since those
  are what the model was reaching for.
*/
const ILLUSTRATION = [
  "A warm minimal editorial illustration of a single human figure, head and shoulders,",
  "seen from the front, rendered in soft flat shapes with a light grain,",
  "featureless face with no eyes, nose or mouth, calm and friendly posture,",
  "hand-drawn quality, subtle risograph texture.",
  "Full bleed: the background colour fills the entire frame and runs off all four edges.",
  "The figure is centred and fills most of the height, cropped at the chest.",
  "No paper margin, no white border, no frame, no mat, no drop shadow, no text, no logos.",
  "This is a full-bleed graphic, not a poster or a print photographed on paper.",
].join(" ");

const PEOPLE = [
  { id: "seat-gtm", palette: "deep teal blue background with warm sand and terracotta figure" },
  { id: "seat-media", palette: "deep plum background with warm apricot and cream figure" },
  { id: "seat-industry", palette: "deep forest green background with warm oat and clay figure" },
  { id: "seat-infra", palette: "deep navy background with warm buff and rust figure" },
  { id: "seat-starter", palette: "warm brick background with cream and soft ochre figure" },
  { id: "seat-learning", palette: "slate grey background with warm cream and muted amber figure" },
  { id: "specialist-gtm", palette: "deep teal blue background with warm sand and terracotta figure" },
  { id: "specialist-media", palette: "deep plum background with warm apricot and cream figure" },
  { id: "specialist-infra", palette: "deep navy background with warm buff and rust figure" },
  { id: "specialist-literacy", palette: "deep forest green background with warm oat and clay figure" },
];

async function key() {
  const env = await readFile(join(ROOT, ".env"), "utf8");
  const line = env.split("\n").find((l) => l.startsWith("gmi-api-key="));
  if (!line) throw new Error("gmi-api-key missing from .env");
  return line.slice("gmi-api-key=".length).trim();
}

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * One request. The endpoint holds the connection open for the 15 to 30 seconds
 * the model takes and answers with the PNG inline as base64, so there is no job
 * to poll, but a request that long does drop: the first run lost four of
 * fourteen to `fetch failed` and `terminated`, which is the socket going rather
 * than the model refusing. Hence the retry around it, with a longer timeout than
 * the default and a pause between attempts.
 */
async function generate(token, { prompt, aspect, size = "2K" }, attempts = 4) {
  let last;

  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          payload: { prompt, image_size: size, aspect_ratio: aspect },
        }),
        signal: AbortSignal.timeout(180_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);

      const json = await res.json();
      if (json.status !== "success") throw new Error(`status ${json.status}`);

      const parts = json.outcome?.candidates?.[0]?.content?.parts ?? [];
      const inline = parts.find((p) => p.inlineData?.data)?.inlineData;
      if (!inline) throw new Error(`no image: ${JSON.stringify(json).slice(0, 200)}`);

      return Buffer.from(inline.data, "base64");
    } catch (err) {
      last = err;
      if (i < attempts) {
        process.stdout.write(`  retry ${i}/${attempts - 1} after ${err.message}\n`);
        await new Promise((r) => setTimeout(r, 4000 * i));
      }
    }
  }

  throw last;
}

async function run() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const only = args.find((a) => !a.startsWith("--"));
  const token = await key();

  const jobs = [];

  if (!only || only === "paths") {
    for (const p of PATHS) {
      jobs.push({
        file: join(ROOT, "public/images/paths", `${p.id}.png`),
        prompt: `${p.prompt} ${LOOK}`,
        aspect: p.aspect,
      });
    }
  }

  if (!only || only === "scenes") {
    for (const s of SCENES) {
      jobs.push({
        file: join(ROOT, "public/images/scenes", `${s.id}.png`),
        prompt: `${s.prompt} ${LOOK}`,
        aspect: s.aspect,
      });
    }
  }

  if (!only || only === "people") {
    for (const p of PEOPLE) {
      jobs.push({
        file: join(ROOT, "public/images/placeholders", `${p.id}.png`),
        prompt: `${ILLUSTRATION} Colour: ${p.palette}.`,
        aspect: "1:1",
        size: "1K",
      });
    }
  }

  await mkdir(join(ROOT, "public/images/paths"), { recursive: true });
  await mkdir(join(ROOT, "public/images/placeholders"), { recursive: true });

  for (const job of jobs) {
    const rel = job.file.replace(`${ROOT}/`, "");
    // Check for the shipped .jpg, not the .png this writes. optimize-images.mjs
    // converts and then deletes the PNG, so a check on the PNG finds nothing
    // for every asset that has already been through the pipeline and redraws
    // the entire set. That is how a request to redraw one cover quietly
    // replaced three that had already been reviewed and kept.
    const shipped = job.file.replace(/\.png$/, ".jpg");
    if (!force && ((await exists(shipped)) || (await exists(job.file)))) {
      console.log(`skip  ${rel}`);
      continue;
    }
    try {
      const buf = await generate(token, job);
      await writeFile(job.file, buf);
      console.log(`write ${rel}  ${(buf.length / 1024).toFixed(0)}kb`);
    } catch (err) {
      console.error(`FAIL  ${rel}  ${err.message}`);
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
