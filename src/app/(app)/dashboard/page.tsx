import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { ButtonLink, Container, FactsLine, StatusChip } from "@/components/ui";
import { CourseGlyph } from "@/components/course/icons";
import { Empty, Meter } from "@/components/lms/ui";
import { requireUser } from "@/lib/auth";
import { getDashboard } from "@/lib/lms/queries";
import { totalLessons } from "@/lib/content";

export const metadata: Metadata = {
  title: "Your courses",
  robots: { index: false, follow: false },
};

/**
 * The signed-in home.
 *
 * `auth.signIn.intro` promises "Pick up in the course you were last working
 * through", and this page is that promise: every enrolment, how far through it
 * the reader is, and one control per course that resumes rather than restarts.
 *
 * Dynamic, and deliberately not cached. Everything on it is one person's state.
 */
export default async function DashboardPage() {
  const viewer = await requireUser("/dashboard");
  const enrolled = await getDashboard(viewer.id);

  return (
    <Container className="py-12 md:py-16">
      <h1 className="t-display text-ink">Welcome back, {viewer.name}.</h1>
      <p className="t-body mt-3 max-w-[58ch] text-ink-secondary">
        {enrolled.length
          ? "Pick up where you left off, or start another course. Everything stays free."
          : "You have a free account, which opens modules 2 to 8 in all five courses."}
      </p>

      {enrolled.length === 0 ? (
        <Empty
          title="No courses started yet"
          action={<ButtonLink href="/courses">Browse the five courses</ButtonLink>}
        >
          Every course starts with a baseline in module 1 and ends with one workflow
          running live and measured. Pick the one closest to the work you already do.
        </Empty>
      ) : (
        <ul className="mt-10 grid gap-5 lg:grid-cols-2">
          {enrolled.map(({ course, enrollment, done, total, sheet }) => (
            <li
              key={course.id}
              /* The course hue, as the one place Amendment 2 allows it: a ground
                 rather than a chip. It reads as the card's spine. */
              style={{ borderLeftColor: course.ground ?? undefined }}
              className="flex flex-col rounded-[var(--radius-feature)] border border-line border-l-[3px] bg-surface p-6 transition-shadow hover:shadow-e1"
            >
              {/*
                A monochrome glyph, not a coloured tile. DESIGN-SPEC.md's icon
                rule names this exact thing — "no duotone, no coloured icon
                tiles, no gradient icon chips" — and Amendment 2 releases the
                `--path-*` hues for one use only: the ground of a path cover.
                `CourseGlyph`'s own header comment cites the same rule.

                The hue still identifies the course, as a rule down the left edge
                of the card, which is the cover treatment rather than a chip.
              */}
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
                {/* Neutral. Green means "open with no account" on this site and
                    nothing else — see the note in ModuleState. */}
                {enrollment.status === "completed" ? <StatusChip>Complete</StatusChip> : null}
              </div>

              {/* `total` comes from the database rather than from content.ts's
                  `totalLessons`, because progress is counted against the rows
                  that exist. The helper is the fallback for the moment before a
                  re-seed, not the source. */}
              <Meter className="mt-5" done={done} total={total || totalLessons(course)} />

              <FactsLine
                className="mt-4"
                items={[
                  course.level,
                  course.duration,
                  sheet ? `Outcome sheet ${sheet.status}` : "No outcome sheet yet",
                ]}
              />

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line pt-5">
                <Link
                  href={`/learn/${course.slug}`}
                  className="t-button inline-flex items-center gap-1.5 text-accent no-underline hover:underline"
                >
                  {done > 0 ? "Continue" : "Start module 1"}
                  <ArrowRightIcon size={14} weight="bold" aria-hidden="true" />
                </Link>
                <Link
                  href={`/dashboard/outcome/${course.id}`}
                  className="t-button text-ink-secondary no-underline underline-offset-4 hover:text-ink hover:underline"
                >
                  {sheet ? "Outcome sheet" : "Start an outcome sheet"}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      {enrolled.length > 0 && enrolled.length < 5 ? (
        <p className="t-body-sm mt-10 border-t border-line pt-6 text-ink-secondary">
          There are {5 - enrolled.length} more courses, and they are free too.{" "}
          <Link href="/courses" className="text-accent no-underline hover:underline">
            See the catalog
          </Link>
          .
        </p>
      ) : null}
    </Container>
  );
}
