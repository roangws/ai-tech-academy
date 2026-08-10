import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArticleIcon,
  CheckCircleIcon,
  CircleIcon,
  FlaskIcon,
  FileTextIcon,
  HeadphonesIcon,
  PlayCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Container, FactsLine, StatusChip } from "@/components/ui";
import { LockedPanel, Meter } from "@/components/lms/ui";
import { getViewer } from "@/lib/auth";
import { getModuleView, bySlug, type LessonWithKinds } from "@/lib/lms/queries";
import { isLocked, unlockHref } from "@/lib/lms/access";
import { lessonCount } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; n: string }>;
}): Promise<Metadata> {
  const { slug, n } = await params;
  const course = await bySlug(slug);
  return {
    title: course ? `Module ${n} · ${course.title}` : "Module",
    robots: { index: false, follow: false },
  };
}

/**
 * The icon says what is in the lesson, not what kind of lesson it is.
 *
 * `kind: "lesson"` used to map to a play circle, so every row in every module
 * list wore a play button — 81 of them across the five courses — over lessons
 * with no media at all. The kind enum is a pedagogy label and must never double
 * as a claim about media again.
 */
function lessonIcon(lesson: LessonWithKinds) {
  const kinds = new Set((lesson.lesson_blocks ?? []).map((b) => b.kind));
  if (kinds.has("video")) return PlayCircleIcon;
  if (kinds.has("audio")) return HeadphonesIcon;
  if (lesson.kind === "lab") return FlaskIcon;
  if (lesson.kind === "template") return FileTextIcon;
  return ArticleIcon;
}

/**
 * The player: one module, its lessons, and the artifact it asks for.
 *
 * ------------------------------------------------------------------ the gate
 *
 * This is where the free-first-module rule is enforced, and the enforcement is
 * the early return below — before the lessons are rendered and before the
 * artifact editor exists in the tree.
 *
 * That ordering is the whole point. A locked module's contents never reach the
 * browser, so there is nothing to reveal by deleting an attribute in devtools.
 * The alternative shape — render everything, then hide it — ships the content
 * and calls the CSS a lock.
 *
 * The condition reads `module.access` from the database rather than the `n` in
 * the URL, so a request for module 04 cannot claim to be module 01.
 *
 * ---------------------------------------------------------- lesson content
 *
 * Lessons carry an ordered list of typed blocks — prose, video, audio, docs,
 * quizzes, embeds, exercises, checklists — in `lesson_blocks`, gated in Postgres
 * by `catalog_blocks_read` rather than only by the early return above. This list
 * selects `lesson_blocks(kind)` so each row can draw an icon describing what is
 * actually in the lesson; the payloads are read on the lesson page itself.
 */
export default async function ModulePage({
  params,
}: {
  params: Promise<{ slug: string; n: string }>;
}) {
  const { slug, n } = await params;
  const viewer = await getViewer();
  const view = await getModuleView(slug, n, viewer?.id ?? null);

  if (!view) notFound();

  const { course, module, lessons, done, prev, next } = view;
  const signedIn = Boolean(viewer);
  const path = `/learn/${slug}/${n}`;

  /*
    Which lesson the primary control opens.

    The first one they have not finished, or the first one full stop. `done` is
    empty for a signed-out reader, so on the free module this is always lesson
    one — which is right: there is nothing to resume when nothing is stored.

    A module whose every lesson is ticked resumes at the last one rather than
    offering nothing, because "I want to reread the last lesson" is a real
    reason to be on this page and an absent button is not an answer to it.
  */
  const firstUnfinished = lessons.findIndex((l) => !done.has(l.id));
  const startIndex = firstUnfinished === -1 ? lessons.length - 1 : firstUnfinished;
  const start = lessons.length
    ? { lesson: lessons[startIndex], index: startIndex, resumed: startIndex > 0 }
    : null;

  /*
    `?from=` IS GONE, and so is the banner it fed.

    The last lesson of a module used to hand the reader HERE, at the artifact, so
    this page needed a line naming the lesson they had just finished or the hand-in
    opened cold. The forward control goes to the next module now — Roan's report,
    and the note in lesson-advance.tsx — so nothing arrives at this page carrying a
    lesson to acknowledge, and a parameter no link sets is a branch that can only
    ever be dead or forged.
  */

  /* ------------------------------------------------------------------ locked */
  if (isLocked(module.access, signedIn)) {
    return (
      <Container className="py-10 md:py-14">
        <Breadcrumb slug={slug} courseTitle={course.title} n={n} />
        <div className="mt-6 max-w-[720px]">
          {/* `as="h1"` — this is the page's only heading, so without it the
              locked page had no h1 and its outline started at level 2. */}
          <LockedPanel as="h1" href={unlockHref(path)} moduleName={`Module ${module.n}`} />
          <p className="t-body-sm mt-6 text-ink-secondary">
            <Link href={`/learn/${slug}/${prev?.n ?? "01"}`} className="text-accent no-underline hover:underline">
              Go back to module {prev?.n ?? "01"}
            </Link>
            , which is open with no account.
          </p>
        </div>
      </Container>
    );
  }

  /* ------------------------------------------------------------------- open */
  return (
    <Container className="py-10 md:py-14">
      <Breadcrumb slug={slug} courseTitle={course.title} n={n} />

      <div className="mt-5 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {/*
            "MODULE 02", AT A SIZE SOMEBODY READS.

            Roan: "make it very clear 'Module 02'". It was `t-label` — 11px,
            uppercase, `--ink-muted` — sitting above the module's name in `t-h2`,
            which is 32px of ink. So the one fact that says where you are in an
            eight-module course was the quietest thing on the page, and the
            breadcrumb above it says "Module 02" in the same 11px muted grey.
            Two whispers do not add up to a statement.

            It is a bordered chip in the accent now, on its own line, directly
            above the name. Not `t-stat`: the 44px exception belongs to the
            outcomes figure alone, and this has to sit beside a status chip
            without either shouting the other down.
          */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="t-label inline-flex h-7 items-center rounded-full border border-accent/35 bg-accent-tint px-3 tabular-nums text-accent">
              Module {module.n}
            </span>
            {module.access === "open" ? <StatusChip open>Open, no account</StatusChip> : null}
          </div>
          <h1 className="t-h2 mt-2.5 text-ink">{module.name}</h1>
          {module.summary ? (
            <p className="t-body mt-3 max-w-[62ch] text-ink-secondary">{module.summary}</p>
          ) : null}
          <FactsLine
            className="mt-4"
            /* `lessonCount`, not a template with a hard-coded "s". A module with one
                lesson read "1 lessons", which is only reachable now that the
                console can create a module with one lesson in it. */
            items={[lessonCount({ lessons }), course.badge, module.step ? `Step ${module.step}` : ""].filter(Boolean)}
          />

          {/* --------------------------------------------------------- the way in */}
          {/*
            THE PAGE'S ONE PRIMARY CONTROL, AND IT STARTS THE CLASS.

            Roan: "the cta has to be start 'Ideation and the logline lab', the
            first class, because it is very complicated for a user to know that
            he needs to start the class and he ends up going to the next module,
            which is not right."

            That was exactly what the page did. The lesson list is a list of text
            links; the only filled control on the screen was "Next module" in the
            navigation at the bottom, put there in a previous pass because the
            complaint then was that there was no way to move between modules. So
            the one thing that looked like the way forward skipped every lesson
            in the module, and a reader following the loudest control read eight
            module summaries and no lessons.

            Both complaints are real and they are not in conflict. Starting the
            module is the primary act and it is at the top, filled, named after
            the lesson it opens. Moving to the next module is a real control and
            it stays at the bottom, outlined — where a reader who has finished
            the lessons will look for it, and where nobody mistakes it for the
            way in.

            It names the lesson, and the lesson's kind, because "Start" alone
            does not tell you what you are starting. For somebody part way
            through it names the first lesson they have not finished instead, so
            the control is never "start" for work already done.
          */}
          {start ? (
            <div className="mt-7">
              <Link
                href={`/learn/${slug}/${n}/${start.lesson.slug}`}
                className="t-button inline-flex h-12 items-center gap-2 rounded-[var(--radius-control)] bg-accent px-6 text-on-accent no-underline transition-colors hover:bg-accent-hover"
              >
                {start.resumed ? "Continue" : "Start"}: {start.lesson.name}
                <ArrowRightIcon size={15} weight="bold" aria-hidden="true" className="flex-none" />
              </Link>
              <p className="t-meta mt-2 text-ink-muted">
                Lesson {start.index + 1} of {lessons.length} · {start.lesson.kind}
                {start.lesson.minutes ? ` · ${start.lesson.minutes} min` : ""}
              </p>
            </div>
          ) : null}

          {/* ---------------------------------------------------------- lessons */}
          <ul className="mt-8 divide-y divide-line border-y border-line">
            {lessons.map((lesson) => {
              const isDone = done.has(lesson.id);
              const Icon = lessonIcon(lesson);
              return (
                <li key={lesson.id} className="flex items-center gap-4 py-3.5">
                  <Icon size={18} aria-hidden="true" className="flex-none text-ink-muted" />
                  {/* A link, which it was not. The list used to be inert text
                      beside a tick, so a learner could read 173 lesson titles
                      across the site and open none of them — a syllabus rather
                      than a course. */}
                  <Link
                    href={`/learn/${slug}/${n}/${lesson.slug}`}
                    className="group min-w-0 flex-1 no-underline"
                  >
                    <span
                      className={`t-body block group-hover:text-accent ${
                        isDone ? "text-ink-muted" : "text-ink"
                      }`}
                    >
                      {lesson.name}
                    </span>
                    <span className="t-micro text-ink-muted">
                      {lesson.kind}
                      {lesson.minutes ? ` · ${lesson.minutes} min` : ""}
                      {isDone ? " · done" : ""}
                    </span>
                  </Link>

                  {/*
                    A form per lesson, not a checkbox with an onChange.

                    It works with no JavaScript, it is a real submit button with a
                    real accessible name, and the name says what pressing it does
                    rather than what state it is in. `sr-only` text carries the
                    lesson name into that label, so a screen reader hears "Mark
                    Baseline interview complete" rather than eleven identical
                    buttons called "Mark complete".
                  */}
                  {/*
                    THE TICK BUTTONS ARE GONE, removed 9 Aug.

                    This list offered a one-click completion beside every lesson
                    title, so a learner could mark four lessons done without
                    opening one — and every number in the product is derived from
                    that table. Progress was a thing you could award yourself from
                    a screen you never read.

                    Completion is marked in the lesson now, on the page where the
                    work actually happened. The circle here reports state and does
                    not set it.
                  */}
                  <span className="flex-none" aria-hidden="true">
                    {isDone ? (
                      <CheckCircleIcon size={20} weight="fill" className="text-accent" />
                    ) : (
                      <CircleIcon size={20} className="text-ink-muted" />
                    )}
                  </span>
                </li>
              );
            })}
          </ul>

          {/* ------------------------------------------------------ pagination */}
          {/*
            THE WAY THROUGH THE COURSE. Outlined, not filled — and that is a
            reversal of the previous pass, on the same page, for a report that
            does not contradict the one before it.

            Both of these started as 14px text links in a row. Roan could not
            tell how to move between modules, so the forward one became the
            page's one filled control. It was then the ONLY filled control on a
            page whose actual purpose is the four lessons above it, so the next
            reader followed it straight past them — "it is very complicated for a
            user to know that he needs to start the class and he ends up going to
            the next module".

            Both complaints are answered by rank rather than by presence. Start
            the module is filled and at the top; next module is outlined and at
            the bottom, still obviously a control and no longer the loudest thing
            on the screen. Nothing was removed either time.

            `justify-between` with a `<span />` placeholder, so a module with no
            previous still puts the forward control on the right rather than
            sliding it to the left margin.
          */}
          <nav
            aria-label="Modules"
            className="mt-12 flex flex-col-reverse gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between"
          >
            {prev ? (
              <Link
                href={`/learn/${slug}/${prev.n}`}
                className="t-button inline-flex items-center gap-1.5 text-ink-secondary no-underline hover:text-ink"
              >
                <ArrowLeftIcon size={14} weight="bold" aria-hidden="true" />
                {prev.n} {prev.name}
              </Link>
            ) : (
              <span className="hidden sm:block" />
            )}
            {next ? (
              <Link
                href={`/learn/${slug}/${next.n}`}
                className="t-button inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-line-control px-5 text-ink-secondary no-underline transition-colors hover:border-line-strong hover:text-ink"
              >
                Next module: {next.n} {next.name}
                <ArrowRightIcon size={15} weight="bold" aria-hidden="true" className="flex-none" />
              </Link>
            ) : (
              /* The last module. The forward control has to keep existing, and the
                 honest destination is where a finished course is claimed. */
              <Link
                href="/dashboard/certifications"
                className="t-button inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-line-control px-5 text-ink-secondary no-underline transition-colors hover:border-line-strong hover:text-ink"
              >
                Finish the course
                <ArrowRightIcon size={15} weight="bold" aria-hidden="true" className="flex-none" />
              </Link>
            )}
          </nav>

          {/*
            THE HAND-IN IS GONE FROM THIS PAGE, 9 Aug.

            Roan: "let's remove this section completely […] i dont want it!" —
            the heading, the "Optional" chip, the "build it wherever you normally
            work, paste it in" line, the textarea, "Save draft" and "Submit for
            review". All of it.

            This is the second pass at the same complaint. The first one moved it
            below the module navigation and folded it into a `<details>`, on the
            reasoning that deleting the form would take /instructor and the
            outcome sheet down with it. Folding something away is what you do
            when the answer is "not here, not now"; the answer was "not at all",
            and a one-line summary a reader has to scroll past is still a thing
            on the page.

            WHAT WENT WITH IT, deliberately, because a form with no reader is
            worse than no form:

              * the review queue on /instructor, which read nothing but this;
              * the two dashboard prompts that pointed back here — "Send your X
                artifact" linked to a page with nowhere to send it.

            WHAT DID NOT GO. `artifacts`, its policies, its guard trigger,
            `saveArtifact` and `leaveFeedback` are all untouched, and so is the
            one row already in the table. Nothing is dropped and nothing is
            migrated away, so this is a rendering decision that can be reversed
            by putting the section back — which is the whole reason to leave the
            schema alone rather than write a migration for a UI complaint.

            `modules.artifact` still holds the artifact's name on every module,
            and the course board still reads it as a description of what the
            module produces. It is prose now, not a form.
          */}
        </div>

        {/* ------------------------------------------------------------- aside */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[var(--radius-feature)] border border-line bg-surface-subtle p-5">
            <p className="t-label text-ink-muted">This module</p>
            {signedIn ? (
              <Meter className="mt-3" done={done.size} total={lessons.length} />
            ) : (
              <p className="t-body-sm mt-2 text-ink-secondary">
                Progress is saved with a free account.
              </p>
            )}
            <Link
              href={`/learn/${slug}`}
              className="t-button mt-5 block text-accent no-underline hover:underline"
            >
              All {course.title} modules
            </Link>
          </div>
        </aside>
      </div>
    </Container>
  );
}

function Breadcrumb({ slug, courseTitle, n }: { slug: string; courseTitle: string; n: string }) {
  return (
    <nav aria-label="Breadcrumb" className="t-meta text-ink-muted">
      <Link href={`/learn/${slug}`} className="text-ink-secondary no-underline hover:underline">
        {courseTitle}
      </Link>
      <span className="px-1.5 text-line-strong">/</span>
      Module {n}
    </nav>
  );
}
