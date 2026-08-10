"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/form-state";

/**
 * Authoring the catalogue: courses, modules and lessons.
 *
 * ------------------------------------------------------------------ why it exists
 *
 * None of this was possible. `content.ts` owned every word of the catalogue, so
 * creating a course was an edit to a 3,500-line TypeScript file plus a deploy,
 * and the admin console said as much in its own docstring. The one control it
 * offered was the module access toggle. Roan's report — "this page is broken,
 * I'm not able to change anything" — was an accurate description of a console
 * that could not author the thing it was a console for.
 *
 * The catalogue moved into Postgres (see `src/lib/catalog.ts`). These are the
 * writes that make it editable.
 *
 * ---------------------------------------------------------------- the guard
 *
 * `requireRole("admin")` in every function, never only in the layout. A layout
 * does not run for a Server Action invoked from a page under it, and an action
 * is a POST endpoint reachable by anyone who can read the page's HTML. Postgres
 * is the real boundary underneath: `catalog_courses_write` and its siblings are
 * ALL / `is_admin()`, so a request that skipped this would still be refused —
 * these produce the good error message rather than the decision.
 *
 * ---------------------------------------------------------- what revalidates
 *
 * A catalogue edit changes the marketing pages, which are `revalidate = 3600`
 * static renders. Without an explicit bust, renaming a course would show up on
 * the homepage within the hour rather than on the next navigation, which reads
 * exactly like the save not working. `revalidateCatalog` is called by every
 * write here.
 */

/** Every surface that renders a course. Called after each write below. */
async function revalidateCatalog(courseSlug?: string) {
  revalidatePath("/", "page");
  revalidatePath("/courses", "page");
  revalidatePath("/sitemap.xml");
  if (courseSlug) revalidatePath(`/courses/${courseSlug}`, "page");
  /* The console, the player and the dashboard all read it too. "layout" here
     because these are trees of routes rather than single pages. */
  revalidatePath("/admin", "layout");
  revalidatePath("/learn", "layout");
  revalidatePath("/dashboard");
}

function fail(label: string, error: { message: string } | null): void {
  if (error) throw new Error(`${label}: ${error.message}`);
}

/**
 * A message the author can act on, rather than an error page.
 *
 * `(app)/error.tsx` deliberately hides `error.message`, which is right for a
 * dropped connection and wrong for "a course with that id already exists" — that
 * is an answer, and throwing it loses every field the author had filled in.
 * These actions return `{ error }` for anything a person can fix and keep
 * throwing for everything else. `Refuse` marks the difference at the throw site.
 */
class Refuse extends Error {}
function refuse(message: string): never {
  throw new Refuse(message);
}

/** Runs the body, turning a Refuse into a message on the form. */
async function answering(run: () => Promise<FormState>): Promise<FormState> {
  try {
    return await run();
  } catch (e) {
    if (e instanceof Refuse) return { error: e.message };
    throw e;
  }
}

/**
 * A URL-safe segment from whatever a person typed.
 *
 * Authors type titles, not slugs, and asking for both is asking twice for the
 * same thing. Where a slug is genuinely worth controlling — a course's public
 * URL — the form offers the field and this fills it in when it is left blank.
 */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/** A textarea of one-per-line values, as an array. Blank lines are not data. */
function lines(value: FormDataEntryValue | null): string[] {
  /* `\r\n` because that is what a browser submits from a textarea, per the HTML
     spec. Splitting on `\n` alone leaves a trailing carriage return on every
     item, which then renders as one. */
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * A textarea of `label | value` pairs, as objects.
 *
 * The alternative was a JSON textarea, which is what the lesson block editor
 * still asks for on its structured kinds. For four facts and four stats on a
 * course form that is a punishing amount of syntax to get exactly right, and a
 * missing brace loses the whole save. A pipe per line cannot be malformed.
 */
function pairs(value: FormDataEntryValue | null, a: string, b: string) {
  return lines(value)
    .map((line) => {
      const [left, ...rest] = line.split("|");
      return { [a]: left.trim(), [b]: rest.join("|").trim() };
    })
    .filter((row) => row[a] && row[b]);
}

/* ------------------------------------------------------------------ courses */

/**
 * Create a course.
 *
 * It starts as a draft with one open module and one lesson in it, and that is
 * not a convenience — it is the difference between "a course exists" and "a
 * course can be opened". An empty course 404s in the player: `getCourseBoard`
 * returns null when a course has no modules, deliberately, because a board that
 * renders `modules[0].n` on an empty array is a crash. So a new course is born
 * openable, and the first thing an author sees is a module to rename rather than
 * an empty page with no obvious next step.
 *
 * The open module is also the free-first-module promise, which the site makes on
 * six surfaces. A course whose every module needs an account contradicts it, and
 * `setModuleAccess` already refuses to leave a course in that state.
 */
export async function createCourse(_prev: FormState, formData: FormData): Promise<FormState> {
  return answering(async () => {
  await requireRole("admin");

  const title = String(formData.get("title") ?? "").trim();
  if (!title) refuse("A course needs a title.");

  const id = slugify(String(formData.get("id") ?? "") || title);
  if (!id) refuse("That title has no letters or numbers in it to build an id from.");

  const supabase = await createClient();

  const { data: existing } = await supabase.from("courses").select("id").eq("id", id).maybeSingle();
  if (existing) refuse(`A course with the id "${id}" already exists. Pick a different id, or open that course instead.`);

  /* Last, so a new course does not push its way to the front of the homepage.
     `position` is presentation and the console can reorder it afterwards. */
  const { data: last } = await supabase
    .from("courses")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  fail(
    "create course",
    (
      await supabase.from("courses").insert({
        id,
        slug: slugify(String(formData.get("slug") ?? "") || title) || id,
        title,
        badge: String(formData.get("badge") ?? "").trim() || "New course",
        summary: String(formData.get("summary") ?? "").trim() || null,
        position: (last?.position ?? 0) + 1,
        status: "draft",
      })
    ).error,
  );

  const { data: module, error: moduleError } = await supabase
    .from("modules")
    .insert({
      course_id: id,
      n: "01",
      name: "Module 1",
      summary: "",
      step: 1,
      access: "open",
      position: 0,
    })
    .select("id")
    .single();
  fail("create first module", moduleError);
  if (!module) throw new Error("create first module: no row came back");

  fail(
    "create first lesson",
    (
      await supabase.from("lessons").insert({
        module_id: module.id,
        name: "Lesson 1",
        slug: "lesson-1",
        kind: "lesson",
        position: 0,
      })
    ).error,
  );

  await revalidateCatalog();
  redirect(`/admin/courses/${id}`);
  });
}

/**
 * Save the course itself: everything a visitor reads before enrolling.
 *
 * One form, one write. The fields map to the columns the `Course` type has
 * always described — they simply live in Postgres now rather than in a literal.
 */
export async function saveCourse(_prev: FormState, formData: FormData): Promise<FormState> {
  return answering(async () => {
  await requireRole("admin");

  const courseId = String(formData.get("courseId") ?? "");
  if (!courseId) throw new Error("saveCourse: courseId is required");

  const title = String(formData.get("title") ?? "").trim();
  if (!title) refuse("A course needs a title.");

  const slug = slugify(String(formData.get("slug") ?? "") || title);
  if (!slug) refuse("A course needs a URL slug.");

  const workload = Number(formData.get("workloadHours") ?? 0);
  const coverWidth = Number(formData.get("coverWidth") ?? 0);
  const coverHeight = Number(formData.get("coverHeight") ?? 0);

  const supabase = await createClient();

  const { error } = await supabase
    .from("courses")
    .update({
      slug,
      title,
      badge: String(formData.get("badge") ?? "").trim() || "Course",
      summary: String(formData.get("summary") ?? "").trim() || null,
      level: String(formData.get("level") ?? "").trim() || null,
      duration: String(formData.get("duration") ?? "").trim() || null,
      workload_hours: Number.isFinite(workload) && workload > 0 ? workload : null,
      ground: String(formData.get("ground") ?? "").trim() || null,
      tagline: String(formData.get("tagline") ?? "").replace(/\r\n/g, "\n").trim() || null,
      audience: String(formData.get("audience") ?? "").trim() || null,
      build: String(formData.get("build") ?? "").trim() || null,
      cover_build: String(formData.get("coverBuild") ?? "").trim() || null,
      cover_src: String(formData.get("coverSrc") ?? "").trim() || null,
      cover_alt: String(formData.get("coverAlt") ?? "").trim() || null,
      cover_width: coverWidth > 0 ? coverWidth : null,
      cover_height: coverHeight > 0 ? coverHeight : null,
      cover_focus: String(formData.get("coverFocus") ?? "").trim() || null,
      seo_title: String(formData.get("seoTitle") ?? "").trim() || null,
      seo_description: String(formData.get("seoDescription") ?? "").replace(/\r\n/g, "\n").trim() || null,
      keywords: lines(formData.get("keywords")),
      skills: lines(formData.get("skills")),
      what_learn: lines(formData.get("whatLearn")),
      requirements: lines(formData.get("requirements")),
      description: lines(formData.get("description")),
      facts: pairs(formData.get("facts"), "label", "value"),
      stats: pairs(formData.get("stats"), "value", "label"),
    })
    .eq("id", courseId);
  if (error?.message?.includes("courses_slug_key")) {
    refuse(`Another course already uses the address /courses/${slug}. Pick a different slug.`);
  }
  fail("save course", error);

  await revalidateCatalog(slug);
  return { ok: "Saved." };
  });
}

/**
 * Publish or unpublish.
 *
 * Draft is the whole reason a course can be built on the live site: nothing
 * public and nothing in `/learn` can reach one, so an author can work in front
 * of real visitors without showing them a half-written page.
 *
 * Publishing checks the course is openable rather than trusting it. A published
 * course with no lessons is a link on the homepage to a 404 — `getCourseBoard`
 * returns null for a course with no modules — and the moment to catch that is
 * before a visitor does.
 */
export async function setCourseStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  return answering(async () => {
  await requireRole("admin");

  const courseId = String(formData.get("courseId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (status !== "draft" && status !== "published") throw new Error(`unknown status "${status}"`);

  const supabase = await createClient();

  if (status === "published") {
    const { data: modules } = await supabase
      .from("modules")
      .select("id, access, lessons(id)")
      .eq("course_id", courseId);

    const list = modules ?? [];
    if (!list.length) {
      refuse("Add a module before publishing. A course with none 404s in the player.");
    }
    if (!list.some((m) => (m.lessons ?? []).length > 0)) {
      refuse("Add at least one lesson before publishing. There would be nothing to open.");
    }
    if (!list.some((m) => m.access === "open")) {
      refuse(
        "Open one module before publishing. Every course on this site promises a free first module, on six separate surfaces.",
      );
    }
  }

  const { data: course, error } = await supabase
    .from("courses")
    .update({ status })
    .eq("id", courseId)
    .select("slug")
    .single();
  fail("set course status", error);

  await revalidateCatalog(course?.slug);
  return { ok: status === "published" ? "Published." : "Unpublished." };
  });
}

/** Which course leads the homepage grid. Exactly one, so setting it clears the rest. */
export async function setFeatured(formData: FormData) {
  await requireRole("admin");
  const courseId = String(formData.get("courseId") ?? "");

  const supabase = await createClient();
  fail("clear featured", (await supabase.from("courses").update({ featured: false }).neq("id", courseId)).error);
  fail("set featured", (await supabase.from("courses").update({ featured: true }).eq("id", courseId)).error);

  await revalidateCatalog();
}

/** Move a course up or down the catalogue order. */
export async function moveCourse(formData: FormData) {
  await requireRole("admin");
  const courseId = String(formData.get("courseId") ?? "");
  const direction = String(formData.get("direction") ?? "");

  const supabase = await createClient();
  const { data: all } = await supabase.from("courses").select("id, position").order("position");
  await swap(supabase, "courses", all ?? [], courseId, direction);
  await revalidateCatalog();
}

/**
 * Delete a course, and say what goes with it.
 *
 * This cascades: modules, lessons, lesson blocks, and through them every
 * learner's completions, artifacts, outcome sheets and judgements on this
 * course. There is no undo and no soft-delete column, so the console asks for
 * the course id to be typed back before it will call this. Unpublishing is the
 * reversible thing and the console says so beside the button.
 */
export async function deleteCourse(_prev: FormState, formData: FormData): Promise<FormState> {
  return answering(async () => {
  await requireRole("admin");

  const courseId = String(formData.get("courseId") ?? "");
  const confirm = String(formData.get("confirm") ?? "").trim();
  if (confirm !== courseId) {
    refuse(
      `To delete this course type its id, ${courseId}, into the box exactly. Everything in it goes, including every learner's progress and submitted work.`,
    );
  }

  const supabase = await createClient();
  fail("delete course", (await supabase.from("courses").delete().eq("id", courseId)).error);

  await revalidateCatalog();
  redirect("/admin/courses");
  });
}

/* ------------------------------------------------------------------ modules */

/** Add a module to the end of a course. */
export async function createModule(formData: FormData) {
  await requireRole("admin");

  const courseId = String(formData.get("courseId") ?? "");
  const name = String(formData.get("name") ?? "").trim() || "New module";

  const supabase = await createClient();
  const { data: siblings } = await supabase
    .from("modules")
    .select("n, position")
    .eq("course_id", courseId)
    .order("position");

  const list = siblings ?? [];
  /* Module numbers are the URL segment (`/learn/<course>/04`) and are unique per
     course, so the next one is derived from the highest that exists rather than
     from the count — deleting module 03 of four must not make the next insert
     collide with 04. */
  const highest = list.reduce((max, m) => Math.max(max, Number(m.n) || 0), 0);

  fail(
    "create module",
    (
      await supabase.from("modules").insert({
        course_id: courseId,
        n: String(highest + 1).padStart(2, "0"),
        name,
        summary: "",
        step: 1,
        /* Every module after the first requires an account. The first one is
           open, which createCourse sets, and setModuleAccess refuses to close
           the last open one. */
        access: list.length ? "account" : "open",
        position: list.length,
      })
    ).error,
  );

  await revalidateCatalog();
}

/** Rename a module and set what it produces. */
export async function saveModule(_prev: FormState, formData: FormData): Promise<FormState> {
  return answering(async () => {
  await requireRole("admin");

  const moduleId = String(formData.get("moduleId") ?? "");
  const step = Number(formData.get("step") ?? 1);

  const supabase = await createClient();
  const { error } = await supabase
    .from("modules")
    .update({
      name: String(formData.get("name") ?? "").trim() || "Untitled module",
      summary: String(formData.get("summary") ?? "").replace(/\r\n/g, "\n").trim() || null,
      artifact: String(formData.get("artifact") ?? "").trim() || null,
      step: step >= 1 && step <= 5 ? step : 1,
    })
    .eq("id", moduleId);
  fail("save module", error);

  await revalidateCatalog();
  return { ok: "Saved." };
  });
}

/** Move a module within its course. */
export async function moveModule(formData: FormData) {
  await requireRole("admin");
  const courseId = String(formData.get("courseId") ?? "");
  const moduleId = String(formData.get("moduleId") ?? "");
  const direction = String(formData.get("direction") ?? "");

  const supabase = await createClient();
  const { data: all } = await supabase
    .from("modules")
    .select("id, position")
    .eq("course_id", courseId)
    .order("position");
  await swap(supabase, "modules", all ?? [], moduleId, direction);
  await revalidateCatalog();
}

/**
 * Delete a module and everything under it.
 *
 * Refuses to remove the last open module for the same reason `setModuleAccess`
 * does: the free-first-module promise is made on six surfaces and a course with
 * nothing open contradicts all six.
 */
export async function deleteModule(_prev: FormState, formData: FormData): Promise<FormState> {
  return answering(async () => {
  await requireRole("admin");

  const courseId = String(formData.get("courseId") ?? "");
  const moduleId = String(formData.get("moduleId") ?? "");

  const supabase = await createClient();
  const { data: open } = await supabase
    .from("modules")
    .select("id")
    .eq("course_id", courseId)
    .eq("access", "open");

  if ((open ?? []).length <= 1 && (open ?? []).some((m) => m.id === moduleId)) {
    refuse(
      "This is the course's only open module. Open another one before deleting it, so the free first module stays true.",
    );
  }

  fail("delete module", (await supabase.from("modules").delete().eq("id", moduleId)).error);
  await revalidateCatalog();
  return { ok: "Module deleted." };
  });
}

/* ------------------------------------------------------------------ lessons */

/** Add a lesson to the end of a module. */
export async function createLesson(formData: FormData) {
  await requireRole("admin");

  const moduleId = String(formData.get("moduleId") ?? "");
  const name = String(formData.get("name") ?? "").trim() || "New lesson";

  const supabase = await createClient();
  const { data: siblings } = await supabase
    .from("lessons")
    .select("slug, position")
    .eq("module_id", moduleId)
    .order("position");

  const list = siblings ?? [];
  const taken = new Set(list.map((l) => l.slug));

  /* The slug is the URL and is unique within the module, so a second "New
     lesson" cannot reuse the first one's. Suffixing beats failing the insert. */
  let slug = slugify(name) || "lesson";
  for (let i = 2; taken.has(slug); i++) slug = `${slugify(name) || "lesson"}-${i}`;

  fail(
    "create lesson",
    (
      await supabase.from("lessons").insert({
        module_id: moduleId,
        name,
        slug,
        kind: "lesson",
        position: list.length,
      })
    ).error,
  );

  await revalidateCatalog();
}

/**
 * Rename a lesson, or change what kind it is.
 *
 * The slug is editable and changing it is a real decision, not a typo fix: it is
 * the lesson's public URL, and any link a learner saved to the old one stops
 * resolving. The form says so. What it does NOT do is follow the name
 * automatically — that would silently break a URL every time somebody fixed a
 * capital letter.
 */
export async function saveLesson(_prev: FormState, formData: FormData): Promise<FormState> {
  return answering(async () => {
  await requireRole("admin");

  const lessonId = String(formData.get("lessonId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const kind = String(formData.get("kind") ?? "lesson");
  const minutes = Number(formData.get("minutes") ?? 0);

  if (!name) refuse("A lesson needs a name.");
  if (!["lesson", "lab", "template"].includes(kind)) throw new Error(`unknown kind "${kind}"`);

  const slug = slugify(String(formData.get("slug") ?? "") || name);
  if (!slug) refuse("A lesson needs a URL slug.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("lessons")
    .update({
      name,
      slug,
      kind,
      /* Only where there is something with a running time. A duration printed
         beside a text lesson is a claim about a video that was never shot. */
      minutes: Number.isFinite(minutes) && minutes > 0 ? minutes : null,
    })
    .eq("id", lessonId);
  if (error?.message?.includes("lessons_module_slug_key")) {
    refuse(`Another lesson in this module already answers to "${slug}". Give this one a different slug.`);
  }
  fail("save lesson", error);

  await revalidateCatalog();
  return { ok: "Saved." };
  });
}

/** Move a lesson within its module. */
export async function moveLesson(formData: FormData) {
  await requireRole("admin");
  const moduleId = String(formData.get("moduleId") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "");
  const direction = String(formData.get("direction") ?? "");

  const supabase = await createClient();
  const { data: all } = await supabase
    .from("lessons")
    .select("id, position")
    .eq("module_id", moduleId)
    .order("position");
  await swap(supabase, "lessons", all ?? [], lessonId, direction);
  await revalidateCatalog();
}

/**
 * Delete a lesson.
 *
 * Its blocks go with it, and so does every learner's completion of it, through
 * `lesson_progress`'s cascade. That is the correct outcome — a completion of a
 * lesson that no longer exists is not a fact about anything — and the console
 * says it out loud rather than leaving it to be discovered.
 */
export async function deleteLesson(formData: FormData) {
  await requireRole("admin");
  const lessonId = String(formData.get("lessonId") ?? "");

  const supabase = await createClient();
  fail("delete lesson", (await supabase.from("lessons").delete().eq("id", lessonId)).error);

  await revalidateCatalog();
}

/* -------------------------------------------------------------------- order */

/**
 * Swap one row with its neighbour.
 *
 * Two updates rather than a renumber of the whole list, because `position` only
 * has to be an order and rewriting every sibling turns a one-row move into an N-
 * row write that can half-apply.
 *
 * The rows are read in `position` order by the caller, so "up" is the previous
 * element and the ends are no-ops rather than errors — pressing up on the first
 * item is not a mistake worth an error page.
 */
async function swap(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: "courses" | "modules" | "lessons",
  rows: { id: string; position: number }[],
  id: string,
  direction: string,
) {
  const i = rows.findIndex((r) => r.id === id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= rows.length) return;

  /* Positions can be equal — nothing has ever enforced otherwise — and swapping
     two equal numbers moves nothing. Falling back to the index makes the move
     work on a list that was never renumbered. */
  const a = rows[i].position === rows[j].position ? i : rows[i].position;
  const b = rows[i].position === rows[j].position ? j : rows[j].position;

  fail("reorder", (await supabase.from(table).update({ position: b }).eq("id", rows[i].id)).error);
  fail("reorder", (await supabase.from(table).update({ position: a }).eq("id", rows[j].id)).error);
}
