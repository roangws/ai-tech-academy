import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Tick or untick one lesson, without making anybody wait for it.
 *
 * ---------------------------------------------------------------- why not the action
 *
 * `toggleLesson` in `app/actions/lms.ts` still exists and still works, and it is
 * the wrong shape for the press this backs. A server action that ends in
 * `redirect()` is: POST the action, run the RPC, revalidate four paths, return a
 * redirect, THEN navigate. Every one of those is in front of the reader, and the
 * measured total on production was between one and two seconds for a press whose
 * meaning is "I have finished, move on". Roan reported it as taking too long, and
 * it did — not because any single step is slow, but because a navigation was
 * queued behind a write it does not depend on.
 *
 * The write and the navigation are independent facts. Completing a lesson does
 * not change what the next lesson says. So the client navigates immediately and
 * posts here in the background, and the reader is reading the next lesson while
 * this runs.
 *
 * ------------------------------------------------------------- it saves regardless
 *
 * "Needs to save the progress regardless" is the requirement, and the failure it
 * guards against is a reader who presses once and leaves. The client sends this
 * with `keepalive`, so the request survives the document being torn down; and
 * because completion is a row that exists or does not, a duplicate delivery is a
 * no-op through the primary key rather than a double-toggle.
 *
 * There is no response body worth waiting for. A 204 is the whole answer, which
 * is what makes `keepalive` legal — the fetch spec caps a keepalive request's
 * body, not its lifetime, and nothing here reads the result.
 *
 * ------------------------------------------------------------------ still guarded
 *
 * `toggle_lesson` is the same SECURITY INVOKER function the action calls, so
 * every policy that governed the write still governs it, the four statements are
 * still one transaction, and the check that `p_lesson_id` really belongs to the
 * module named by `p_n` still happens in Postgres. Nothing about the boundary
 * moved; only the waiting did.
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  /* The id and nothing else — see `requireUserId`. A 401 rather than a redirect,
     because the caller is `fetch`, not a browser following a location header. */
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return new NextResponse(null, { status: 401 });

  let body: { lessonId?: string; courseId?: string; n?: string; done?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const { lessonId, courseId, n, done } = body;
  if (!lessonId || !courseId || !n) {
    return NextResponse.json({ error: "lessonId, courseId and n required" }, { status: 400 });
  }

  const { error } = await supabase.rpc("toggle_lesson", {
    p_lesson_id: lessonId,
    p_course_id: courseId,
    p_n: n,
    /* `p_done` is the state it is coming FROM, matching the action and the
       function's own signature: true means "this was done, untick it". */
    p_done: done === true,
  });

  /*
    A failed write is reported, even though nobody is waiting for the answer.

    Silence here would be the exact bug the `must()` helper in actions/lms.ts
    exists to prevent, one layer down: the client has already flipped the tick
    optimistically, so an RLS refusal that returns 204 leaves a learner looking
    at a completed lesson that Postgres never recorded. The client re-reads the
    real state on the next render and the status code is what tells it to.
  */
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  /*
    Revalidate what shows a count, but NOT the lesson the reader is on.

    `slug` is deliberately not a parameter: this route knows the course id and
    the module, and the two surfaces that print a stale number are the dashboard
    and this course's board, both of which the client refreshes on its own by
    calling `router.refresh()` after the navigation settles. Revalidating the
    lesson page a reader is currently reading would re-render it underneath them
    for a tick that is already drawn.
  */
  revalidatePath("/dashboard");

  return new NextResponse(null, { status: 204 });
}
