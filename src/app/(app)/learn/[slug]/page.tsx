import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { Container, FactsLine, TextAction } from "@/components/ui";
import { CourseGlyph } from "@/components/course/icons";
import { Meter, ModuleState } from "@/components/lms/ui";
import { getViewer } from "@/lib/auth";
import { getCourseBoard, bySlug } from "@/lib/lms/queries";
import { isLocked } from "@/lib/lms/access";
import { enroll } from "@/app/actions/lms";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = bySlug.get(slug);
  return {
    title: course ? `${course.title} — contents` : "Course",
    robots: { index: false, follow: false },
  };
}

/**
 * The course contents, for someone doing the course.
 *
 * ------------------------------------------- why this is not /courses/[slug]
 *
 * `/courses/[slug]` is the marketing page: statically generated, revalidated
 * hourly, carrying JSON-LD and written to persuade somebody who has not started.
 * It reads content.ts and has no idea who is looking at it.
 *
 * This one is per-reader and uncached — every module row shows that reader's
 * completions and whether the gate is open for them. Merging the two would mean
 * either giving up the static course page or serving every visitor a personalised
 * one, and both are worse than having two pages that do two jobs.
 *
 * ------------------------------------------------------------- open to anyone
 *
 * No `requireUser`. A signed-out reader gets the full contents with module 1
 * open and 2 through 8 marked, which is the offer stated exactly as the rest of
 * the site states it. Redirecting them to sign-in here would be the site taking
 * back its own promise at the moment it is being taken up.
 */
export default async function CourseBoardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const viewer = await getViewer();
  const board = await getCourseBoard(slug, viewer?.id ?? null);

  if (!board) notFound();

  const { course, modules, totalLessons, doneLessons, enrollment } = board;
  const signedIn = Boolean(viewer);

  /* The first module that is open to this reader and not finished. It is what
     "Continue" means, and the answer for a signed-out reader is always module 1.

     `?.n ?? "01"` because `modules` can be empty for an un-seeded course. The
     signed-out branch below already guarded that; the signed-in one dereferenced
     `resume.n` and threw, so a partially-seeded course took out the page for
     exactly the readers who were furthest into it. */
  const resume =
    modules.find((m) => !isLocked(m.access, signedIn) && m.done < m.lessons.length) ?? modules[0];
  const resumeN = resume?.n ?? "01";

  return (
    <Container className="py-10 md:py-14">
      <nav aria-label="Breadcrumb" className="t-meta text-ink-muted">
        <Link href="/dashboard" className="text-ink-secondary no-underline hover:underline">
          Dashboard
        </Link>
        <span className="px-1.5 text-line-strong">/</span>
        {course.title}
      </nav>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 max-w-[62ch]">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid size-10 flex-none place-items-center rounded-[var(--radius-card)] border border-line bg-surface-subtle text-ink-secondary"
            >
              <CourseGlyph id={course.id} size={20} />
            </span>
            <p className="t-label text-ink-muted">{course.badge}</p>
          </div>
          <h1 className="t-h2 mt-3 text-ink">{course.title}</h1>
          <p className="t-body mt-2.5 text-ink-secondary">{course.summary}</p>
          <FactsLine
            className="mt-4"
            items={[course.level, course.duration, `${modules.length} modules`, `${totalLessons} lessons`]}
          />
        </div>

        <div className="w-full max-w-[300px] rounded-[var(--radius-feature)] border border-line bg-surface-subtle p-5">
          {signedIn ? (
            <>
              <Meter done={doneLessons} total={totalLessons} />
              {/*
                Enrolment is a button and not a side effect of arriving. A reader
                browsing the contents of a course they have not committed to
                should not find it on their dashboard afterwards.

                Once enrolled the control becomes the resume link, so the same
                corner of the page always answers "what do I do next".
              */}
              {enrollment ? (
                <Link
                  href={`/learn/${slug}/${resumeN}`}
                  className="t-button mt-5 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-[var(--radius-control)] bg-accent text-on-accent no-underline transition-colors hover:bg-accent-hover"
                >
                  {doneLessons > 0 ? "Continue" : "Start module 1"}
                  <ArrowRightIcon size={14} weight="bold" aria-hidden="true" />
                </Link>
              ) : (
                <form action={enroll} className="mt-5">
                  <input type="hidden" name="slug" value={slug} />
                  <button
                    type="submit"
                    className="t-button h-11 w-full rounded-[var(--radius-control)] bg-accent text-on-accent transition-colors hover:bg-accent-hover"
                  >
                    Add to my courses
                  </button>
                </form>
              )}
            </>
          ) : (
            <>
              <p className="t-card-title text-ink">Module 1 is open</p>
              <p className="t-body-sm mt-2 text-ink-secondary">
                Start now with no account. One free account opens modules 2 to 8 here and
                in every other course.
              </p>
              <Link
                href={`/learn/${slug}/${modules[0]?.n ?? "01"}`}
                className="t-button mt-5 inline-flex h-11 w-full items-center justify-center rounded-[var(--radius-control)] bg-accent text-on-accent no-underline transition-colors hover:bg-accent-hover"
              >
                Start module 1
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------ modules */}
      <h2 className="t-h3 mt-14 text-ink">Contents</h2>
      <ol className="mt-5 divide-y divide-line border-y border-line">
        {modules.map((m) => {
          const locked = isLocked(m.access, signedIn);
          return (
            <li key={m.id}>
              <Link
                href={`/learn/${slug}/${m.n}`}
                className="group flex items-start gap-4 py-5 no-underline transition-colors hover:bg-surface-subtle"
              >
                {/* `t-meta`, not `t-stat`. The 44px display size is released for
                    exactly one element on this site — the before-and-after
                    figure in the outcomes section — and DESIGN-SPEC.md says no
                    second element may take the exception. It also did not fit:
                    56px numerals in a 36px `flex-none` column overflowed into
                    the title beside them. */}
                <span className="t-meta w-7 flex-none pt-1 tabular-nums text-ink-muted">{m.n}</span>
                <span className="min-w-0 flex-1">
                  <span className="t-card-title block text-ink group-hover:text-accent">
                    {m.name}
                  </span>
                  {m.summary ? (
                    <span className="t-body-sm mt-1 block text-ink-secondary">{m.summary}</span>
                  ) : null}
                  <span className="t-meta mt-2 block text-ink-muted">
                    {m.lessons.length} lessons
                    {m.artifact ? ` · ${m.artifact}` : ""}
                    {m.artifact_status && m.artifact_status !== "draft"
                      ? ` · ${m.artifact_status}`
                      : ""}
                  </span>
                </span>
                <span className="flex-none pt-0.5">
                  <ModuleState
                    locked={locked}
                    done={m.done}
                    total={m.lessons.length}
                    open={m.access === "open"}
                  />
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      <p className="t-body-sm mt-8 text-ink-secondary">
        Looking for the course description, the outcomes and the instructor?{" "}
        <TextAction href={`/courses/${slug}`}>The course page has all of it</TextAction>.
      </p>
    </Container>
  );
}
