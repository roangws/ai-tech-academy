import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
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
import { Container, StatusChip } from "@/components/ui";
import { LockedPanel } from "@/components/lms/ui";
import { LessonBlocks } from "@/components/lms/blocks";
import { CourseRail } from "@/components/lms/course-rail";
import { getViewer } from "@/lib/auth";
import { getLessonView, bySlug } from "@/lib/lms/queries";
import { isLocked, unlockHref } from "@/lib/lms/access";
import { toggleLesson } from "@/app/actions/lms";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; n: string; lessonSlug: string }>;
}): Promise<Metadata> {
  const { slug, n, lessonSlug } = await params;
  const course = bySlug.get(slug);

  /* The title used to be the course name on every one of the 173 lessons, so a
     reader with six tabs open had six identical ones and browser history was a
     column of the same five strings. The lesson names its own page; the course
     is the suffix. Derived from content.ts rather than the row so this stays a
     cheap metadata pass with no query. */
  const lesson = course?.curriculum
    .find((m) => m.n === n)
    ?.lessons.find((l) => l.slug === lessonSlug);

  return {
    title: lesson ? `${lesson.name} — ${course?.title}` : (course?.title ?? "Lesson"),
    robots: { index: false, follow: false },
  };
}

/**
 * A lesson, open and readable.
 *
 * This is the page that did not exist. A learner could see 173 lesson titles
 * across the five courses and open none of them — the module page listed names
 * with a tick beside each, which is a syllabus rather than a course. Clicking a
 * lesson now goes somewhere.
 *
 * The gate is re-checked here rather than trusted from the module page, for the
 * same reason it is checked there: this is a directly addressable URL, so
 * `/learn/<course>/04/account-brief` has to decide for itself whether module 04
 * is open to this reader. The check reads `module.access` from the row, not the
 * number in the path.
 */
export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; n: string; lessonSlug: string }>;
}) {
  const { slug, n, lessonSlug } = await params;

  /* Lessons were addressed by array index until the slug landed, so links saved
     or shared before then look like `/learn/<course>/04/02`. Those resolve once,
     permanently, to the lesson that was at that slot. It is three lines and it
     means no reader ever meets a 404 for a URL this app itself handed them. */
  if (/^\d+$/.test(lessonSlug)) {
    const moved = bySlug
      .get(slug)
      ?.curriculum.find((m) => m.n === n)?.lessons[Number(lessonSlug)];
    if (moved) permanentRedirect(`/learn/${slug}/${n}/${moved.slug}`);
    notFound();
  }

  const viewer = await getViewer();
  const view = await getLessonView(slug, n, lessonSlug, viewer?.id ?? null);
  if (!view) notFound();

  const { course, module, lesson, index, total, done, prev, next, nextModule, blocks, siblings, doneIds } =
    view;
  const signedIn = Boolean(viewer);
  const path = `/learn/${slug}/${n}/${lessonSlug}`;

  if (isLocked(module.access, signedIn)) {
    return (
      <Container className="py-10 md:py-14">
        <div className="max-w-[720px]">
          <LockedPanel as="h1" href={unlockHref(path)} moduleName={`Module ${module.n}`} />
        </div>
      </Container>
    );
  }

  /*
    The icon describes what is in the lesson, not what kind of lesson it is.

    It used to be `kindIcon[lesson.kind]`, and `kind: "lesson"` mapped to a play
    circle — so 81 lessons across five courses wore a play button over a page of
    text, on a product with no player anywhere. A first-time reader pressed it,
    got prose, and correctly concluded the course was unfinished. The kind enum
    is a pedagogy label (lesson / lab / template) and must never double as a
    claim about media again.
  */
  const hasVideo = blocks.some((b) => b.kind === "video");
  const hasAudio = blocks.some((b) => b.kind === "audio");
  const Icon = hasVideo
    ? PlayCircleIcon
    : hasAudio
      ? HeadphonesIcon
      : lesson.kind === "lab"
        ? FlaskIcon
        : lesson.kind === "template"
          ? FileTextIcon
          : ArticleIcon;

  /* The seed script writes one prose block keyed `scaffold`. A lesson carrying
     only that has not been authored, and says so — the banner disappears the
     moment somebody adds anything else. The key is what makes that knowable:
     moving the 173 bodies into blocks without it would have marked every lesson
     authored overnight. */
  const scaffolding = blocks.length === 0 || blocks.every((b) => b.key === "scaffold");

  return (
    <Container className="py-10 md:py-14">
      <nav aria-label="Breadcrumb" className="t-meta text-ink-muted">
        <Link href={`/learn/${slug}`} className="text-ink-secondary no-underline hover:underline">
          {course.title}
        </Link>
        <span className="px-1.5 text-line-strong">/</span>
        {/* Names the module, not just its number. "Module 01" told a reader
            nothing they did not already have from the URL, and the module's
            subject appeared nowhere on this page. */}
        <Link href={`/learn/${slug}/${n}`} className="text-ink-secondary no-underline hover:underline">
          Module {module.n} · {module.name}
        </Link>
      </nav>

      {/*
        Two columns from lg. The content track was a bare 720px inside a 1280px
        container, so a 1440 viewport carried roughly 500px of empty white beside
        every lesson — simultaneously the worst shape for a 16:9 player and
        exactly where the syllabus wanted to live. `minmax(0,1fr)` rather than
        `1fr` because a grid child defaults to `min-width:auto` and a long
        unbroken string in the prose would otherwise widen the track instead of
        wrapping.
      */}
      <div className="mt-5 grid items-start gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
        <CourseRail
          courseSlug={slug}
          courseTitle={course.title}
          moduleN={module.n}
          moduleName={module.name}
          lessons={siblings}
          currentSlug={lesson.slug}
          doneIds={doneIds}
        />

        <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <span className="t-label inline-flex items-center gap-1.5 text-ink-muted">
            <Icon size={14} aria-hidden="true" />
            {lesson.kind}
          </span>
          <span className="t-label tabular-nums text-ink-muted">
            Lesson {index + 1} of {total}
          </span>
          {/* A duration only where there is something with a running time. The
              one `minutes` value in content.ts is a marketing claim about a
              video that was never shot, and printing it beside a text lesson
              made the product state a runtime for something you cannot play. */}
          {lesson.minutes && (hasVideo || hasAudio) ? (
            <span className="t-label text-ink-muted">{lesson.minutes} min</span>
          ) : null}
          {done ? <StatusChip>Done</StatusChip> : null}
        </div>

        <h1 className="t-h2 mt-2.5 text-ink">{lesson.name}</h1>

        {/*
          The scaffolding notice, at the top.

          It used to be the last line of every generated body, in italics, after
          600 words — so a reader learned the lesson was a placeholder only after
          spending the time on it. It is a fact about the row now rather than
          text inside it, which also means it disappears on its own the moment
          real content is attached instead of needing a re-seed.
        */}
        {scaffolding ? (
          <p className="t-body-sm mt-5 max-w-[72ch] rounded-[var(--radius-card)] border border-dashed border-line-control bg-surface-subtle p-4 text-ink-secondary">
            <strong className="font-medium text-ink">This lesson is not written yet.</strong> What
            follows is the outline it will be built on. The lab, the template and the artifact this
            module produces are real, and they are what the module is assessed on.
          </p>
        ) : null}

        {blocks.length > 0 ? (
          <LessonBlocks blocks={blocks} />
        ) : (
          <p className="t-body mt-7 text-ink-secondary">This lesson has no written content yet.</p>
        )}

        {/* ------------------------------------------------------- complete */}
        <div className="mt-10 border-t border-line pt-6">
          {signedIn ? (
            <form action={toggleLesson} className="flex flex-wrap items-center gap-4">
              <input type="hidden" name="lessonId" value={lesson.id} />
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="n" value={n} />
              <input type="hidden" name="done" value={String(done)} />
              {/* The `next` hint tells the action where to send them, so finishing
                  a lesson moves forward instead of leaving them on a page they
                  have just finished reading. */}
              <input
                type="hidden"
                name="then"
                value={next ? `/learn/${slug}/${n}/${next.slug}` : `/learn/${slug}/${n}`}
              />
              <button
                type="submit"
                className={`t-button inline-flex h-11 items-center gap-2 rounded-[var(--radius-control)] px-5 transition-colors ${
                  done
                    ? "border border-line-control text-ink-secondary hover:border-line-strong hover:text-ink"
                    : "bg-accent text-on-accent hover:bg-accent-hover"
                }`}
              >
                <CheckIcon size={15} weight="bold" aria-hidden="true" />
                {done ? "Mark as not done" : next ? "Complete and continue" : "Complete lesson"}
              </button>
              {done ? (
                <span className="t-meta text-ink-muted">You finished this one.</span>
              ) : null}
            </form>
          ) : (
            <p className="t-body-sm text-ink-secondary">
              Module 1 is open with no account, and saving your progress is not.{" "}
              <Link href={unlockHref(path)} className="text-accent no-underline hover:underline">
                A free account
              </Link>{" "}
              keeps track of what you have finished.
            </p>
          )}
        </div>

        {/* ----------------------------------------------------- pagination */}
        <nav
          aria-label="Lessons"
          className="mt-10 flex flex-wrap justify-between gap-4 border-t border-line pt-6"
        >
          {prev ? (
            <Link
              href={`/learn/${slug}/${n}/${prev.slug}`}
              className="t-button inline-flex max-w-[45%] items-center gap-1.5 text-ink-secondary no-underline hover:text-ink"
            >
              <ArrowLeftIcon size={14} weight="bold" aria-hidden="true" className="flex-none" />
              <span className="clamp-1">{prev.name}</span>
            </Link>
          ) : (
            <Link
              href={`/learn/${slug}/${n}`}
              className="t-button inline-flex items-center gap-1.5 text-ink-secondary no-underline hover:text-ink"
            >
              <ArrowLeftIcon size={14} weight="bold" aria-hidden="true" />
              Module {module.n}
            </Link>
          )}

          {next ? (
            <Link
              href={`/learn/${slug}/${n}/${next.slug}`}
              className="t-button inline-flex max-w-[45%] items-center gap-1.5 text-right text-accent no-underline hover:underline"
            >
              <span className="clamp-1">{next.name}</span>
              <ArrowRightIcon size={14} weight="bold" aria-hidden="true" className="flex-none" />
            </Link>
          ) : nextModule ? (
            <Link
              href={`/learn/${slug}/${nextModule.n}`}
              className="t-button inline-flex items-center gap-1.5 text-accent no-underline hover:underline"
            >
              Module {nextModule.n} — {nextModule.name}
              <ArrowRightIcon size={14} weight="bold" aria-hidden="true" className="flex-none" />
            </Link>
          ) : (
            <span />
          )}
        </nav>
        </div>
      </div>
    </Container>
  );
}
