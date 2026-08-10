import { createClient } from "@/lib/supabase/server";
import { bySlug } from "@/lib/lms/queries";
import type { Enrollment, LessonRow, ModuleRow } from "@/lib/supabase/types";

/**
 * Where "start this course" actually goes.
 *
 * ------------------------------------------------------------------- the problem
 *
 * Every control on the site that meant "begin" went somewhere that was not the
 * course. The rail's button went to `/sign-up`, which bounces a signed-in reader
 * to `/dashboard`; sign-up itself finished at `/dashboard`; and `/dashboard` is a
 * list of courses, which is the screen a reader who has just chosen a course
 * least needs. So the funnel's happy path was: pick a course, make an account,
 * arrive at a list of courses, pick the same course again, open the contents,
 * pick a module, pick a lesson. Six decisions to reach the thing they had already
 * decided on at step one.
 *
 * This resolves the whole of that into one URL.
 *
 * ------------------------------------------------------------------ the rules
 *
 * In order, and each one only applies if the one above found nothing:
 *
 *   1. The resume pointer. `enrollments.last_lesson_id` is written every time a
 *      lesson is ticked, and "pick up where you left off" is a promise the
 *      dashboard has been making since it existed. If it names a lesson that is
 *      still in this course, that is the answer.
 *   2. The first lesson they have not finished. A reader returning to a course
 *      they never ticked anything on, or whose pointer is stale, wants the front
 *      of the unread part rather than the front of the course.
 *   3. The first lesson. New reader, no history — and the one case that has to
 *      work for somebody with no account at all.
 *
 * Every rule is filtered by what this reader may actually open, which is the
 * free-first-module gate and nothing else: `access = 'open'` is public, and
 * everything else needs a session. A signed-out reader whose only reachable
 * lesson is in module 01 therefore starts at module 01, which is exactly the
 * offer the whole site is built on.
 *
 * ------------------------------------------------------------- why not a page
 *
 * This backs a route handler rather than a server action, and that is the
 * difference between a press that feels instant and one that does not. A server
 * action posts an RSC request, waits for it, and then navigates — two sequential
 * trips before anything moves. A route handler is one GET and a 302, which the
 * browser follows itself.
 *
 * It also means the destination is a real URL: `/courses/gtm/start` can be the
 * `next` parameter on sign-up, so finishing an account form lands the new
 * account inside their first lesson rather than on a dashboard.
 */
export type StartTarget = {
  /** Where to send them. Always a `/learn/...` path. */
  href: string;
  /** True when this is a resume rather than a first opening. */
  resuming: boolean;
};

export async function resolveStart(
  slug: string,
  userId: string | null,
): Promise<StartTarget | null> {
  const course = await bySlug(slug);
  if (!course) return null;

  const supabase = await createClient();

  /*
    Modules and their lessons in one query, ordered by the same `position` the
    board renders. The nested order clause matters: without it PostgREST returns
    the embedded lessons in whatever order the planner produced, and "the first
    lesson" becomes whichever row the database felt like handing back.
  */
  const { data } = await supabase
    .from("modules")
    .select("id, n, access, position, lessons(id, slug, position)")
    .eq("course_id", course.id)
    .order("position")
    .order("position", { referencedTable: "lessons" });

  const modules = (data ?? []) as unknown as (Pick<ModuleRow, "id" | "n" | "access" | "position"> & {
    lessons: Pick<LessonRow, "id" | "slug" | "position">[];
  })[];

  /* Flattened once, in reading order, so all three rules below are a `find` over
     the same list rather than three different nested walks. */
  const openable = modules
    .filter((m) => m.access === "open" || Boolean(userId))
    .flatMap((m) => (m.lessons ?? []).map((l) => ({ ...l, n: m.n })));

  if (!openable.length) return null;

  const href = (l: { n: string; slug: string }) => `/learn/${slug}/${l.n}/${l.slug}`;

  if (!userId) return { href: href(openable[0]), resuming: false };

  /*
    The enrolment write and the two progress reads go together, because the
    reader is standing on a spinner while this runs. The upsert is what makes
    pressing Start an enrolment: it used to happen only when somebody ticked a
    lesson, so a learner could be four lessons into a course their own dashboard
    said they had not begun.

    `ignoreDuplicates` makes the already-enrolled case — which is most of them —
    a no-op rather than a conflict.
  */
  const [enrollment, done] = await Promise.all([
    supabase
      .from("enrollments")
      .upsert(
        { user_id: userId, course_id: course.id },
        { onConflict: "user_id,course_id", ignoreDuplicates: true },
      )
      .then(() =>
        supabase
          .from("enrollments")
          .select("last_lesson_id")
          .eq("user_id", userId)
          .eq("course_id", course.id)
          .maybeSingle(),
      )
      .then((r) => r.data as Pick<Enrollment, "last_lesson_id"> | null),
    supabase
      .from("lesson_progress")
      .select("lesson_id")
      .eq("user_id", userId)
      .in(
        "lesson_id",
        openable.map((l) => l.id),
      )
      .then((r) => new Set(((r.data ?? []) as { lesson_id: string }[]).map((p) => p.lesson_id))),
  ]);

  /*
    1. The resume pointer — but only if it names a lesson they have NOT finished.

    Two conditions, and the second was missing on the first pass and showed up
    immediately in testing. `last_lesson_id` is written by `toggle_lesson` for
    the lesson that was just TICKED, so after completing lesson 1 the pointer
    names lesson 1. Following it blindly meant "Resume the course" sent a learner
    back to the lesson they had just finished — the product losing their progress,
    from their point of view, and on the one control that exists to remove
    friction.

    The first condition is the older one: a module deleted in the console leaves
    a pointer at a lesson that no longer exists, and following that is a 404 on a
    control that must never fail.

    Both fall through to rule 2, which is the front of the unread part — which is
    where somebody who just finished a lesson actually wants to be.
  */
  const pointed = enrollment?.last_lesson_id
    ? openable.find((l) => l.id === enrollment.last_lesson_id)
    : undefined;
  if (pointed && !done.has(pointed.id)) return { href: href(pointed), resuming: true };

  /* 2. The front of the unread part. */
  const unread = openable.find((l) => !done.has(l.id));
  if (unread) return { href: href(unread), resuming: done.size > 0 };

  /* 3. Everything is finished, so the honest destination is the last lesson
        rather than the first: sending somebody who completed the course back to
        lesson one reads as the product losing their progress. */
  return { href: href(openable[openable.length - 1]), resuming: true };
}
