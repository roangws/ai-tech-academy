import type { Metadata } from "next";
import Link from "next/link";
import { SealCheckIcon } from "@phosphor-icons/react/dist/ssr";
import { Meter, Empty } from "@/components/lms/ui";
import { listLearners } from "@/lib/lms/admin";
import { issueCompletion } from "@/app/actions/admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Learners", robots: { index: false, follow: false } };

/**
 * Every enrolment, and whether anyone is stuck.
 *
 * Read-only on the work itself, deliberately. An admin reading a learner's
 * artifact is defensible; editing it is not, and `artifacts_guard` would treat
 * an admin as the instructor branch and silently pin the body anyway — a
 * confusing half-failure rather than a refusal.
 *
 * ------------------------------------------------------------ issuing a record
 *
 * The two dead paths in this schema close here. `enrollments_guard` has always
 * said only an admin may set `status = 'completed'`, and there was no admin
 * UPDATE policy, so that branch was unreachable. And `completion_records` has
 * never been written by anything, while module 08 of course A is titled "the
 * record that proves it ran".
 *
 * One RPC does both in a transaction, because a completion record without a
 * completed enrolment — or the reverse — is a state nobody can explain to the
 * learner looking at it.
 *
 * The force checkbox exists because lesson ticks are self-declared: "every
 * lesson complete" is a courtesy check, not a fact. An admin who has read the
 * outcome sheet knows more than the counter does.
 */
export default async function AdminLearners() {
  const learners = await listLearners();

  if (learners.length === 0) {
    return (
      <>
        <h1 className="t-h2 text-ink">Learners</h1>
        <div className="mt-6">
          <Empty title="Nobody is enrolled yet">
            An enrolment is created the first time somebody ticks a lesson.
          </Empty>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="t-h2 text-ink">Learners</h1>
      <p className="t-body-sm mt-1.5 max-w-[62ch] text-ink-secondary">
        {learners.length} enrolment{learners.length === 1 ? "" : "s"}, most recently active first.
      </p>

      <ul className="mt-6 flex flex-col gap-3">
        {learners.map((l) => {
          const name =
            [l.profile.first_name, l.profile.last_name].filter(Boolean).join(" ") || "No name";
          const complete = l.done >= l.total;

          return (
            <li
              key={`${l.profile.id}/${l.course.id}`}
              className="rounded-[var(--radius-feature)] border border-line bg-surface p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <p className="t-body-sm text-ink">{name}</p>
                  <p className="t-meta text-ink-muted">
                    {l.profile.email} · {l.course.title}
                  </p>
                </div>
                {l.completion ? (
                  <p className="t-meta inline-flex items-center gap-1.5 rounded-full bg-accent-tint px-2.5 py-1 text-accent">
                    <SealCheckIcon size={13} weight="fill" aria-hidden="true" />
                    {l.completion}
                  </p>
                ) : null}
              </div>

              <Meter className="mt-3 max-w-[360px]" done={l.done} total={l.total} />

              {/* The two artifact counts that used to lead this line are gone
                  with the module hand-in, 9 Aug. "0 awaiting review · 0 reviewed"
                  on every learner forever is not a fact about the learner, it is
                  a fact about a form that no longer exists. */}
              <p className="t-meta mt-3 text-ink-secondary">
                {l.sheet ? `outcome sheet ${l.sheet.status}` : "no outcome sheet"}
              </p>

              {!l.completion ? (
                <form action={issueCompletion} className="mt-4 flex flex-wrap items-center gap-4">
                  <input type="hidden" name="userId" value={l.profile.id} />
                  <input type="hidden" name="courseId" value={l.course.id} />
                  <button
                    type="submit"
                    className="t-button h-11 rounded-[var(--radius-control)] border border-line-control px-4 text-ink-secondary transition-colors hover:border-accent hover:text-accent"
                  >
                    Issue completion record
                  </button>
                  {!complete ? (
                    <label className="t-meta inline-flex min-h-[44px] cursor-pointer items-center gap-2 text-ink-muted">
                      <input
                        type="checkbox"
                        name="force"
                        value="1"
                        className="size-4 accent-[var(--accent)]"
                      />
                      Issue anyway ({l.done} of {l.total} lessons ticked)
                    </label>
                  ) : null}
                </form>
              ) : null}

              <Link
                href={`/learn/${l.course.slug}`}
                className="t-meta mt-3 inline-flex min-h-[44px] items-center text-ink-muted no-underline underline-offset-4 hover:text-ink hover:underline"
              >
                Open the course
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
