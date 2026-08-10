import type { Metadata } from "next";
import Link from "next/link";
import { SealCheckIcon, TrashIcon } from "@phosphor-icons/react/dist/ssr";
import { ActionForm, Field, Save, Danger } from "@/components/lms/admin-form";
import { listCertifications } from "@/lib/lms/certifications";
import { listPeople, listLearners } from "@/lib/lms/admin";
import { getCatalog } from "@/lib/catalog";
import { issueCompletion, revokeCompletion } from "@/app/actions/certifications";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Certifications",
  robots: { index: false, follow: false },
};

const select =
  "t-body-sm mt-1 h-10 w-full rounded-[var(--radius-control)] border border-line-control bg-surface px-3 text-ink transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25";

/**
 * Every completion record on the site, and the two things an admin does to one.
 *
 * ------------------------------------------------------------------ the report
 *
 * Roan: "as admin, I'm not able to see the person's certification… I want to be
 * able to view and change those things."
 *
 * Both halves were true. `completion_records` has been in the schema since it
 * was written, `issue_completion` has existed unused in the database, and the
 * only place either surfaced was a single `reference` string tucked into a cell
 * on /admin/learners. There was no way to see who held what, and no way to grant
 * or take one back short of SQL.
 *
 * ------------------------------------------------------- who is nearly there
 *
 * The second table is the one that makes this a console rather than a log. A
 * list of records already issued answers "what happened"; the question an
 * administrator actually has is "who is waiting" — somebody who finished a
 * course and never pressed the button, which is the normal case for anyone who
 * completed a course before this page existed. Surfacing them with the issue
 * control pre-filled is the difference between a report and a tool.
 *
 * Learners at 100% with no record are separated from everybody else because
 * those are the only ones where issuing is uncontroversial: no `force`, no
 * override, the same test the learner's own button passes.
 */
export default async function AdminCertifications() {
  const [records, people, learners, catalog] = await Promise.all([
    listCertifications(),
    listPeople(),
    listLearners(),
    getCatalog(),
  ]);

  const held = new Set(records.map((r) => `${r.user_id}:${r.course_id}`));

  /* Finished every lesson, holds no record. `listLearners` is one row per
     enrolment and already carries the counts, so this is a filter rather than a
     fourth query. */
  const waiting = learners.filter(
    (l) => l.total > 0 && l.done >= l.total && !held.has(`${l.profile.id}:${l.course.id}`),
  );

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="t-h2 text-ink">Certifications</h1>
          <p className="t-body-sm mt-1.5 max-w-[62ch] text-ink-secondary">
            A completion record is earned by finishing every lesson in a course. Learners take their
            own from{" "}
            <code className="t-meta">/dashboard/certifications</code>; these are the same records.
          </p>
        </div>
        <p className="t-meta text-ink-muted">
          {records.length} issued · {waiting.length} waiting
        </p>
      </div>

      {/* ------------------------------------------------------- waiting */}
      {waiting.length > 0 ? (
        <section aria-labelledby="waiting" className="mt-8">
          <h2 id="waiting" className="t-h3 text-ink">
            Finished, no record yet
          </h2>
          <p className="t-meta mt-1 max-w-[64ch] text-ink-muted">
            Every lesson complete and nobody has pressed the button. Issuing here needs no override.
          </p>

          <ul className="mt-4 flex flex-col gap-2">
            {waiting.map((l) => (
              <li
                key={`${l.profile.id}-${l.course.id}`}
                className="flex flex-wrap items-center gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-3"
              >
                <span className="min-w-0 flex-1">
                  <span className="t-card-title block text-ink">
                    {[l.profile.first_name, l.profile.last_name].filter(Boolean).join(" ") ||
                      l.profile.email}
                  </span>
                  <span className="t-meta block text-ink-muted">
                    {l.course.title} · {l.done} of {l.total} lessons
                  </span>
                </span>
                <ActionForm action={issueCompletion}>
                  <input type="hidden" name="userId" value={l.profile.id} />
                  <input type="hidden" name="courseId" value={l.course.id} />
                  <Save>
                    <SealCheckIcon size={14} weight="bold" aria-hidden="true" />
                    Issue
                  </Save>
                </ActionForm>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* --------------------------------------------------- issue by hand */}
      <ActionForm
        action={issueCompletion}
        className="mt-8 rounded-[var(--radius-feature)] border border-line bg-surface-subtle p-4"
      >
        <p className="t-card-title text-ink">Issue one by hand</p>
        <p className="t-meta mt-1 max-w-[64ch] text-ink-muted">
          For somebody who did the work outside this system, or whose course was restructured under
          them. Without the override this refuses exactly as the learner&rsquo;s own button does.
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label="Person">
            <select name="userId" className={select} defaultValue="">
              <option value="">Pick somebody</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {[p.first_name, p.last_name].filter(Boolean).join(" ") || p.email} · {p.email}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Course">
            <select name="courseId" className={select} defaultValue="">
              <option value="">Pick a course</option>
              {catalog.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.badge} · {c.title}
                </option>
              ))}
            </select>
          </Field>
          <Save>
            <SealCheckIcon size={15} weight="bold" aria-hidden="true" />
            Issue
          </Save>
        </div>

        {/* The override is a separate, named act rather than a silent fallback.
            An admin who ticks this is asserting something the data does not
            support, and the label says so. */}
        <label className="t-body-sm mt-3 flex items-center gap-2 text-ink-secondary">
          <input
            type="checkbox"
            name="force"
            className="size-4 accent-[color:var(--accent)]"
          />
          Issue anyway, even if they have not finished every lesson
        </label>
      </ActionForm>

      {/* ------------------------------------------------------- the records */}
      <section aria-labelledby="issued" className="mt-10">
        <h2 id="issued" className="t-h3 text-ink">
          Issued
        </h2>

        {records.length === 0 ? (
          <p className="t-body-sm mt-3 rounded-[var(--radius-card)] border border-dashed border-line-control bg-surface-subtle p-4 text-ink-secondary">
            Nothing issued yet. The first record appears the moment a learner finishes a course and
            takes it.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {records.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-3"
              >
                <span className="min-w-0 flex-1">
                  <span className="t-card-title block text-ink">{r.name}</span>
                  <span className="t-meta block text-ink-muted">
                    {r.email ? `${r.email} · ` : ""}
                    {r.courseBadge} · {r.courseTitle}
                  </span>
                </span>

                <span className="t-meta text-right text-ink-secondary">
                  <code className="block tabular-nums text-ink">{r.reference}</code>
                  <span className="text-ink-muted">
                    {new Date(r.issued_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </span>

                {/* Revoking removes the document and nothing else — the
                    enrolment's `completed_at` and the learner's progress stay,
                    so they can take it again the moment they are eligible.
                    actions/certifications.ts has the reasoning. */}
                <form action={revokeCompletion}>
                  <input type="hidden" name="recordId" value={r.id} />
                  <Danger title={`Remove ${r.name}'s record for ${r.courseTitle}. Their progress is untouched.`}>
                    <TrashIcon size={13} aria-hidden="true" />
                    Revoke
                  </Danger>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="t-meta mt-6 text-ink-muted">
        Per-learner progress lives on{" "}
        <Link href="/admin/learners" className="text-accent no-underline hover:underline">
          Learners
        </Link>
        .
      </p>
    </>
  );
}
