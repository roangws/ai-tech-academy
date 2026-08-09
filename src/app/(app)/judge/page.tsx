import type { Metadata } from "next";
import Link from "next/link";
import { Container, FactsLine, StatusChip } from "@/components/ui";
import { Empty } from "@/components/lms/ui";
import { requireRole } from "@/lib/auth";
import {
  getCurriculumReviews,
  getMySeat,
  getSheetsForReview,
  byId,
} from "@/lib/lms/queries";
import { saveCurriculumReview } from "@/app/actions/lms";
import { courses } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Review board",
  robots: { index: false, follow: false },
};

/**
 * The judge console.
 *
 * ------------------------------------------------------------ two jobs, both
 *
 * content.ts:2562 says exactly what a judge does, and it is two things:
 *
 *   "They read the courses each term, the lessons, the labs and the outcome
 *    sheet a learner leaves with, and they sit on the panel that judges the
 *    events where learners present the workflows they deployed."
 *
 * So this page has two halves. The curriculum review is the first job — one
 * document per seat per term, written against the seat's own `checks` sentence,
 * which is the closest thing to a criterion the board has. The scoring queue is
 * the second, minus the event: what a learner "presents" that exists in this
 * system is their submitted outcome sheet.
 *
 * [FILL: events.] content.ts:2550 already flags the gap — the board copy
 * promises a panel judging events and no event exists anywhere else on the site.
 * Nothing here invents one. Either the copy or the feature has to give, and that
 * is not a decision a console should make on its own.
 *
 * ------------------------------------------------------------- seat, not role
 *
 * Everything on this page keys off the *seat*, not the judge role. Holding the
 * role gets you here; holding the revenue-operations seat is what lets you file
 * the revenue-operations review, and the RLS policy tests the same thing. A
 * judge with no seat sees the empty state below, which is the honest answer:
 * every seat on the site is unbound today.
 */
export default async function JudgePage() {
  const viewer = await requireRole("admin", "/judge");
  const seat = await getMySeat();

  if (!seat) {
    return (
      <Container className="py-12 md:py-16">
        <h1 className="t-display text-ink">Review board</h1>
        <div className="mt-8 max-w-[640px]">
          <Empty
            title="You do not hold a seat yet"
            action={
              <Link href="/review-judge-board" className="t-button text-accent no-underline hover:underline">
                See the six seats
              </Link>
            }
          >
            The board has six seats and each one reads a particular course. A seat is bound
            to a person by an administrator, in{" "}
            <code className="t-meta rounded bg-surface-subtle px-1.5 py-0.5">judge_seats</code>.
            Until then there is no curriculum to review under your name and no sheets to score.
          </Empty>
        </div>
      </Container>
    );
  }

  /* A null reviews_course_id is the learning-design seat, which reads assessment
     across all five rather than one course. getSheetsForReview treats it as
     "every course", and holds_seat() in Postgres agrees. */
  const course = seat.reviews_course_id ? byId.get(seat.reviews_course_id) : null;
  const [sheets, reviews] = await Promise.all([
    getSheetsForReview(seat.reviews_course_id, viewer.id),
    getCurriculumReviews(seat.id),
  ]);

  /* "To score" means this judge has not scored it — not that nobody has.
     Filtering on `status === "submitted"` was the same number before and after
     a judge worked through the whole queue. */
  const unscored = sheets.filter((s) => !s.scoredByMe);

  return (
    <Container className="py-12 md:py-16">
      <h1 className="t-display text-ink">{seat.seat}</h1>
      <p className="t-body mt-3 max-w-[62ch] text-ink-secondary">{seat.checks}</p>
      <FactsLine
        className="mt-4"
        items={[
          course ? `Reads ${course.badge} · ${course.title}` : seat.reviews_label ?? "All courses",
          `${reviews.length} review${reviews.length === 1 ? "" : "s"} filed`,
          `${unscored.length} sheet${unscored.length === 1 ? "" : "s"} to score`,
        ]}
      />

      {/* ------------------------------------------------- 1. curriculum review */}
      <section aria-labelledby="curriculum-heading" className="mt-14">
        <h2 id="curriculum-heading" className="t-h3 text-ink">
          Curriculum review
        </h2>
        <p className="t-body-sm mt-2 max-w-[62ch] text-ink-secondary">
          Read the course this term, the lessons, the labs and the artifact each module
          asks for, against the sentence above. One review per term; filing again revises
          the one already there.
        </p>

        <form action={saveCurriculumReview} className="mt-6 max-w-[720px]">
          {/*
            A seat that reads one course files against that course, and the
            action takes it from the seat rather than from here — a hidden field
            naming the course was mass assignment, and a judge could file their
            term's review against a course they do not read.

            A seat that reads all five genuinely has to choose, and this is the
            case that used to be broken outright: the hidden input was rendered
            only when a course existed, so the learning-design seat submitted no
            course, the action returned silently, and the judge filled the whole
            form in and watched nothing happen.
          */}
          {seat.reads_all_courses ? (
            <div className="mb-5">
              <label htmlFor="courseId" className="t-field block text-ink-secondary">
                Course
              </label>
              <select
                id="courseId"
                name="courseId"
                required
                defaultValue=""
                className="t-body mt-1.5 h-11 w-full max-w-[380px] rounded-[var(--radius-control)] border border-line-control bg-surface px-3 text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25"
              >
                <option value="" disabled>
                  Pick the course this review is about
                </option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.badge} · {c.title}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="grid gap-5 sm:grid-cols-[180px_minmax(0,1fr)]">
            <div>
              <label htmlFor="term" className="t-field block text-ink-secondary">
                Term
              </label>
              {/* [FILL: term definition.] The board "reads the courses each term"
                  and nothing on the site says what a term is, so it is free text
                  with a shape suggested rather than an enum guessing at a calendar. */}
              <input
                id="term"
                name="term"
                type="text"
                required
                placeholder="2026-H2"
                className="t-body mt-1.5 h-11 w-full rounded-[var(--radius-control)] border border-line-control bg-surface px-3 text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/25"
              />
            </div>
            {/*
              A real `<fieldset>` and `<legend>`, which is what natively groups
              controls and what a screen reader announces when focus enters the
              group. This was a bare `<span>` beside a `<div>`, so focus landed
              on "pass, radio button, 1 of 3" with no indication of the question
              — three unlabelled adjectives on a form that also has a Term field
              and a Notes field. `pass` is pre-checked, so a judge who never
              perceived the group filed a passing verdict by default.

              `ChoiceGroup` in sign-up-steps.tsx already establishes the pattern
              and its doc comment gives this exact argument; this was the one
              place that copied the pills and dropped the semantics.
            */}
            <fieldset>
              <legend className="t-field text-ink-secondary">Verdict</legend>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {(["pass", "concerns", "fail"] as const).map((v, i) => (
                  <div key={v}>
                    {/*
                      Radios styled as pills, matching the pattern sign-up-steps.tsx
                      established: a real `<input type="radio">` kept off-screen with
                      `sr-only` rather than `display: none`, so it stays focusable,
                      stays in the tab order, is announced, and arrow keys still move
                      within the group. `peer-checked` does the appearance.
                    */}
                    <input
                      type="radio"
                      id={`verdict-${v}`}
                      name="verdict"
                      value={v}
                      defaultChecked={i === 0}
                      className="peer sr-only"
                    />
                    <label
                      htmlFor={`verdict-${v}`}
                      className="t-body-sm inline-flex min-h-[38px] cursor-pointer items-center rounded-full border border-line-control bg-surface px-3.5 capitalize text-ink-secondary transition-colors hover:border-line-strong peer-checked:border-accent peer-checked:bg-accent-tint peer-checked:text-accent peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[color:var(--focus)]"
                    >
                      {v}
                    </label>
                  </div>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="mt-5">
            <label htmlFor="notes" className="t-field block text-ink-secondary">
              What you checked, and what you found
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={5}
              className="t-body mt-1.5 w-full rounded-[var(--radius-card)] border border-line-control bg-surface p-3.5 text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25"
              placeholder={seat.checks}
            />
          </div>

          <button
            type="submit"
            className="t-button mt-5 h-11 rounded-[var(--radius-control)] bg-accent px-5 text-on-accent transition-colors hover:bg-accent-hover"
          >
            File review
          </button>
        </form>

        {reviews.length > 0 ? (
          <ul className="mt-8 divide-y divide-line border-y border-line">
            {reviews.map((r) => (
              <li key={r.id} className="py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="t-card-title text-ink">{r.term}</span>
                  <StatusChip>{r.verdict}</StatusChip>
                </div>
                {r.notes ? (
                  <p className="t-body-sm mt-1.5 whitespace-pre-wrap text-ink-secondary">{r.notes}</p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {/* ----------------------------------------------------- 2. scoring queue */}
      <section aria-labelledby="sheets-heading" className="mt-16">
        <h2 id="sheets-heading" className="t-h3 text-ink">
          Outcome sheets to score
        </h2>
        <p className="t-body-sm mt-2 max-w-[62ch] text-ink-secondary">
          What a learner deployed and measured, scored against the rubric. Sheets appear
          here when they are submitted; a draft never does.
        </p>

        {sheets.length === 0 ? (
          <div className="mt-6">
            <Empty title="No sheets submitted yet">
              A learner submits an outcome sheet once their workflow is running live and they
              have measured it twice: a baseline in module 1, and the same measure again
              afterwards.
            </Empty>
          </div>
        ) : (
          <ul className="mt-6 grid gap-4">
            {sheets.map((sheet) => (
              <li key={sheet.id}>
                <Link
                  href={`/judge/review/${sheet.id}`}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-5 no-underline transition-shadow hover:shadow-e1"
                >
                  <span className="min-w-0">
                    <span className="t-card-title block text-ink">{sheet.title || "Untitled workflow"}</span>
                    {/* The reference, never a name. A judge scores a deployed
                        workflow against a rubric, and knowing whose it is can
                        only bias that — which is why the profiles policy does not
                        extend to judges and why nothing here asks. */}
                    <span className="t-meta mt-1 block text-ink-muted">
                      {sheet.reference} · {byId.get(sheet.course_id)?.badge ?? sheet.course_id} ·{" "}
                      {sheet.rows.length} measure{sheet.rows.length === 1 ? "" : "s"}
                      {sheet.measured_after_days ? ` · measured after ${sheet.measured_after_days} days` : ""}
                    </span>
                  </span>
                  <StatusChip>{sheet.scoredByMe ? "You have scored this" : "Awaiting your score"}</StatusChip>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}
