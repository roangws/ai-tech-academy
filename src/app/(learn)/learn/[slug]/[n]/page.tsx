import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArticleIcon,
  CaretRightIcon,
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
import { saveArtifact } from "@/app/actions/lms";

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

  const { course, module, lessons, done, artifact, prev, next } = view;
  const signedIn = Boolean(viewer);
  const path = `/learn/${slug}/${n}`;

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
          <div className="flex items-center gap-3">
            {/* `t-label`, not `t-stat` — the 44px exception belongs to the
                outcomes figure alone. See the note on the course board. */}
            <span className="t-label tabular-nums text-ink-muted">Module {module.n}</span>
            {module.access === "open" ? <StatusChip open>Open, no account</StatusChip> : null}
          </div>
          <h1 className="t-h2 mt-1.5 text-ink">{module.name}</h1>
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
            THE WAY THROUGH THE COURSE, and it is a filled control now.

            Both of these were 14px text links in a row, the forward one in accent
            with a small arrow. Roan's report was that he could not tell how to
            move between modules, and that is what a pair of matched text links
            does: it reads as a footer, not as the route. A module page has no other
            primary control on it — the lessons are a list and the hand-in is
            optional — so this is the page's one filled affordance and it is on the
            far right, which is where the same control sits on the lesson page.

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
                className="t-button inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-accent px-5 text-on-accent no-underline transition-colors hover:bg-accent-hover"
              >
                Next module: {next.n} {next.name}
                <ArrowRightIcon size={15} weight="bold" aria-hidden="true" className="flex-none" />
              </Link>
            ) : (
              /* The last module. The forward control has to keep existing, and the
                 honest destination is where a finished course is claimed. */
              <Link
                href="/dashboard/certifications"
                className="t-button inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-accent px-5 text-on-accent no-underline transition-colors hover:bg-accent-hover"
              >
                Finish the course
                <ArrowRightIcon size={15} weight="bold" aria-hidden="true" className="flex-none" />
              </Link>
            )}
          </nav>

          {/* --------------------------------------------------------- artifact */}
          {/*
            THE HAND-IN, MOVED AND FOLDED AWAY, 9 Aug.

            Roan, on what used to be here: "no idea what's this bs, remove it […] i
            want to go to the next one instead."

            What he was reading was the destination of the last lesson in the
            module: an `<h2>` reading "What to hand in for module 01", the artifact
            name restated under it, two paragraphs about building the thing
            elsewhere and pasting it in, a ten-row textarea and two submit buttons —
            roughly a screen and a half, standing between the end of module 01 and
            the start of module 02, in a course whose modules are meant to be read
            in order.

            Three things changed and only one of them is deletion:

              1. It is no longer on the path. The forward control goes to the next
                 module (lesson-advance.tsx) and this section now sits BELOW the
                 module navigation rather than above it, so nobody has to get past
                 it to keep reading.
              2. It is folded. A `<details>` — native, works with no JavaScript,
                 announces its own state — so the default rendering is one line
                 instead of a screen and a half. It opens itself for anybody who
                 already has a draft, a submission or feedback waiting, because for
                 them it is not clutter, it is their work.
              3. The copy is one sentence. The two paragraphs said the same thing
                 twice and the second explained the outcome sheet, which is a
                 different feature with its own page.

            WHAT IS DELIBERATELY NOT DELETED is the hand-in itself. It is the only
            way an artifact row is ever written, and artifacts are what /instructor
            reads and what the outcome sheet is assembled from — removing the form
            outright would take two working features down with it, quietly. If the
            artifact is meant to go entirely, `modules.artifact` is the switch and
            it is a data change, not a code one: this whole section renders nothing
            for a module that has no artifact set.
          */}
          {module.artifact ? (
            <section aria-labelledby="artifact-heading" className="mt-10">
              <details
                /* Open when there is something of theirs in it. A collapsed
                   summary hiding a reviewer's feedback would be the worst version
                   of this. */
                open={Boolean(artifact?.body || artifact?.instructor_feedback)}
                className="group rounded-[var(--radius-feature)] border border-line bg-surface-subtle p-5"
              >
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1.5">
                  {/* `list-none` plus an explicit chevron: the native marker is a
                      different glyph in every browser and sits on the text
                      baseline rather than on the heading's optical centre. */}
                  <CaretRightIcon
                    size={15}
                    weight="bold"
                    aria-hidden="true"
                    className="flex-none text-ink-muted transition-transform group-open:rotate-90"
                  />
                  <h2 id="artifact-heading" className="t-card-title text-ink">
                    Hand in your {module.artifact.toLowerCase()}
                  </h2>
                  <span className="t-meta text-ink-muted">Optional</span>
                  {artifact ? (
                    <span className="ml-auto">
                      <StatusChip>
                        {artifact.status === "draft"
                          ? "Draft saved"
                          : artifact.status === "submitted"
                            ? "Submitted"
                            : "Reviewed"}
                      </StatusChip>
                    </span>
                  ) : null}
                </summary>

                <p className="t-body-sm mt-3 max-w-[62ch] text-ink-secondary">
                  Build it wherever you normally work, paste it in, and it stays private
                  until you send it.
                </p>

              {signedIn ? (
                <form action={saveArtifact} className="mt-4">
                  <input type="hidden" name="moduleId" value={module.id} />
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="n" value={n} />

                  {/* Visually hidden: the summary above has already named this,
                      and printing it a second time directly over the box was the
                      redundancy Roan flagged. The field still needs a
                      programmatic label. */}
                  <label htmlFor="artifact-body" className="sr-only">
                    Your {module.artifact.toLowerCase()}
                  </label>
                  <textarea
                    id="artifact-body"
                    name="body"
                    /* 6, not 10. A ten-row box is what made this read as the main
                       event on a page whose main event is the lessons. */
                    rows={6}
                    defaultValue={artifact?.body ?? ""}
                    className="t-body w-full rounded-[var(--radius-card)] border border-line-control bg-surface p-3.5 text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/25"
                    placeholder="Paste it here. Nobody can read this until you send it."
                  />

                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
                    {/*
                      Two submits on one form, told apart by `name`/`value` on the
                      buttons. Saving keeps it private; submitting is the act that
                      lets an instructor read it, which the RLS policy enforces by
                      testing `status <> 'draft'`. That is why they are two
                      deliberate buttons and not an autosave.
                    */}
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
                      className="t-button h-11 rounded-[var(--radius-control)] border border-line-control px-5 text-ink transition-colors hover:border-line-strong"
                    >
                      Submit for review
                    </button>
                  </div>
                </form>
              ) : (
                <p className="t-body-sm mt-4 rounded-[var(--radius-card)] border border-line bg-surface p-4 text-ink-secondary">
                  Module 1 is open with no account. Saving what you produce needs one, because there is
                  nowhere to keep it.{" "}
                  <Link href={unlockHref(path)} className="text-accent no-underline hover:underline">
                    A free account
                  </Link>{" "}
                  keeps this and opens modules 2 to 8.
                </p>
              )}

              {/* Neutral ground, not the accent. DESIGN-SPEC.md rules `--accent`
                  out as a card background, a card border and a label colour, and
                  this block was using it as all three. The note blocks elsewhere
                  in this file already use the neutral anatomy, so it was also
                  inconsistent with itself. */}
              {artifact?.instructor_feedback ? (
                <div className="mt-5 rounded-[var(--radius-card)] border border-line border-l-2 border-l-line-strong bg-surface p-4">
                  <p className="t-label text-ink-muted">Instructor feedback</p>
                  <p className="t-body-sm mt-1.5 whitespace-pre-wrap text-ink">
                    {artifact.instructor_feedback}
                  </p>
                </div>
              ) : null}
              </details>
            </section>
          ) : null}
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
