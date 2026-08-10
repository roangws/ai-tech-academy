import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { Container, FactsLine } from "@/components/ui";
import { CourseGlyph } from "@/components/course/icons";
import { Empty } from "@/components/lms/ui";
import { requireRole } from "@/lib/auth";
import { getTaughtCourses } from "@/lib/lms/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Instructor",
  robots: { index: false, follow: false },
};

/**
 * The instructor console: the courses this person was assigned, and the way in.
 *
 * ------------------------------------------------------------ the role, fixed
 *
 * `requireRole("instructor")` — it was `requireRole("admin", "/instructor")`,
 * which has the argument order right and the role wrong. The effect was that
 * being made an instructor gave you nothing: `assignInstructor` grants the role
 * and writes the assignment, `teaches_course()` and every policy under it agree,
 * and then the page itself redirected the person to /dashboard because they were
 * not an administrator. The header hid the link on the same test, so there was
 * not even a door to be turned away at.
 *
 * Admins still pass, because `requireRole` lets an admin pass every check —
 * there is no separate console, and an admin locked out of the view they are
 * meant to be administering has to grant themselves a role to do their job.
 *
 * --------------------------------------------------------- the courses are links
 *
 * Roan: "i want the /instructor user instructor to have access to the course he
 * has access to (that the admin granted him access)."
 *
 * The grant was already real — five rows in `instructor_assignments`, and the
 * cards were already drawn from them. What was missing is that the cards were
 * inert: a glyph, a badge, a title and a level, and no way to open the thing
 * they name. An instructor could see that they had been given a course and could
 * not read it. Every card is a link into the course now.
 *
 * ---------------------------------------------------------- the review queue
 *
 * GONE, 9 Aug, along with the module hand-in it read from. Roan, on the queue:
 * "disable 'Awaiting your review (1) … Your feedback'", and on the form that
 * fed it: "remove it, i dont want it."
 *
 * The two are one decision. `artifacts` is the only table this section ever
 * read, the module page was the only screen that ever wrote to it, and a review
 * queue over a form nobody can reach is a queue that can only ever hold what is
 * already in it — which was one row, of the word "sdfsf".
 *
 * The table, its policies and `leaveFeedback` are untouched. Nothing is dropped
 * and the row is still there; if the hand-in comes back, this comes back with
 * it. See the same note on the module page.
 */
export default async function InstructorPage() {
  const viewer = await requireRole("instructor", "/instructor");
  const taught = await getTaughtCourses(viewer.id);

  return (
    <Container className="py-12 md:py-16">
      <h1 className="t-display text-ink">Instructor</h1>
      <p className="t-body mt-3 max-w-[58ch] text-ink-secondary">
        The courses you record and review. Open one to read it exactly as a learner does.
      </p>

      <h2 className="t-h3 mt-12 text-ink">Your courses</h2>
      {taught.length === 0 ? (
        <div className="mt-5">
          <Empty title="No courses assigned yet">
            Course assignments are made by an administrator, on{" "}
            <Link href="/admin/people" className="text-accent no-underline hover:underline">
              People
            </Link>
            . Until one exists there is nothing here to read.
          </Empty>
        </div>
      ) : (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {taught.map((course) => (
            <li key={course.id}>
              {/* The whole card is the link, not a "View course" line under it.
                  A card that names a course and cannot be pressed is the defect
                  this page had. */}
              <Link
                href={`/learn/${course.slug}`}
                className="group flex h-full flex-col rounded-[var(--radius-card)] border border-line bg-surface p-5 no-underline transition-shadow hover:shadow-e1"
              >
                {/* Monochrome, per the icon rule. See the note on the dashboard. */}
                <span
                  aria-hidden="true"
                  className="grid size-9 place-items-center rounded-[var(--radius-control)] border border-line bg-surface-subtle text-ink-secondary"
                >
                  <CourseGlyph id={course.id} size={18} />
                </span>
                <p className="t-label mt-3 text-ink-muted">{course.badge}</p>
                <p className="t-card-title mt-0.5 text-ink group-hover:text-accent">{course.title}</p>
                <FactsLine
                  className="mt-2"
                  items={[course.level, `${course.curriculum.length} modules`]}
                />
                <span className="t-button mt-4 inline-flex items-center gap-1.5 text-accent">
                  Open the course
                  <ArrowRightIcon size={13} weight="bold" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

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
