import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveStart } from "@/lib/lms/start";
import type { Enrollment } from "@/lib/supabase/types";

/**
 * `GET /start` — the site-wide "Enroll for free", and it lands in a lesson.
 *
 * ------------------------------------------------------------------ what was wrong
 *
 * Roan: "the homepage is not sending to the first class as i clicked on it."
 *
 * He is right, and it was every instance of the control rather than one of them.
 * `EnrollButton` defaulted to `/sign-up`, and it is mounted in the site header,
 * the hero, the module section, two places in the catalog band, the closing panel,
 * the mobile menu and the catalog page's dark panel. So the single most-pressed
 * affordance on the site — labelled "Enroll for free", under a headline promising
 * that module 1 opens with no account — opened an account form, and a reader who
 * already had an account was bounced from that form to a dashboard listing the
 * five courses they had just been reading about.
 *
 * `/courses/<slug>/start` already existed and already did the right thing, and
 * that is the shape this borrows: one GET, one 303, straight into a lesson. What
 * it could not do is answer a press from a surface that names no course — the
 * header, the hero, the closing band — because it needs a slug in the path.
 *
 * -------------------------------------------------------------- which course
 *
 * Two rules, in order:
 *
 *   1. The course they are already in. Signed in with an enrolment, the most
 *      recently touched one is the answer — pressing "Enroll for free" while
 *      halfway through a course and being restarted somewhere else would be the
 *      product losing their place.
 *   2. The featured course. Signed out, or signed in with no enrolment. This is
 *      the same course the homepage promotes as its lead card, so the button lands
 *      the reader where the page was already pointing them.
 *
 * `resolveStart` then does the rest: it enrols, honours the resume pointer, and
 * filters to what this reader may actually open. A signed-out visitor therefore
 * gets module 1, which is the offer the whole site is built on — this route
 * deliberately does NOT bounce them through a login first. The free first module
 * is stated in the hero, on every catalog card, in the enrol rail and twice in the
 * FAQ, and a login wall here would make all of it untrue.
 *
 * ------------------------------------------------------------------- no cache
 *
 * The destination depends on who is asking and on what they have finished, so a
 * 302 cached at the edge would pin every reader to one reader's lesson.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  /* `getClaims()` rather than `getViewer()`: this needs an id and nothing else.
     Same reasoning as the per-course route next to it. */
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub ?? null;

  let slug: string | null = null;

  if (userId) {
    /*
      The most recently touched enrolment. `last_seen_at` is written as a reader
      moves through a course and `enrolled_at` is the fallback for one they joined
      and never opened, so the two are ordered together — `nullsFirst: false`
      because a null `last_seen_at` must lose to any real timestamp rather than
      sort to the top, which is what Postgres does with NULLS FIRST on DESC.

      `.eq("user_id", userId)` IS LOAD-BEARING AND WAS MISSING, caught in QA before
      this shipped. It reads like belt and braces over RLS and it is not:
      `enrollments` is readable by an admin and by an instructor for the courses
      they teach, because /admin/learners and the instructor console are built on
      exactly that. So for an ordinary learner the policy hid everybody else's rows
      and this query worked by accident, and for staff it returned the whole table
      — ordered by "most recently touched", which is somebody ELSE's most recent
      lesson. Pressing "Enroll for free" as an admin dropped me into another
      account's course, on another account's resume pointer.

      The general rule this is an instance of: a query that means "mine" has to say
      whose, even when a policy would usually agree. RLS decides what a request MAY
      read; it does not decide what this route MEANT.
    */
    const { data } = await supabase
      .from("enrollments")
      .select("course_id, last_seen_at, enrolled_at, courses!inner(slug, status)")
      .eq("user_id", userId)
      .eq("status", "active")
      .eq("courses.status", "published")
      .order("last_seen_at", { ascending: false, nullsFirst: false })
      .order("enrolled_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const row = data as unknown as
      | (Pick<Enrollment, "course_id"> & { courses: { slug: string } | null })
      | null;
    slug = row?.courses?.slug ?? null;
  }

  if (!slug) {
    /* The featured course, which is the homepage's own lead card. `featured`
       first and `position` second, so the choice is the same one the catalog
       band makes rather than a second opinion about it. */
    const { data } = await supabase
      .from("courses")
      .select("slug")
      .eq("status", "published")
      .order("featured", { ascending: false })
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();

    slug = (data as { slug: string } | null)?.slug ?? null;
  }

  /* Nothing published at all. The catalog says so honestly; a 404 from a button
     labelled "Enroll for free" would not. */
  if (!slug) {
    const response = NextResponse.redirect(new URL("/courses", request.url), 303);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  const target = await resolveStart(slug, userId);
  const href = target?.href ?? `/courses/${slug}`;

  const response = NextResponse.redirect(new URL(href, request.url), 303);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
