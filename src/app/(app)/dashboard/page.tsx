import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { Container, FactsLine, StatusChip } from "@/components/ui";
import { CourseGlyph } from "@/components/course/icons";
import { Meter } from "@/components/lms/ui";
import { requireUser } from "@/lib/auth";
import { getDashboard } from "@/lib/lms/queries";
import { courses as catalog, totalLessons, moduleCount } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your courses",
  robots: { index: false, follow: false },
};

/**
 * The signed-in home.
 *
 * ------------------------------------------------------- every course, always
 *
 * This listed only the courses a learner had already started, so a new account
 * landed on an empty page with a link to the marketing catalog — bounced back
 * out of the product on their first screen. Every course is on it now: the ones
 * in progress first, with their progress, then the rest as something to start.
 *
 * All five are free and open, so there is no reason for the dashboard to hide
 * four of them behind a second page. "Continue" and "Start" are the same control
 * in different states, which is what makes the list scannable rather than two
 * unrelated groups.
 */
export default async function DashboardPage() {
  const viewer = await requireUser("/dashboard");
  const enrolled = await getDashboard(viewer.id);
  const byId = new Map(enrolled.map((e) => [e.course.id, e]));

  /* Started first, in the order they were enrolled; then the rest in catalog
     order. One list, so the eye runs down it once. */
  const started = enrolled.map((e) => e.course.id);
  const ordered = [
    ...enrolled.map((e) => e.course),
    ...catalog.filter((c) => !started.includes(c.id)),
  ];

  const inProgress = enrolled.filter((e) => e.done > 0).length;

  return (
    <Container className="py-12 md:py-16">
      <h1 className="t-display text-ink">Welcome back, {viewer.name}.</h1>
      <p className="t-body mt-3 max-w-[58ch] text-ink-secondary">
        {inProgress
          ? "Pick up where you left off, or start another one."
          : "Five courses, all open. Start with the one closest to the work you already do."}
      </p>

      <ul className="mt-10 grid gap-5 lg:grid-cols-2">
        {ordered.map((course) => {
          const row = byId.get(course.id);
          const total = row?.total || totalLessons(course);
          const done = row?.done ?? 0;
          const isStarted = done > 0;

          return (
            <li
              key={course.id}
              /* The course hue as a ground rather than a chip — the one use
                 Amendment 2 allows. It reads as the card's spine. */
              style={{ borderLeftColor: course.ground ?? undefined }}
              className="flex flex-col rounded-[var(--radius-feature)] border border-line border-l-[3px] bg-surface p-6 transition-shadow hover:shadow-e1"
            >
              <div className="flex items-start gap-4">
                <span
                  aria-hidden="true"
                  className="grid size-11 flex-none place-items-center rounded-[var(--radius-card)] border border-line bg-surface-subtle text-ink-secondary"
                >
                  <CourseGlyph id={course.id} size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="t-label text-ink-muted">{course.badge}</p>
                  <h2 className="t-card-title mt-0.5 text-ink">{course.title}</h2>
                </div>
                {row?.enrollment.status === "completed" ? <StatusChip>Complete</StatusChip> : null}
              </div>

              <p className="t-body-sm mt-3 line-clamp-2 text-ink-secondary">{course.summary}</p>

              {isStarted ? (
                <Meter className="mt-5" done={done} total={total} />
              ) : (
                <FactsLine
                  className="mt-5"
                  items={[course.level, course.duration, moduleCount(course)]}
                />
              )}

              <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line pt-5 [margin-top:1.5rem]">
                <Link
                  href={`/learn/${course.slug}`}
                  className="t-button inline-flex items-center gap-1.5 text-accent no-underline hover:underline"
                >
                  {isStarted ? "Continue" : "Start module 1"}
                  <ArrowRightIcon size={14} weight="bold" aria-hidden="true" />
                </Link>
                {/* The outcome sheet is only meaningful once there is work to
                    measure, so it appears when a course has been started. */}
                {isStarted ? (
                  <Link
                    href={`/dashboard/outcome/${course.id}`}
                    className="t-button text-ink-secondary no-underline underline-offset-4 hover:text-ink hover:underline"
                  >
                    {row?.sheet ? `Outcome sheet · ${row.sheet.status}` : "Start an outcome sheet"}
                  </Link>
                ) : (
                  <Link
                    href={`/courses/${course.slug}`}
                    className="t-button text-ink-secondary no-underline underline-offset-4 hover:text-ink hover:underline"
                  >
                    What it covers
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Container>
  );
}
