"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole, requireUser } from "@/lib/auth";
import { byId, bySlug, getMySeat } from "@/lib/lms/queries";

/**
 * Throw on a failed write instead of pretending it succeeded.
 *
 * Not one Supabase response in this file was checked originally. An RLS
 * refusal, an enum cast failure, a constraint violation — all of them came back
 * as `{ error }` on a promise nobody inspected, the action revalidated, and the
 * page re-rendered as though the write had landed. The learner saw success and
 * had nothing.
 *
 * Throwing routes it to the route's error boundary, which is a visible failure.
 * That is worse-looking than a silent no-op and considerably better.
 */
function must(label: string, error: { message: string } | null): void {
  if (error) throw new Error(`${label}: ${error.message}`);
}

/**
 * Every write the LMS does.
 *
 * ------------------------------------------------------- what guards what
 *
 * Each of these calls `requireUser()` first, and none of them trusts it.
 *
 * `requireUser` establishes who is asking so the row can be addressed and so an
 * unauthenticated caller gets a redirect rather than a database error. It is not
 * the authorisation: that is row-level security, evaluated by Postgres against
 * the caller's own token. An action that wrote `user_id: someoneElse` would be
 * refused by the `with check` on the policy, not by anything in this file.
 *
 * Which is why `user_id` is always set from `viewer.id` and never from the form.
 * A hidden field carrying a user id is a hidden field an attacker can edit, and
 * the only reason it would not be a vulnerability here is a policy — so the
 * field simply does not exist.
 *
 * ---------------------------------------------------------- revalidation
 *
 * Every mutation revalidates the paths that render what it changed. These pages
 * are dynamic, but the router still caches segments on the client, and without
 * this a completed lesson stays unticked until a hard reload.
 */

/* -------------------------------------------------------------- enrolment */

export async function enroll(formData: FormData): Promise<void> {
  const slug = formData.get("slug") as string;
  const course = await bySlug(slug);
  if (!course) return;

  const viewer = await requireUser(`/learn/${slug}`);
  const supabase = await createClient();

  /*
    `upsert` rather than `insert`, on the (user_id, course_id) unique constraint.

    A reader who presses Enrol twice — double-click, or the back button then the
    button again — otherwise gets a 409 and an error page for having done nothing
    wrong. Ignoring the duplicate is the correct response to "enrol me" from
    somebody already enrolled.
  */
  const { error } = await supabase
    .from("enrollments")
    .upsert({ user_id: viewer.id, course_id: course.id }, { onConflict: "user_id,course_id", ignoreDuplicates: true });
  must("enrol", error);

  revalidatePath("/dashboard");
  revalidatePath(`/learn/${slug}`);
}

/**
 * Enrol on first contact, if they are not already.
 *
 * ------------------------------------------------------------ what this fixes
 *
 * Enrolment only ever happened through the button on the course board. A reader
 * who signed up from a locked module — which is the funnel the whole site is
 * built around, and the one the `next` parameter exists to serve — landed
 * straight in the player, ticked lessons, wrote artifacts, and was never
 * enrolled in anything. `getDashboard` iterates enrolments, so their dashboard
 * said "No courses started yet" while they were halfway through a course.
 *
 * That directly contradicts `auth.signIn.intro` — "Pick up in the course you
 * were last working through" — which the dashboard claims to be.
 *
 * So any write that means "I am doing this course" enrols them. `ignoreDuplicates`
 * makes it free for the enrolled case, which is almost every call.
 *
 * `last_module_id` is the other half of that promise: it is what "the course you
 * were last working through" reads from.
 */
async function touchEnrollment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  courseId: string,
  moduleId: string | null,
  lessonId?: string | null,
): Promise<void> {
  await supabase
    .from("enrollments")
    .upsert({ user_id: userId, course_id: courseId }, { onConflict: "user_id,course_id", ignoreDuplicates: true });

  /*
    The resume pointer.

    `last_module_id` was written here from the start and read by nothing — the
    dashboard's "Continue" went to the course table of contents while its own
    subtitle said "Pick up where you left off". A module is also the wrong
    granularity: it holds up to eleven lessons, and continue means one of them.
    So the lesson and a timestamp go down too, and getDashboard reads all three.
  */
  if (moduleId) {
    await supabase
      .from("enrollments")
      .update({
        last_module_id: moduleId,
        ...(lessonId ? { last_lesson_id: lessonId } : {}),
        last_seen_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("course_id", courseId);
  }
}

/* --------------------------------------------------------------- progress */

/**
 * Tick or untick one lesson.
 *
 * Completion is a row that exists or does not, rather than a boolean column. It
 * makes "when" free, it makes the double-tick a no-op through the primary key,
 * and it means the table only ever holds facts.
 */
export async function toggleLesson(formData: FormData): Promise<void> {
  const lessonId = formData.get("lessonId") as string;
  const slug = formData.get("slug") as string;
  const n = formData.get("n") as string;
  const done = formData.get("done") === "true";

  const course = await bySlug(slug);
  if (!course || !lessonId) return;

  const viewer = await requireUser(`/learn/${slug}/${n}`);
  const supabase = await createClient();

  if (done) {
    const { error } = await supabase
      .from("lesson_progress")
      .delete()
      .eq("user_id", viewer.id)
      .eq("lesson_id", lessonId);
    must("untick lesson", error);
  } else {
    const { error } = await supabase
      .from("lesson_progress")
      .upsert({ user_id: viewer.id, lesson_id: lessonId }, { onConflict: "user_id,lesson_id", ignoreDuplicates: true });
    must("tick lesson", error);
  }

  /* Ticking a lesson is doing the course. See touchEnrollment. */
  const { data: module } = await supabase
    .from("modules")
    .select("id")
    .eq("course_id", course.id)
    .eq("n", n)
    .maybeSingle();
  await touchEnrollment(supabase, viewer.id, course.id, module?.id ?? null, lessonId);

  /* Also the course board, which shows the per-module counts this just changed. */
  /* Page, not "layout". A layout-scoped revalidation re-renders the whole learn
     tree, which remounts the audio element — so ticking a lesson while an episode
     plays would silence it. Nothing in the layout depends on this write. */
  revalidatePath(`/learn/${slug}/${n}`);
  revalidatePath(`/learn/${slug}`);
  revalidatePath("/dashboard");

  /*
    No redirect on completion.

    This used to honour a `then` field and carry the reader to the next lesson in
    the same press. The write always landed, and it read as the button doing
    nothing: you arrive on a page that says nothing about the lesson you just
    finished. Completing and moving on are two decisions and they are two
    controls now — see the note on the lesson page.
  */
}

/* -------------------------------------------------------------- artifacts */

/**
 * Save or submit the one artifact a module asks for.
 *
 * Draft and submitted are the same row and the same write; `intent` decides the
 * status. Submitting is what makes the work visible to an instructor — the
 * `artifacts_read_as_instructor` policy tests `status <> 'draft'` — so it is a
 * deliberate act with its own button rather than a side effect of typing.
 */
export async function saveArtifact(formData: FormData): Promise<void> {
  const moduleId = formData.get("moduleId") as string;
  const slug = formData.get("slug") as string;
  const n = formData.get("n") as string;
  const body = ((formData.get("body") as string | null) ?? "").slice(0, 20_000);
  const submitting = formData.get("intent") === "submit";

  const course = await bySlug(slug);
  if (!course || !moduleId) return;

  const viewer = await requireUser(`/learn/${slug}/${n}`);
  const supabase = await createClient();

  /*
    The module has to belong to the course in the URL.

    `moduleId` arrives in a hidden field, so it is whatever the caller sends. The
    `artifacts_own` policy only checks `user_id`, which means without this a
    signed-in reader could POST an artifact against any module of any course —
    including one they never opened — and it would land in that course's
    instructor console. RLS was never going to catch it: the row genuinely is
    theirs.
  */
  const { data: module } = await supabase
    .from("modules")
    .select("id, course_id")
    .eq("id", moduleId)
    .maybeSingle();
  if (!module || module.course_id !== course.id) return;

  /*
    Status only moves forward.

    Pressing "Save draft" on an already-submitted artifact used to write
    `status: 'draft'` and null the timestamp, which silently withdrew it from the
    instructor's queue — the read policy tests `status <> 'draft'` — and took a
    'reviewed' artifact's review with it. A learner tidying up a typo should not
    be able to un-submit their work by accident.
  */
  const { data: existing } = await supabase
    .from("artifacts")
    .select("status")
    .eq("user_id", viewer.id)
    .eq("module_id", moduleId)
    .maybeSingle();

  const alreadyOut = existing && existing.status !== "draft";
  const status = submitting || alreadyOut ? "submitted" : "draft";
  const nextStatus = alreadyOut && !submitting ? existing.status : status;

  const { error } = await supabase.from("artifacts").upsert(
    {
      user_id: viewer.id,
      module_id: moduleId,
      body,
      status: nextStatus,
      /* The CHECK constraint ties these together: draft iff no timestamp. */
      submitted_at: nextStatus === "draft" ? null : new Date().toISOString(),
    },
    { onConflict: "user_id,module_id" },
  );
  must("save artifact", error);

  await touchEnrollment(supabase, viewer.id, course.id, moduleId);

  revalidatePath(`/learn/${slug}/${n}`);
  revalidatePath(`/learn/${slug}`);
  revalidatePath("/instructor");
}

/**
 * An instructor's feedback on a submitted artifact.
 *
 * ------------------------------------------------------------- what changed
 *
 * This used to be `requireUser`, and the docstring claimed the policy stopped
 * everyone else. It half did. For somebody ELSE's artifact, yes:
 * `artifacts_feedback_as_instructor` requires `teaches_course`, so a student's
 * update matched zero rows — silently, because the error was discarded, so it
 * looked exactly like success.
 *
 * For their OWN artifact, no. `artifacts_own` is a permissive `FOR ALL` policy
 * on `user_id = auth.uid()`, and permissive policies OR together, so a student
 * posting their own artifact id wrote `instructor_feedback`, `feedback_by`
 * (themselves), and `status: 'reviewed'` on their own submission. They could
 * grade themselves, and the artifact id was readable from the browser client.
 *
 * Two fixes, and both are needed. `requireRole` here is the good error message.
 * The `artifacts_guard` trigger is the actual boundary: it pins the feedback
 * columns whenever the caller is the row's owner, so this is closed even for a
 * request that never goes through this function.
 */
export async function leaveFeedback(formData: FormData): Promise<void> {
  const artifactId = formData.get("artifactId") as string;
  const feedback = ((formData.get("feedback") as string | null) ?? "").slice(0, 10_000);
  if (!artifactId) return;

  await requireRole("instructor", "/instructor");
  const supabase = await createClient();

  /* feedback_by and feedback_at are set by the trigger, from auth.uid() and
     now(), so they cannot be forged and are not sent from here. */
  const { error } = await supabase
    .from("artifacts")
    .update({ instructor_feedback: feedback, status: "reviewed" })
    .eq("id", artifactId);
  must("leave feedback", error);

  revalidatePath("/instructor");
}

/* --------------------------------------------------------- outcome sheets */

/**
 * The whole sheet, in one write.
 *
 * Rows arrive as parallel `measure[]` / `before[]` / `after[]` arrays from the
 * form, which is what a `<form>` gives for repeated field names, and they are
 * deleted and re-inserted rather than diffed. A three-row table edited as a unit
 * has no identity worth preserving per row: the sheet is the thing being saved,
 * and nothing points at an individual row.
 *
 * `before_n` / `after_n` are parsed out of the same strings the learner typed.
 * "6 h 00" has no single number in it, so a failed parse stores null and keeps
 * the text — the figure renders what was written and only draws bars for rows
 * where both numbers came out.
 */
export async function saveOutcomeSheet(formData: FormData): Promise<void> {
  const courseId = formData.get("courseId") as string;
  const course = await byId(courseId);
  if (!course) return;

  const submitting = formData.get("intent") === "submit";
  await requireUser(`/dashboard/outcome/${courseId}`);
  const supabase = await createClient();

  const measures = formData.getAll("measure") as string[];
  const befores = formData.getAll("before") as string[];
  const afters = formData.getAll("after") as string[];

  const rows = measures
    .map((measure, i) => ({
      measure: (measure ?? "").trim(),
      before_value: befores[i]?.trim() || null,
      after_value: afters[i]?.trim() || null,
      before_n: numberIn(befores[i]),
      after_n: numberIn(afters[i]),
      position: i,
    }))
    /* An empty measure is an empty row in the form, which a learner gets by
       leaving one of the three blanks alone. It is not data. */
    .filter((r) => r.measure.length > 0)
    .slice(0, 20);

  /*
    One RPC, one transaction.

    This was three separate PostgREST calls — upsert the sheet, DELETE every
    row, INSERT the replacements — with nothing spanning them and no error
    checked on any of them. A failure between the delete and the insert
    destroyed the learner's measures permanently, and because the action then
    revalidated and redirected, the UI reported success over the top of it.

    `save_outcome_sheet` is SECURITY INVOKER, so RLS and the guard triggers
    still apply to every statement inside it. It is here for atomicity, not for
    privilege — a definer version would have quietly become a way around the
    policies it touches.

    It also enforces what the client cannot: the 20-row cap (the form renders
    three; a crafted POST could send fifty thousand), the field lengths, and the
    refusal to submit a sheet with nothing measured on it.
  */
  const { error } = await supabase.rpc("save_outcome_sheet", {
    p_course_id: courseId,
    p_title: ((formData.get("title") as string | null) ?? "").trim(),
    p_footnote: ((formData.get("footnote") as string | null) ?? "").trim() || null,
    p_days: numberIn((formData.get("measured_after_days") as string | null) ?? undefined),
    p_submit: submitting,
    p_rows: rows,
  });
  must("save outcome sheet", error);

  revalidatePath(`/dashboard/outcome/${courseId}`);
  revalidatePath("/dashboard");
  revalidatePath("/judge");

  if (submitting) redirect("/dashboard");
}

/** First number in a string, or null. "6 h 00" → 6, "40 min" → 40, "" → null. */
function numberIn(value: string | undefined): number | null {
  if (!value) return null;
  const match = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

/* ---------------------------------------------------------------- judging */

/**
 * One judge's scores for one sheet, across every criterion at once.
 *
 * The unique constraint is (sheet_id, judge_id, criterion_id), so upserting the
 * whole set makes revising a score an update and leaves any other judge's scores
 * on the same sheet untouched. `judge_id` comes from the session, and the policy
 * checks it again on write — a judge cannot file under a colleague's name.
 */
export async function saveJudgement(formData: FormData): Promise<void> {
  const sheetId = formData.get("sheetId") as string;
  if (!sheetId) return;

  const viewer = await requireRole("judge", `/judge/review/${sheetId}`);
  const supabase = await createClient();

  /*
    READ BY KEY, NOT BY POSITION — and this was a real data-corruption bug.

    The form used to give every radio on the page `name="score"`. HTML groups
    radios by name within a form, so N criteria × 5 buttons were ONE group:
    picking a 4 for the second criterion silently cleared the first, and the
    browser submitted exactly one `score` entry. The action then zipped
    `getAll("criterionId")` (N entries, from always-submitted hidden inputs)
    against `getAll("score")` (1 entry), so the single score landed on
    criterion[0] — whichever criterion the judge had actually been scoring — and
    every other criterion became `Number(undefined)` and was dropped.
    `notes` was mis-attached the same way.

    A judge filed five scores and one was written, against the wrong thing.

    Parallel `getAll` arrays are the whole problem: they only line up if the
    browser submits every control, and unchecked radios are never submitted. So
    the fields are keyed by criterion id now and read by that key, which cannot
    desynchronise no matter what a crafted POST sends.
  */
  const criterionIds = (formData.getAll("criterionId") as string[]).slice(0, 50);

  const rows = criterionIds
    .map((criterion_id) => ({
      sheet_id: sheetId,
      judge_id: viewer.id,
      criterion_id,
      score: Number(formData.get(`score-${criterion_id}`)),
      notes: ((formData.get(`notes-${criterion_id}`) as string | null) ?? "").trim().slice(0, 2000) || null,
    }))
    /* An unscored criterion is left unscored rather than failing the whole
       submission. The 1..5 range is also a CHECK constraint in Postgres. */
    .filter((r) => Number.isInteger(r.score) && r.score >= 1 && r.score <= 5);

  if (rows.length) {
    /* Scope — that this judge's seat covers this sheet's course, that the sheet
       is not a draft, and that the criterion belongs to that same course — is
       enforced by the `judgeable()` predicate on the judgements policy, not
       here. Previously nothing checked any of the three, so any judge could
       score any sheet whose uuid they held, against another course's rubric. */
    const { error } = await supabase
      .from("judgements")
      .upsert(rows, { onConflict: "sheet_id,judge_id,criterion_id" });
    must("file scores", error);
  }

  revalidatePath(`/judge/review/${sheetId}`);
  revalidatePath("/judge");
  redirect("/judge");
}

/**
 * A judge's curriculum review for their seat, for one term.
 *
 * One row per seat per term, so filing again revises rather than appends. The
 * seat is read from the session's seat rather than taken from the form: holding
 * the judge role does not entitle anyone to file the revenue-operations seat's
 * review, and the policy tests the same thing.
 */
const VERDICTS = new Set(["pass", "concerns", "fail"]);

export async function saveCurriculumReview(formData: FormData): Promise<void> {
  const viewer = await requireRole("judge", "/judge");
  const supabase = await createClient();

  /*
    Through the RPC, not a select — and this silently broke filing a review.

    `SELECT` on `judge_seats.user_id` is revoked, and Postgres requires that
    privilege to FILTER on a column as well as to return it. So
    `.eq("user_id", …)` came back as an error, the discarded `{ data: null }`
    became `if (!seat) return`, and the judge filled in the whole form, pressed
    File review, and watched nothing happen — no error, no row.

    `getMySeat()` is the same call the page already uses to render the seat, so
    the two cannot disagree about which seat this is.
  */
  const seat = await getMySeat();
  if (!seat) throw new Error("You do not hold a judge seat.");

  /* [FILL: term definition] — the board "reads the courses each term" and
     nothing on the site says what a term is. Free text until someone decides. */
  const term = ((formData.get("term") as string | null) ?? "").trim().slice(0, 40);

  /*
    The course comes from the seat wherever the seat names one.

    It used to be `formData.get("courseId") ?? seat.reviews_course_id`, which the
    docstring described as reading the seat from the session — true of `seat_id`,
    false of this. A seated judge could file their term's review naming a course
    they do not read. The `reviewable()` predicate on the policy now refuses
    that too, so this is belt and braces.

    A seat with `reads_all_courses` genuinely has to pick, and that is the one
    case the form field is for. Previously that seat — the learning-design one,
    the only seat whose `reviews_course_id` is null — could not file a review at
    all: the hidden input was rendered only when a course existed, so `courseId`
    came out null and the action returned silently. The judge filled the form in,
    pressed the button, and nothing happened and nothing said so.
  */
  const courseId = seat.reads_all_courses
    ? ((formData.get("courseId") as string | null) ?? "")
    : (seat.reviews_course_id ?? "");

  if (!term) throw new Error("A term is required.");
  if (!(await byId(courseId))) throw new Error("Pick a course to review.");

  const verdictRaw = (formData.get("verdict") as string | null) ?? "pass";
  /* Whitelisted rather than cast. An unrecognised value used to reach the
     enum cast and come back as 22P02, which was then discarded — the review
     silently did not save. */
  const verdict = VERDICTS.has(verdictRaw) ? verdictRaw : "pass";

  const { error } = await supabase.from("curriculum_reviews").upsert(
    {
      seat_id: seat.id,
      judge_id: viewer.id,
      course_id: courseId,
      term,
      verdict,
      notes: ((formData.get("notes") as string | null) ?? "").trim().slice(0, 10_000),
    },
    { onConflict: "seat_id,term" },
  );
  must("file curriculum review", error);

  revalidatePath("/judge");
}
