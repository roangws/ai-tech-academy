import Link from "next/link";
import {
  ArticleIcon,
  CheckCircleIcon,
  CircleIcon,
  FileTextIcon,
  FlaskIcon,
  HeadphonesIcon,
  PlayCircleIcon,
  ArrowLeftIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Meter } from "@/components/lms/ui";
import type { LessonWithKinds } from "@/lib/lms/queries";
import { cn } from "@/lib/utils";

/**
 * Where you are in the module, visible while you read it.
 *
 * ------------------------------------------------------------------- why
 *
 * The lesson page had no syllabus at all. A learner reading lesson 1 could not
 * see the other three, could not tell how far through the module they were, and
 * could not reach lesson 4 without going up to the module and back down — two
 * page loads, losing scroll position, and once there is a video, losing the
 * playhead. Meanwhile the module page one level up already had a sticky rail: the
 * screen that needs context least had it and the screen that needs it most did
 * not.
 *
 * It also reclaims the space. The lesson body sat in a 720px column inside a
 * 1280px container, leaving roughly 500px of empty white on a 1440 viewport —
 * which is both the worst possible shape for a 16:9 player and, at the same
 * time, exactly where the syllabus wanted to live.
 *
 * ------------------------------------------------------------ how it behaves
 *
 * Sticky below the 72px header and independently scrollable, so a long module
 * does not push the page down and the current lesson stays reachable through a
 * forty-minute episode.
 *
 * A plain list of links, in DOM order before `<main>`'s content but after the
 * skip link, so the existing skip link already skips it and no second one is
 * needed. `aria-current="page"` marks the current lesson — the colour is a
 * second cue, not the only one. No roving tabindex and no treegrid: this is a
 * list of links, and Tab already does the right thing with those. Building a
 * treegrid here would be a worse experience than the native one, implemented at
 * greater cost.
 *
 * Below `lg` it becomes a `<details>` under the breadcrumb rather than a drawer.
 * Four to eleven rows do not need a focus trap and an overlay; they need to be
 * collapsed by default and one press away.
 */

function iconFor(lesson: LessonWithKinds) {
  const kinds = new Set((lesson.lesson_blocks ?? []).map((b) => b.kind));
  if (kinds.has("video")) return PlayCircleIcon;
  if (kinds.has("audio")) return HeadphonesIcon;
  if (lesson.kind === "lab") return FlaskIcon;
  if (lesson.kind === "template") return FileTextIcon;
  return ArticleIcon;
}

export function CourseRail({
  courseSlug,
  courseTitle,
  moduleN,
  moduleName,
  lessons,
  currentSlug,
  doneIds,
}: {
  courseSlug: string;
  courseTitle: string;
  moduleN: string;
  moduleName: string;
  lessons: readonly LessonWithKinds[];
  currentSlug: string | null;
  doneIds: ReadonlySet<string>;
}) {
  const done = lessons.filter((l) => doneIds.has(l.id)).length;

  const body = (
    <>
      <Meter className="mt-4" done={done} total={lessons.length} />

      <ol className="mt-4 flex flex-col gap-0.5">
        {lessons.map((lesson, i) => {
          const Icon = iconFor(lesson);
          const isDone = doneIds.has(lesson.id);
          const current = lesson.slug === currentSlug;

          return (
            <li key={lesson.id}>
              <Link
                href={`/learn/${courseSlug}/${moduleN}/${lesson.slug}`}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "flex min-h-[44px] items-center gap-2.5 rounded-[var(--radius-control)] px-2.5 py-2 no-underline transition-colors",
                  current
                    ? "bg-accent-tint text-accent"
                    : "text-ink-secondary hover:bg-surface hover:text-ink",
                )}
              >
                <span className="flex-none" aria-hidden="true">
                  {isDone ? (
                    <CheckCircleIcon size={16} weight="fill" className="text-accent" />
                  ) : (
                    <CircleIcon size={16} className="text-ink-muted" />
                  )}
                </span>
                <span className="t-body-sm min-w-0 flex-1 clamp-2">{lesson.name}</span>
                <Icon size={14} aria-hidden="true" className="flex-none text-ink-muted" />
                <span className="sr-only">
                  {isDone ? "Completed." : "Not completed."} Lesson {i + 1} of {lessons.length}.
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </>
  );

  return (
    <nav aria-label="Lessons in this module" className="lg:sticky lg:top-[88px]">
      {/* Desktop: always open, its own scroll region. */}
      <div className="hidden rounded-[var(--radius-feature)] border border-line bg-surface-subtle p-4 lg:block lg:max-h-[calc(100dvh-120px)] lg:overflow-y-auto">
        <Link
          href={`/learn/${courseSlug}`}
          className="t-meta inline-flex items-center gap-1.5 text-ink-muted no-underline hover:text-ink"
        >
          <ArrowLeftIcon size={12} weight="bold" aria-hidden="true" />
          {courseTitle}
        </Link>
        <p className="t-label mt-2.5 text-ink-muted">Module {moduleN}</p>
        <p className="t-card-title text-ink">{moduleName}</p>
        {body}
      </div>

      {/* Phone and tablet: collapsed, one press away, no overlay. */}
      <details className="rounded-[var(--radius-feature)] border border-line bg-surface-subtle lg:hidden">
        <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
          <span className="min-w-0">
            <span className="t-label block text-ink-muted">Module {moduleN}</span>
            <span className="t-body-sm block truncate text-ink">{moduleName}</span>
          </span>
          <span className="t-meta flex-none tabular-nums text-ink-muted">
            {done}/{lessons.length}
          </span>
        </summary>
        <div className="border-t border-line px-4 pb-4">{body}</div>
      </details>
    </nav>
  );
}
