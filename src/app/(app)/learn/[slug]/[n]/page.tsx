import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArticleIcon,
  CheckIcon,
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
import { toggleLesson, saveArtifact } from "@/app/actions/lms";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; n: string }>;
}): Promise<Metadata> {
  const { slug, n } = await params;
  const course = bySlug.get(slug);
  return {
    title: course ? `Module ${n} — ${course.title}` : "Module",
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
            items={[`${lessons.length} lessons`, course.badge, module.step ? `Step ${module.step}` : ""].filter(Boolean)}
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
                  {signedIn ? (
                    <form action={toggleLesson} className="flex-none">
                      <input type="hidden" name="lessonId" value={lesson.id} />
                      <input type="hidden" name="slug" value={slug} />
                      <input type="hidden" name="n" value={n} />
                      <input type="hidden" name="done" value={String(isDone)} />
                      {/*
                        `aria-pressed` is what makes this a toggle rather than a
                        button whose meaning has to be inferred from the tail of
                        its own label. Before it, the only state channel was the
                        fill colour and a name that changed from "Mark X
                        complete" to "Mark X not complete" — so a screen-reader
                        user ticked a lesson, the action round-tripped, focus
                        stayed on the re-rendered button, and nothing was
                        announced. `aria-pressed` is read on focus and re-read
                        when it changes, which is exactly the confirmation that
                        was missing.

                        The green also went. `--state-open` means "open with no
                        account" on this site and nothing else; a completed
                        lesson is the accent.
                      */}
                      <button
                        type="submit"
                        aria-pressed={isDone}
                        className={`grid size-8 place-items-center rounded-full border transition-colors ${
                          isDone
                            ? "border-accent bg-accent-tint text-accent"
                            : "border-line-control text-ink-muted hover:border-accent hover:text-accent"
                        }`}
                      >
                        <CheckIcon size={15} weight="bold" aria-hidden="true" />
                        <span className="sr-only">Complete {lesson.name}</span>
                      </button>
                    </form>
                  ) : null}
                </li>
              );
            })}
          </ul>

          {/* --------------------------------------------------------- artifact */}
          {module.artifact ? (
            <section aria-labelledby="artifact-heading" className="mt-12">
              <h2 id="artifact-heading" className="t-h3 text-ink">
                {module.artifact}
              </h2>
              <p className="t-body-sm mt-2 max-w-[60ch] text-ink-secondary">
                Every module leaves one thing behind. This is the one for module {module.n}, and it
                is yours — it stays in your account and it is what your outcome sheet is built from.
              </p>

              {signedIn ? (
                <form action={saveArtifact} className="mt-5">
                  <input type="hidden" name="moduleId" value={module.id} />
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="n" value={n} />

                  <label htmlFor="artifact-body" className="t-field block text-ink-secondary">
                    Your {module.artifact.toLowerCase()}
                  </label>
                  <textarea
                    id="artifact-body"
                    name="body"
                    rows={10}
                    defaultValue={artifact?.body ?? ""}
                    className="t-body mt-1.5 w-full rounded-[var(--radius-card)] border border-line-control bg-surface p-3.5 text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/25"
                    placeholder="Write it here. Nobody sees this until you submit it."
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
                      className="t-button h-11 rounded-[var(--radius-control)] border border-line-control px-5 text-ink-secondary transition-colors hover:border-line-control-strong hover:text-ink"
                    >
                      Save draft
                    </button>
                    <button
                      type="submit"
                      name="intent"
                      value="submit"
                      className="t-button h-11 rounded-[var(--radius-control)] bg-accent px-5 text-on-accent transition-colors hover:bg-accent-hover"
                    >
                      Submit for review
                    </button>
                    {artifact ? (
                      <span className="t-meta text-ink-muted">
                        {artifact.status === "draft"
                          ? "Saved as a draft. Only you can see it."
                          : artifact.status === "submitted"
                            ? "Submitted. Your instructor can read it."
                            : "Reviewed."}
                      </span>
                    ) : null}
                  </div>
                </form>
              ) : (
                <p className="t-body-sm mt-4 rounded-[var(--radius-card)] border border-line bg-surface-subtle p-4 text-ink-secondary">
                  Module 1 is open with no account, and saving what you produce is not — there is
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
                <div className="mt-6 rounded-[var(--radius-card)] border border-line border-l-2 border-l-line-strong bg-surface-subtle p-4">
                  <p className="t-label text-ink-muted">Instructor feedback</p>
                  <p className="t-body-sm mt-1.5 whitespace-pre-wrap text-ink">
                    {artifact.instructor_feedback}
                  </p>
                </div>
              ) : null}
            </section>
          ) : null}

          {/* ------------------------------------------------------ pagination */}
          <nav aria-label="Modules" className="mt-12 flex justify-between gap-4 border-t border-line pt-6">
            {prev ? (
              <Link
                href={`/learn/${slug}/${prev.n}`}
                className="t-button inline-flex items-center gap-1.5 text-ink-secondary no-underline hover:text-ink"
              >
                <ArrowLeftIcon size={14} weight="bold" aria-hidden="true" />
                {prev.n} {prev.name}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={`/learn/${slug}/${next.n}`}
                className="t-button inline-flex items-center gap-1.5 text-right text-accent no-underline hover:underline"
              >
                {next.n} {next.name}
                <ArrowRightIcon size={14} weight="bold" aria-hidden="true" />
              </Link>
            ) : (
              <span />
            )}
          </nav>
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
