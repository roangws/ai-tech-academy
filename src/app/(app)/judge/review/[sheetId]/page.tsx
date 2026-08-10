import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, StatusChip } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { getRubric, getMySeat, getSheetForReview, byId } from "@/lib/lms/queries";
import { saveJudgement } from "@/app/actions/lms";
import { createClient } from "@/lib/supabase/server";
import { outcomes } from "@/lib/content";
import type { Judgement } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Score a sheet",
  robots: { index: false, follow: false },
};

/**
 * Scoring one outcome sheet against the rubric.
 *
 * -------------------------------------------------------------- what is shown
 *
 * The measures, and nothing about the person. No name, no email, no learner id
 * on screen — just the sheet's own reference. That is enforced rather than
 * observed: the `profiles_read_as_instructor` policy does not extend to judges,
 * so a query for the name would come back empty. Not asking is the design; the
 * policy is the guarantee.
 *
 * -------------------------------------------------------- one row per criterion
 *
 * `judgements` is keyed (sheet_id, judge_id, criterion_id), so this form writes
 * one row per criterion and a second judge scoring the same sheet writes their
 * own set beside it. Revising a score is an update on the same key. A single
 * score per sheet would have made two judges a conflict and a re-weighted rubric
 * a re-score.
 *
 * The scale is 1–5, checked here and again by a check constraint in Postgres.
 */
export default async function ReviewSheetPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  /* `judge`, not `admin`. The argument order was right and the role was wrong on
     all three judging screens, so a seated judge opening their own scoring page
     was redirected to /dashboard. See the note on /judge. */
  const viewer = await requireRole("judge", `/judge/review/${sheetId}`);

  const seat = await getMySeat();
  if (!seat) notFound();

  /*
    Fetched by id.

    The first version pulled every sheet the seat can score and then `.find`-ed
    one out of the list, on the argument that it kept a single definition of
    scope. That reasoning does not survive contact with the learning-design
    seat, whose `reviews_course_id` is null: opening one sheet pulled every
    non-draft sheet on the site, with all of their measures, to render one.
    Scope is enforced by `sheets_read_as_judge` in Postgres, which is where it
    belongs — a judge who asks for a sheet outside their seat gets nothing back.
  */
  const sheet = await getSheetForReview(sheetId);
  if (!sheet) notFound();

  /* The rubric and any prior scores are independent of each other, so they go
     out together rather than in two waves. */
  const supabase = await createClient();
  const [criteria, { data: existing }] = await Promise.all([
    getRubric(sheet.course_id),
    supabase.from("judgements").select("*").eq("sheet_id", sheetId).eq("judge_id", viewer.id),
  ]);

  const scored = new Map((existing ?? []).map((j) => [j.criterion_id as string, j as Judgement]));
  const cols = outcomes.sheet.columns;
  const course = await byId(sheet.course_id);

  return (
    <Container className="py-12 md:py-16">
      <nav aria-label="Breadcrumb" className="t-meta text-ink-muted">
        {/* /judge/curriculum, which is where the queue that linked here lives
            now. /judge is the events console. */}
        <Link href="/judge/curriculum" className="text-ink-secondary no-underline hover:underline">
          {seat.seat}
        </Link>
        <span className="px-1.5 text-line-strong">/</span>
        {sheet.reference}
      </nav>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <h1 className="t-h2 text-ink">{sheet.title || "Untitled workflow"}</h1>
        <StatusChip>{sheet.status}</StatusChip>
      </div>
      <p className="t-meta mt-2 text-ink-muted">
        {sheet.reference} · {course ? `${course.badge} · ${course.title}` : sheet.course_id}
        {sheet.measured_after_days ? ` · measured after ${sheet.measured_after_days} days` : ""}
      </p>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        {/* ------------------------------------------------------ the evidence */}
        <section aria-labelledby="measures-heading">
          <h2 id="measures-heading" className="t-h3 text-ink">
            What they measured
          </h2>

          {sheet.rows.length === 0 ? (
            <p className="t-body-sm mt-4 text-ink-secondary">
              This sheet was submitted with no measures on it, which is itself worth scoring.
            </p>
          ) : (
            <table className="mt-5 w-full border-collapse">
              <caption className="sr-only">Measures before and after deployment</caption>
              <thead>
                <tr className="border-b border-line-strong">
                  <th scope="col" className="t-label py-2.5 text-left text-ink-muted">
                    {cols.measure}
                  </th>
                  <th scope="col" className="t-label py-2.5 text-right text-ink-muted">
                    {cols.before}
                  </th>
                  <th scope="col" className="t-label py-2.5 text-right text-ink-muted">
                    {cols.after}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sheet.rows.map((row) => (
                  <tr key={row.id} className="border-b border-line">
                    {/* `scope="row"`, so a screen reader in the third cell says
                        "Time per cycle, After, 40 min" rather than "After, 40
                        min" — with three measures on screen, the column alone
                        does not say which number belongs to which. */}
                    <th scope="row" className="t-body-sm py-3 text-left font-normal text-ink">
                      {row.measure}
                    </th>
                    <td className="t-figure py-3 text-right text-ink-muted">
                      {row.before_value ?? <span className="t-meta">Not recorded</span>}
                    </td>
                    <td className="t-figure py-3 text-right text-ink">
                      {row.after_value ?? <span className="t-meta text-ink-muted">Not recorded</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {sheet.footnote ? (
            <div className="mt-6 rounded-[var(--radius-card)] border border-line bg-surface-subtle p-4">
              <p className="t-label text-ink-muted">How it was measured</p>
              <p className="t-body-sm mt-1.5 whitespace-pre-wrap text-ink-secondary">
                {sheet.footnote}
              </p>
            </div>
          ) : null}
        </section>

        {/* --------------------------------------------------------- the rubric */}
        <section aria-labelledby="rubric-heading">
          <h2 id="rubric-heading" className="t-h3 text-ink">
            Your score
          </h2>
          {criteria.length === 0 ? (
            <p className="t-body-sm mt-4 text-ink-secondary">
              No rubric criteria exist for this course yet. [FILL: rubric criteria.]
            </p>
          ) : (
            <form action={saveJudgement} className="mt-5">
              <input type="hidden" name="sheetId" value={sheetId} />

              <ul className="grid gap-7">
                {criteria.map((c) => {
                  const prior = scored.get(c.id);
                  return (
                    <li key={c.id}>
                      <input type="hidden" name="criterionId" value={c.id} />
                      <fieldset>
                        <legend className="t-card-title text-ink">{c.label}</legend>
                        {c.description ? (
                          <p className="t-body-sm mt-1 text-ink-secondary">{c.description}</p>
                        ) : null}

                        {/*
                          `name` is keyed by criterion, and that is load-bearing
                          rather than tidy. Every radio on this page shared
                          `name="score"`, and HTML groups radios by name within a
                          form — so all N criteria were one group. Scoring the
                          second criterion cleared the first, only one `score`
                          was ever submitted, and the action attributed it to
                          whichever criterion happened to be first. A judge filed
                          five scores and one was written, against the wrong
                          thing. Two pre-checked radios on revisit collapsed to
                          the last one for the same reason.
                        */}
                        <div className="mt-3 flex gap-2">
                          {[1, 2, 3, 4, 5].map((score) => (
                            <div key={score}>
                              <input
                                type="radio"
                                id={`${c.id}-${score}`}
                                name={`score-${c.id}`}
                                value={score}
                                defaultChecked={prior?.score === score}
                                className="peer sr-only"
                              />
                              <label
                                htmlFor={`${c.id}-${score}`}
                                className="t-body-sm grid size-10 cursor-pointer place-items-center rounded-[var(--radius-control)] border border-line-control bg-surface text-ink-secondary transition-colors hover:border-line-strong peer-checked:border-accent peer-checked:bg-accent peer-checked:text-on-accent peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[color:var(--focus)]"
                              >
                                {score}
                                <span className="sr-only"> out of 5</span>
                              </label>
                            </div>
                          ))}
                        </div>

                        <label htmlFor={`${c.id}-notes`} className="sr-only">
                          Notes on {c.label}
                        </label>
                        <input
                          id={`${c.id}-notes`}
                          name={`notes-${c.id}`}
                          type="text"
                          defaultValue={prior?.notes ?? ""}
                          placeholder="Optional note"
                          className="t-body-sm mt-2.5 h-10 w-full rounded-[var(--radius-control)] border border-line-control bg-surface px-3 text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/25"
                        />
                      </fieldset>
                    </li>
                  );
                })}
              </ul>

              <button
                type="submit"
                className="t-button mt-8 h-11 w-full rounded-[var(--radius-control)] bg-accent text-on-accent transition-colors hover:bg-accent-hover"
              >
                {scored.size ? "Update my scores" : "File my scores"}
              </button>
              <p className="t-micro mt-3 text-ink-muted">
                Your scores are yours. Other judges on this sheet file their own, and the
                learner can read all of them.
              </p>
            </form>
          )}
        </section>
      </div>
    </Container>
  );
}
