import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRightIcon,
  CaretDownIcon,
  CheckCircleIcon,
  CircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Container, FactsLine } from "@/components/ui";
import { CoursePhoto } from "@/components/lms/course-photo";
import { Meter, ModuleState } from "@/components/lms/ui";
import { getViewer } from "@/lib/auth";
import { getCourseBoard, bySlug } from "@/lib/lms/queries";
import { isLocked, unlockHref } from "@/lib/lms/access";
import { enroll } from "@/app/actions/lms";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await bySlug(slug);
  return {
    title: course ? `${course.title} · modules` : "Course",
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
    <Container className="py-8 md:py-10">
      <nav aria-label="Breadcrumb" className="t-meta text-ink-muted">
        <Link href="/dashboard" className="text-ink-secondary no-underline hover:underline">
          Dashboard
        </Link>
        <span className="px-1.5 text-line-strong">/</span>
        {course.title}
      </nav>

      {/*
        The banner.

        Opening a course used to give a glyph tile, a heading and a wall of module
        rows: almost no visual input on the screen that is supposed to make a
        learner feel like they have arrived somewhere. The course has had a real
        photograph since the catalogue shipped, and the signed-in product ignored
        it — so somebody who clicked a picture on /courses landed on a page that
        looked like a different site.

        The title sits ON the image rather than under it, which is what ties the
        two together: the picture stops being decoration above the content and
        becomes the thing the content is named on. The scrim is solid ink at a
        fixed opacity rather than a gradient wash, matching PosterTitleCard, so
        it stays a legibility device.
      */}
      <div className="relative mt-4 overflow-hidden rounded-[var(--radius-feature)]">
        <div className="relative aspect-[16/7] sm:aspect-[16/5]">
          <CoursePhoto course={course} sizes="(min-width: 1280px) 1216px, 100vw" priority />
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(to_top,rgb(13_26_34/0.88),rgb(13_26_34/0.35)_55%,rgb(13_26_34/0.1))]"
        />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
          <p className="t-label text-white/70">{course.badge}</p>
          <h1 className="t-h2 mt-1 max-w-[24ch] text-white">{course.title}</h1>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 max-w-[62ch]">
          <p className="t-body text-ink-secondary">{course.summary}</p>
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
                Start now with no account. One free account opens every module after the first, here and
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
      {/*
        "Contents" was the heading here, and it told a reader nothing: it is the
        word a book uses for a page of page numbers, and this is the course. The
        heading now says what the rows are and what happens when you press one,
        because the step from here to a module to a lesson was the part people
        reported as confusing.
      */}
      <section aria-labelledby="modules-heading" className="mt-12">
        <h2 id="modules-heading" className="t-h3 text-ink">
          The {modules.length} modules
        </h2>
        <p className="t-body-sm mt-1.5 max-w-[62ch] text-ink-secondary">
          Each one is a set of lessons and ends with one thing you keep. Open a module to see
          its lessons.
        </p>
      </section>
      <ol className="mt-5 divide-y divide-line border-y border-line">
        {modules.map((m) => {
          const locked = isLocked(m.access, signedIn);

          /*
            A module opens in place.

            The three levels — course, module, lesson — read as three pages that
            each list the next set of things, and the middle one was the part
            people reported as confusing: /learn/<course>/03 and
            /learn/<course>/03/<lesson> look like the same screen, and the module
            page's real job (the artifact) was buried under a second table of
            contents.

            So the lessons expand here and a learner goes course -> lesson in one
            click. `<details>` rather than a disclosure component: it needs no
            JavaScript, it is keyboard-operable for free, and the whole state is
            one attribute. The module currently in progress starts open, so the
            page arrives showing the thing to do next.
          */
          const inProgress = !locked && m.done > 0 && m.done < m.lessons.length;

          return (
            <li key={m.id}>
              <details open={inProgress} className="group">
                <summary className="flex cursor-pointer list-none items-start gap-4 py-5 transition-colors hover:bg-surface-subtle">
                  <span className="t-meta w-7 flex-none pt-1 tabular-nums text-ink-muted">
                    {m.n}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="t-card-title block text-ink">{m.name}</span>
                    {m.summary ? (
                      <span className="t-body-sm mt-1 block text-ink-secondary">{m.summary}</span>
                    ) : null}
                    <span className="t-meta mt-2 block text-ink-muted">
                      {m.lessons.length} lessons
                      {m.artifact ? ` · ends with your ${m.artifact.toLowerCase()}` : ""}
                    </span>
                  </span>
                  <span className="flex flex-none items-center gap-3 pt-0.5">
                    <ModuleState
                      locked={locked}
                      done={m.done}
                      total={m.lessons.length}
                      open={m.access === "open"}
                    />
                    <CaretDownIcon
                      size={14}
                      weight="bold"
                      aria-hidden="true"
                      className="text-ink-muted transition-transform group-open:rotate-180"
                    />
                  </span>
                </summary>

                {locked ? (
                  <p className="t-body-sm pb-5 pl-11 text-ink-secondary">
                    <Link
                      href={unlockHref(`/learn/${slug}/${m.n}`)}
                      className="text-accent no-underline hover:underline"
                    >
                      A free account
                    </Link>{" "}
                    opens this module and every other one.
                  </p>
                ) : (
                  <div className="pb-5 pl-11">
                    <ul className="flex flex-col">
                      {m.lessons.map((lesson) => {
                        const isDone = m.doneIds.has(lesson.id);
                        return (
                          <li key={lesson.id}>
                            <Link
                              href={`/learn/${slug}/${m.n}/${lesson.slug}`}
                              className="flex min-h-[44px] items-center gap-2.5 rounded-[var(--radius-control)] px-2 no-underline transition-colors hover:bg-surface-subtle"
                            >
                              {isDone ? (
                                <CheckCircleIcon
                                  size={16}
                                  weight="fill"
                                  aria-hidden="true"
                                  className="flex-none text-accent"
                                />
                              ) : (
                                <CircleIcon
                                  size={16}
                                  aria-hidden="true"
                                  className="flex-none text-ink-muted"
                                />
                              )}
                              <span className="t-body-sm min-w-0 flex-1 text-ink">
                                {lesson.name}
                              </span>
                              <span className="sr-only">
                                {isDone ? "Completed" : "Not completed"}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>

                    {/*
                      THE WAY INTO THE MODULE, and it says so now.

                      It read "Write your logline and script" and was rendered only
                      when `m.artifact` was set, because the module page used to be
                      the hand-in surface. The hand-in was removed on 9 Aug, so this
                      was a link labelled after a form that no longer exists — and
                      since it was the ONLY link from this board into the module
                      page, a module with no artifact set had no route to its own
                      page at all. The new "Start: <first lesson>" control on that
                      page was unreachable from here.

                      Unconditional now, and named after where it goes. The lesson
                      list above is still the fast path for somebody who knows which
                      lesson they want; this is for the reader who wants the module.
                    */}
                    <Link
                      href={`/learn/${slug}/${m.n}`}
                      className="t-meta mt-2 inline-flex min-h-[44px] items-center gap-1.5 px-2 text-ink-secondary no-underline underline-offset-4 hover:text-ink hover:underline"
                    >
                      Open module {m.n}
                      <ArrowRightIcon size={12} weight="bold" aria-hidden="true" />
                    </Link>
                  </div>
                )}
              </details>
            </li>
          );
        })}
      </ol>

    </Container>
  );
}
