import type { Metadata } from "next";
import Link from "next/link";
import { Container, FactsLine, StatusChip } from "@/components/ui";
import { CourseGlyph } from "@/components/course/icons";
import { Empty } from "@/components/lms/ui";
import { requireRole } from "@/lib/auth";
import { getTaughtCourses, getSubmittedWork, byId } from "@/lib/lms/queries";
import { leaveFeedback } from "@/app/actions/lms";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Instructor",
  robots: { index: false, follow: false },
};

/**
 * The instructor console: assigned courses, and the work waiting on a reply.
 *
 * ------------------------------------------------------------ what it can see
 *
 * Only submitted artifacts, and only for courses this person is assigned to.
 * Neither of those is a filter written on this page — both are RLS policies, and
 * `getSubmittedWork` deliberately does not repeat them. A drafted artifact is
 * invisible here because Postgres refuses to return it, not because a query
 * remembered to say `neq("status", "draft")`.
 *
 * ------------------------------------------------------- the empty state is real
 *
 * [FILL: instructor to course mapping.] Nobody is assigned to anything yet.
 * content.ts names five instructors and, by policy, gives four of them no course
 * — the gap src/lib/seo.ts:67 already documents in prose. So the honest first
 * screen for a real instructor today is "you have no courses assigned", and it
 * says who can fix that rather than rendering an empty table and letting them
 * wonder whether it is broken.
 */
export default async function InstructorPage() {
  const viewer = await requireRole("instructor", "/instructor");
  const taught = await getTaughtCourses(viewer.id);
  const work = await getSubmittedWork(taught.map((c) => c.id));

  const awaiting = work.filter((w) => w.status === "submitted");
  const reviewed = work.filter((w) => w.status === "reviewed");

  return (
    <Container className="py-12 md:py-16">
      <h1 className="t-display text-ink">Instructor</h1>
      <p className="t-body mt-3 max-w-[58ch] text-ink-secondary">
        The courses you record and review, and the work learners have submitted from them.
      </p>

      {/* --------------------------------------------------------- courses */}
      <h2 className="t-h3 mt-12 text-ink">Your courses</h2>
      {taught.length === 0 ? (
        <div className="mt-5">
          <Empty title="No courses assigned yet">
            Course assignments are made by an administrator, in{" "}
            <code className="t-meta rounded bg-surface-subtle px-1.5 py-0.5">
              instructor_assignments
            </code>
            . Until one exists there is nothing here to read, and no learner work is visible
            to you.
          </Empty>
        </div>
      ) : (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {taught.map((course) => {
            const pending = awaiting.filter((w) => w.courseId === course.id).length;
            return (
              <li
                key={course.id}
                className="rounded-[var(--radius-card)] border border-line bg-surface p-5"
              >
                {/* Monochrome, per the icon rule. See the note on the dashboard. */}
                <span
                  aria-hidden="true"
                  className="grid size-9 place-items-center rounded-[var(--radius-control)] border border-line bg-surface-subtle text-ink-secondary"
                >
                  <CourseGlyph id={course.id} size={18} />
                </span>
                <p className="t-label mt-3 text-ink-muted">{course.badge}</p>
                <p className="t-card-title mt-0.5 text-ink">{course.title}</p>
                <FactsLine
                  className="mt-2"
                  items={[course.level, pending ? `${pending} awaiting review` : "Nothing waiting"]}
                />
              </li>
            );
          })}
        </ul>
      )}

      {/* ------------------------------------------------------ submissions */}
      <h2 className="t-h3 mt-14 text-ink">
        Awaiting your review
        {awaiting.length ? <span className="text-ink-muted"> ({awaiting.length})</span> : null}
      </h2>

      {awaiting.length === 0 ? (
        <div className="mt-5">
          <Empty title="Nothing waiting">
            Submitted artifacts appear here. A learner&rsquo;s draft never does — work becomes
            visible to you at the moment they choose to submit it, and not before.
          </Empty>
        </div>
      ) : (
        <ul className="mt-5 grid gap-5">
          {awaiting.map((item) => (
            <li key={item.id} className="rounded-[var(--radius-feature)] border border-line bg-surface p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="t-card-title text-ink">
                  {byId.get(item.courseId)?.badge ?? item.courseId} · Module {item.moduleNumber} —{" "}
                  {item.moduleName}
                </p>
                <p className="t-meta text-ink-muted">
                  {item.learner
                    ? `${item.learner.first_name ?? ""} ${item.learner.last_name ?? ""}`.trim() ||
                      item.learner.email
                    : "Learner"}
                  {item.submitted_at ? ` · ${new Date(item.submitted_at).toLocaleDateString("en-US")}` : ""}
                </p>
              </div>

              <div className="mt-4 whitespace-pre-wrap rounded-[var(--radius-card)] border border-line bg-surface-subtle p-4">
                <p className="t-body-sm text-ink">{item.body || "(submitted empty)"}</p>
              </div>

              <form action={leaveFeedback} className="mt-5">
                <input type="hidden" name="artifactId" value={item.id} />
                <label htmlFor={`fb-${item.id}`} className="t-field block text-ink-secondary">
                  Your feedback
                </label>
                <textarea
                  id={`fb-${item.id}`}
                  name="feedback"
                  rows={4}
                  required
                  defaultValue={item.instructor_feedback ?? ""}
                  className="t-body mt-1.5 w-full rounded-[var(--radius-card)] border border-line-control bg-surface p-3.5 text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25"
                  placeholder="What is working, and the one thing to change before it runs live."
                />
                <button
                  type="submit"
                  className="t-button mt-3 h-11 rounded-[var(--radius-control)] bg-accent px-5 text-on-accent transition-colors hover:bg-accent-hover"
                >
                  Send feedback
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {reviewed.length > 0 ? (
        <>
          <h2 className="t-h3 mt-14 text-ink">Reviewed</h2>
          <ul className="mt-5 divide-y divide-line border-y border-line">
            {reviewed.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <span className="t-body-sm text-ink">
                  Module {item.moduleNumber} — {item.moduleName}
                </span>
                <StatusChip>Reviewed</StatusChip>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <p className="t-body-sm mt-12 border-t border-line pt-6 text-ink-secondary">
        Looking for the courses as a learner sees them?{" "}
        <Link href="/courses" className="text-accent no-underline hover:underline">
          The catalog
        </Link>
        .
      </p>
    </Container>
  );
}
