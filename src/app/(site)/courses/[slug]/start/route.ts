import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveStart } from "@/lib/lms/start";

/**
 * `GET /courses/<slug>/start` — one press, one redirect, straight into a lesson.
 *
 * ------------------------------------------------------------------- the shape
 *
 * A route handler rather than a page or a server action, and each of those was
 * tried first.
 *
 * A **page** would have to render, resolve a destination and then `redirect()`,
 * which ships an RSC payload for a document nobody ever sees. It is also
 * prefetchable: Next prefetches links on hover, and a page that enrols the
 * reader as a side effect would enrol everybody who moved a pointer across the
 * button. Route handlers are not prefetched, which is the property that makes
 * the write here safe.
 *
 * A **server action** costs two sequential round trips — POST the action, wait,
 * then navigate — for a press whose entire job is to navigate. This is one GET
 * and a 302 the browser follows itself.
 *
 * -------------------------------------------------------------- signed out
 *
 * Not a redirect to sign-in. Module 1 is open with no account, and the single
 * most important thing this URL does is honour that: a visitor who has never
 * seen the site can press "Start the course" and be watching lesson one without
 * having typed anything. `resolveStart` filters to what they may open, so what
 * they get is the free module rather than a locked lesson or a login wall.
 *
 * `next=` on the sign-up form points back here, so a reader who does choose to
 * make an account finishes the form inside the lesson rather than on a
 * dashboard.
 *
 * ----------------------------------------------------------------- no cache
 *
 * The destination depends on who is asking and on what they have finished, so
 * this can never be cached — `dynamic = "force-dynamic"` plus a `no-store` on
 * the response, because a 302 cached at the edge would pin every reader to one
 * reader's lesson.
 */
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  /* `getClaims()` rather than `getViewer()`: this needs an id and nothing else,
     and the fuller call spends a round trip on a profile and a role list that
     nothing here reads. Same reasoning as `requireUserId`. */
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub ?? null;

  const target = await resolveStart(slug, userId);

  /* No lesson this reader can open. Either the course does not exist, or it has
     no modules yet, or every module needs an account and they have none. The
     course page answers all three honestly; a 404 from here would not. */
  const href = target?.href ?? `/courses/${slug}`;

  const response = NextResponse.redirect(new URL(href, request.url), 303);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
