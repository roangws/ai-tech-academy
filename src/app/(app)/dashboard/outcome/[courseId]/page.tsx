import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, StatusChip } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getOutcomeSheet, byId } from "@/lib/lms/queries";
import { saveOutcomeSheet } from "@/app/actions/lms";
import { outcomes } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Outcome sheet",
  robots: { index: false, follow: false },
};

/**
 * The outcome sheet, as something a learner fills in.
 *
 * ---------------------------------------------------------------- what it is
 *
 * `outcomes.sheet` in content.ts is the homepage's illustration of what a
 * learner leaves with: a title, three measures, a before and an after for each,
 * a status and a footnote saying who measured it. It has always been the site's
 * definition of completion — the FAQ says "A course completes when your workflow
 * runs live and you have measured it" — and it was, until now, a picture of a
 * thing rather than the thing.
 *
 * This is the same object, editable. The column labels come from
 * `outcomes.sheet.columns` so the form and the illustration cannot drift, and
 * the illustration's own rows are the placeholders, which makes the example on
 * the homepage double as the instructions here.
 *
 * ------------------------------------------------------------ three rows, fixed
 *
 * Three, because that is what the figure has and what a before/after table can
 * hold before it stops being readable at a glance. A row left blank is dropped
 * on save rather than stored empty, so three is a ceiling and not a quota.
 *
 * [FILL: is three the right number?] Nothing in the brief says. If a learner
 * needs a fourth measure this becomes an add-a-row control and the server action
 * needs no change — it already reads however many parallel fields arrive.
 *
 * ----------------------------------------------------------------- submitting
 *
 * Saving keeps it private. Submitting is what a judge can read: the
 * `sheets_read_as_judge` policy tests `status <> 'draft'`, so a draft is
 * invisible to the board no matter what any page does. Which is why the two are
 * separate buttons with different words, and why the submit one says what it
 * means.
 */
export default async function OutcomeSheetPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await byId(courseId);
  if (!course) notFound();

  const viewer = await requireUser(`/dashboard/outcome/${courseId}`);
  const existing = await getOutcomeSheet(viewer.id, courseId);

  const sheet = existing?.sheet ?? null;
  const rows = existing?.rows ?? [];
  /*
    Submitted, not just verified.

    This used to lock only on `verified`, which meant a learner could reopen a
    submitted sheet and rewrite it — and because judges score against
    `sheet_id`, any scores already filed stayed attached to numbers that no
    longer existed. Saving also wrote `status: 'draft'`, which pulled the sheet
    out of every judge's console silently (all the read policies test
    `status <> 'draft'`).

    The `sheets_guard` trigger in Postgres is what actually enforces this now;
    the page matching it is so the reader is told before they type rather than
    after they press save.
  */
  const locked = Boolean(sheet && sheet.status !== "draft");
  const cols = outcomes.sheet.columns;

  /* Three slots, filled from whatever exists. The example's own measures are the
     placeholders, so the homepage figure reads as the worked example for this. */
  const slots = [0, 1, 2].map((i) => rows[i] ?? null);

  return (
    <Container className="py-12 md:py-16">
      <nav aria-label="Breadcrumb" className="t-meta text-ink-muted">
        <Link href="/dashboard" className="text-ink-secondary no-underline hover:underline">
          Dashboard
        </Link>
        <span className="px-1.5 text-line-strong">/</span>
        Outcome sheet
      </nav>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <h1 className="t-h2 text-ink">{outcomes.sheet.label}</h1>
        {sheet ? (
          <StatusChip>{sheet.status}</StatusChip>
        ) : null}
      </div>
      <p className="t-body mt-3 max-w-[62ch] text-ink-secondary">
        {course.badge} · {course.title}. Record the baseline you took in module 1, then the
        same measurement after your workflow has been running. Measure the same thing the
        same way, or the sheet says nothing.
      </p>

      {/*
        `readOnly`, not `disabled`, on every field below — which is why this note
        says "read it back" rather than apologising for a wall of grey boxes.

        A disabled control leaves the tab order, is announced as unavailable, and
        in several browsers its text cannot be selected or copied. This is a
        document the learner is meant to quote from, so a keyboard or
        screen-reader user could not reach their own measures. `readOnly` keeps
        all of that and still refuses the edit, and the submit buttons are not
        rendered at all when locked, so there is no form left to protect.
      */}
      {locked ? (
        <p
          role="status"
          className="t-body-sm mt-6 max-w-[62ch] rounded-[var(--radius-card)] border border-line bg-surface-subtle p-4 text-ink-secondary"
        >
          {sheet?.status === "verified"
            ? "The review board has verified this sheet. It is the record of what you deployed, and it is yours to read back and share."
            : "You have submitted this sheet, so it is now with the review board and is no longer editable. Judges score what you submitted, so it has to stay as it was."}
        </p>
      ) : null}

      <form action={saveOutcomeSheet} className="mt-9 max-w-[820px]">
        <input type="hidden" name="courseId" value={courseId} />

        <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_180px]">
          <div>
            <label htmlFor="title" className="t-field block text-ink-secondary">
              What you built
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              readOnly={locked}
              defaultValue={sheet?.title ?? ""}
              placeholder={outcomes.sheet.title}
              className="t-body mt-1.5 h-11 w-full rounded-[var(--radius-control)] border border-line-control bg-surface px-3 text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/25 read-only:bg-surface-subtle read-only:text-ink-muted"
            />
          </div>
          <div>
            <label htmlFor="measured_after_days" className="t-field block text-ink-secondary">
              Measured after (days)
            </label>
            <input
              id="measured_after_days"
              name="measured_after_days"
              type="number"
              min={1}
              max={365}
              readOnly={locked}
              defaultValue={sheet?.measured_after_days ?? 14}
              className="t-body mt-1.5 h-11 w-full rounded-[var(--radius-control)] border border-line-control bg-surface px-3 text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25 read-only:bg-surface-subtle read-only:text-ink-muted"
            />
          </div>
        </div>

        {/* ------------------------------------------------------------- rows */}
        {/*
          A real `<table>`. Three measures with a before and an after is tabular
          data by any definition, and a grid of divs would lose the column
          association entirely.

          One caveat, because the first version of this comment overclaimed. The
          row header that would let a screen reader say "Time per cycle, After,
          40 min" cannot exist here: the first cell of each row holds an input,
          not text, so there is nothing for `scope="row"` to name. The
          `aria-label` on each field carries the row number instead, which is the
          available substitute rather than an equivalent. The judge's read-only
          view of the same table DOES use `scope="row"`, because there the
          measure is text.
        */}
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse">
            <caption className="sr-only">
              Your measures, before and after the workflow was deployed
            </caption>
            <thead>
              <tr className="border-b border-line-strong">
                <th scope="col" className="t-label py-2.5 text-left text-ink-muted">
                  {cols.measure}
                </th>
                <th scope="col" className="t-label py-2.5 text-left text-ink-muted">
                  {cols.before}
                </th>
                <th scope="col" className="t-label py-2.5 text-left text-ink-muted">
                  {cols.after}
                </th>
              </tr>
            </thead>
            <tbody>
              {slots.map((row, i) => (
                <tr key={i} className="border-b border-line">
                  <td className="py-2.5 pr-3">
                    <input
                      name="measure"
                      type="text"
                      readOnly={locked}
                      defaultValue={row?.measure ?? ""}
                      placeholder={outcomes.sheet.rows[i]?.measure ?? "A measure"}
                      aria-label={`${cols.measure}, row ${i + 1}`}
                      className={fieldClass}
                    />
                  </td>
                  <td className="py-2.5 pr-3">
                    <input
                      name="before"
                      type="text"
                      readOnly={locked}
                      defaultValue={row?.before_value ?? ""}
                      placeholder={outcomes.sheet.rows[i]?.before ?? ""}
                      aria-label={`${cols.before}, row ${i + 1}`}
                      className={fieldClass}
                    />
                  </td>
                  <td className="py-2.5">
                    <input
                      name="after"
                      type="text"
                      readOnly={locked}
                      defaultValue={row?.after_value ?? ""}
                      placeholder={outcomes.sheet.rows[i]?.after ?? ""}
                      aria-label={`${cols.after}, row ${i + 1}`}
                      className={fieldClass}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="t-micro mt-2 text-ink-muted">
          Write the figures as you would say them: &ldquo;6 h 00&rdquo;, &ldquo;40 min&rdquo;,
          &ldquo;23&rdquo;. Leave a row blank to drop it.
        </p>

        <div className="mt-8">
          <label htmlFor="footnote" className="t-field block text-ink-secondary">
            How it was measured
          </label>
          <textarea
            id="footnote"
            name="footnote"
            rows={3}
            readOnly={locked}
            defaultValue={sheet?.footnote ?? ""}
            placeholder={outcomes.sheet.footnote}
            className="t-body mt-1.5 w-full rounded-[var(--radius-card)] border border-line-control bg-surface p-3.5 text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/25 read-only:bg-surface-subtle read-only:text-ink-muted"
          />
        </div>

        {!locked ? (
          <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-line pt-6">
            <button
              type="submit"
              name="intent"
              value="save"
              className="t-button h-11 rounded-[var(--radius-control)] border border-line-control px-5 text-ink-secondary transition-colors hover:border-line-strong hover:text-ink"
            >
              Save draft
            </button>
            <button
              type="submit"
              name="intent"
              value="submit"
              className="t-button h-11 rounded-[var(--radius-control)] bg-accent px-5 text-on-accent transition-colors hover:bg-accent-hover"
            >
              Submit to the review board
            </button>
            <span className="t-meta text-ink-muted">
              {sheet?.status === "submitted"
                ? "Submitted. The board can read it."
                : "A draft is private until you submit it."}
            </span>
          </div>
        ) : null}
      </form>
    </Container>
  );
}

const fieldClass =
  "t-body h-10 w-full rounded-[var(--radius-control)] border border-line-control bg-surface px-2.5 text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/25 read-only:bg-surface-subtle read-only:text-ink-muted";
