import { FilmmakingCookbook } from "@/components/lms/filmmaking-cookbook";
import Link from "next/link";
import {
  CheckCircleIcon,
  PlayCircleIcon,
  ArrowLeftIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Container } from "@/components/ui";
import { Meter } from "@/components/lms/ui";
import { YouTubeBlock } from "@/components/lms/blocks/youtube";
import { LessonAdvance } from "@/components/lms/lesson-advance";
import { LessonBlocks } from "@/components/lms/blocks";
import {
  filmmakingLessons,
  filmmakingPoster,
  filmmakingHref,
} from "@/lib/filmmaking-lessons";
import type { CourseBoard, LessonView } from "@/lib/lms/queries";
import { cn } from "@/lib/utils";

export function FilmmakingClassroom({
  board,
  index,
  materialView = null,
}: {
  board: CourseBoard;
  index: number;
  materialView?: LessonView | null;
}) {
  const current = filmmakingLessons[index];
  const currentModule = board.modules.find((m) => m.n === current.module);
  const lesson = currentModule?.lessons.find((l) => l.slug === current.slug);
  const completed = new Set(
    filmmakingLessons.flatMap((video, i) => {
      const m = board.modules.find((entry) => entry.n === video.module);
      const l = m?.lessons.find((entry) => entry.slug === video.slug);
      return l && m?.doneIds.has(l.id) ? [i] : [];
    }),
  );
  const list = (
    <ol className="mt-4 space-y-1">
      {filmmakingLessons.map((video, i) => (
        <li key={video.youtubeId}>
          {(i === 0 || video.group !== filmmakingLessons[i - 1].group) && (
            <p className="t-label px-2 pb-2 pt-3 text-ink-muted">
              {video.group}
            </p>
          )}
          <Link
            href={filmmakingHref(i)}
            aria-current={i === index ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-[var(--radius-control)] p-2 no-underline transition-colors",
              i === index
                ? "bg-accent-tint text-accent"
                : "text-ink-secondary hover:bg-surface hover:text-ink",
            )}
          >
            {/* Supplied, locally optimized posters reserve their 16:9 space. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={filmmakingPoster(video)}
              alt=""
              width={96}
              height={54}
              loading="lazy"
              className="aspect-video w-24 flex-none rounded-md object-cover"
            />
            <span className="min-w-0 flex-1">
              <span className="t-meta block text-ink-muted">
                Lesson {i + 1}
              </span>
              <span className="t-body-sm block leading-snug">
                {video.title}
              </span>
            </span>
            {completed.has(i) && (
              <CheckCircleIcon
                size={16}
                weight="fill"
                className="flex-none text-accent"
                aria-label="Completed"
              />
            )}
          </Link>
        </li>
      ))}
    </ol>
  );

  return (
    <Container className="py-8 md:py-10">
      <nav aria-label="Breadcrumb" className="t-meta text-ink-muted">
        <Link
          href="/dashboard"
          className="text-ink-secondary no-underline hover:underline"
        >
          My courses
        </Link>
        <span className="px-1.5">/</span>Hybrid filmmaking
      </nav>
      <h1 className="t-h2 mt-4 text-ink">{board.course.title}</h1>
      <p className="t-body-sm mt-2 text-ink-secondary">
        {filmmakingLessons.length} video lessons. Start with the overview, then
        work through the foundations and practical workflows.
      </p>
      <div className="mt-7 grid items-start gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
        <nav aria-label="Video lessons" className="lg:sticky lg:top-[80px]">
          <div className="hidden rounded-[var(--radius-feature)] border border-line bg-surface-subtle p-4 lg:block lg:max-h-[calc(100dvh-104px)] lg:overflow-y-auto">
            <p className="t-card-title text-ink">Course lessons</p>
            <Meter
              className="mt-3"
              done={completed.size}
              total={filmmakingLessons.length}
            />
            {list}
          </div>
          <details className="rounded-[var(--radius-feature)] border border-line bg-surface-subtle lg:hidden">
            <summary className="cursor-pointer p-4 t-body-sm text-ink">
              Course lessons{" "}
              <span className="text-ink-muted">
                {index + 1} of {filmmakingLessons.length}
              </span>
            </summary>
            <div className="px-3 pb-4">{list}</div>
          </details>
        </nav>
        <div className="min-w-0">
          <p className="t-label flex items-center gap-2 text-ink-muted">
            <PlayCircleIcon size={16} aria-hidden="true" />
            Lesson {index + 1} of {filmmakingLessons.length}
            <span className="ml-2">{current.group}</span>
          </p>
          <h2 className="t-h3 mt-2 text-ink">{current.title}</h2>
          <div className="mt-5">
            <YouTubeBlock
              key={current.youtubeId}
              id={current.youtubeId}
              title={current.title}
              poster={filmmakingPoster(current)}
              completion={lesson && currentModule ? { lessonId: lesson.id, courseId: board.courseId, n: currentModule.n, done: completed.has(index) } : undefined}
            />
          </div>
          <p className="t-body mt-5 max-w-[68ch] text-ink-secondary">
            {current.description}
          </p>
          <FilmmakingCookbook index={index} />
          {lesson && currentModule && (
            <LessonAdvance
              key={`${lesson.id}:${completed.has(index)}`}
              lessonId={lesson.id}
              courseId={board.courseId}
              slug={board.course.slug}
              n={currentModule.n}
              done={completed.has(index)}
              next={null}
              nextModule={null}
              forward={{
                href:
                  index + 1 < filmmakingLessons.length
                    ? filmmakingHref(index + 1)
                    : "/dashboard",
                label:
                  index + 1 < filmmakingLessons.length
                    ? "Next lesson"
                    : "Back to My courses",
              }}
            />
          )}
          <nav
            aria-label="Browse lessons"
            className="mt-5 flex justify-between gap-4"
          >
            {index > 0 ? (
              <Link
                href={filmmakingHref(index - 1)}
                className="t-meta inline-flex items-center gap-2 text-ink-secondary hover:text-ink"
              >
                <ArrowLeftIcon size={14} />
                Previous lesson
              </Link>
            ) : (
              <span />
            )}
          </nav>
          <details className="mt-7 rounded-[var(--radius-feature)] border border-line p-5">
            <summary className="t-card-title cursor-pointer text-ink">
              Lesson notes and resources
            </summary>
            <p className="t-body-sm mt-3 text-ink-secondary">
              Use the guide and exercises to develop your own project as you
              watch.
            </p>
            <ul className="mt-3 space-y-3">
              {currentModule?.lessons.map((l) => (
                <li key={l.id}>
                  <Link
                    href={`${filmmakingHref(index)}&material=${encodeURIComponent(l.slug)}#lesson-material`}
                    className="t-body-sm text-accent hover:underline"
                  >
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
          <details className="mt-4 rounded-[var(--radius-feature)] border border-line p-5">
            <summary className="t-body-sm cursor-pointer text-ink-secondary">
              More project material
            </summary>
            <ul className="mt-3 space-y-3">
              {board.modules
                .filter((m) => m.n === "08" || m.n === "12")
                .map((m) => (
                  <li key={m.id}>
                    <p className="t-body-sm text-ink">{m.name}</p>
                    <ul className="mt-2 space-y-2">{m.lessons.map((entry) => <li key={entry.id}><Link href={`${filmmakingHref(index)}&material=${encodeURIComponent(entry.slug)}#lesson-material`} className="t-body-sm text-accent hover:underline">{entry.name}</Link></li>)}</ul>
                  </li>
                ))}
            </ul>
          </details>
          {materialView && <section id="lesson-material" className="mt-8 scroll-mt-24 border-t border-line pt-6">
            <h3 className="t-h3 text-ink">{materialView.lesson.name}</h3>
            <LessonBlocks blocks={materialView.blocks} coverSrc={board.course.cover?.src} />
            <LessonAdvance key={materialView.lesson.id} lessonId={materialView.lesson.id} courseId={board.courseId} slug={board.course.slug} n={materialView.module.n} done={materialView.done} next={null} nextModule={null} forward={{ href: filmmakingHref(index), label: "Back to lesson" }} />
          </section>}
        </div>
      </div>
    </Container>
  );
}
