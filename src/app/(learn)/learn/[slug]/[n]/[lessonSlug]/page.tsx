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
import { LessonAdvance } from "@/components/lms/lesson-advance";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; n: string; lessonSlug: string }>;
}): Promise<Metadata> {
  const { slug, n, lessonSlug } = await params;
  const course = await bySlug(slug);

  /* The title used to be the course name on every one of the 173 lessons, so a
     reader with six tabs open had six identical ones and browser history was a
     column of the same five strings. The lesson names its own page; the course
     is the suffix. Derived from content.ts rather than the row so this stays a
     cheap metadata pass with no query. */
  const lesson = course?.curriculum
    .find((m) => m.n === n)
    ?.lessons.find((l) => l.slug === lessonSlug);

  return {
    title: lesson ? `${lesson.name} · ${course?.title}` : (course?.title ?? "Lesson"),
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
  searchParams,
}: {
  params: Promise<{ slug: string; n: string; lessonSlug: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { slug, n, lessonSlug } = await params;
  const { from } = await searchParams;

  /* Lessons were addressed by array index until the slug landed, so links saved
     or shared before then look like `/learn/<course>/04/02`. Those resolve once,
     permanently, to the lesson that was at that slot. It is three lines and it
     means no reader ever meets a 404 for a URL this app itself handed them. */
  if (/^\d+$/.test(lessonSlug)) {
    const moved = (await bySlug(slug))?.curriculum.find((m) => m.n === n)?.lessons[
      Number(lessonSlug)
    ];
    if (moved) permanentRedirect(`/learn/${slug}/${n}/${moved.slug}`);
    notFound();
  }

  const viewer = await getViewer();
  const view = await getLessonView(slug, n, lessonSlug, viewer?.id ?? null);
  if (!view) notFound();

  const { course, module, lesson, index, total, done, prev, next, blocks, siblings, doneIds } =
    view;
  const signedIn = Boolean(viewer);
  const path = `/learn/${slug}/${n}/${lessonSlug}`;

  /* The lesson `?from=` claims was just completed, if that claim holds. Both
     halves matter: it must be a lesson of this module, and it must actually be
     ticked for this reader. */
  const claimed = from ? siblings.find((l) => l.slug === from) : undefined;
  const finished = claimed && doneIds.has(claimed.id) ? claimed : null;

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
        {/*
          What just happened, named.

          This is the piece both earlier versions of the complete control were
          missing, and its absence is why the first one was reported as broken:
          you pressed a button, the page changed, and nothing anywhere said the
          lesson you had just finished was finished. A tick moving in the rail
          300px away — collapsed inside a `<details>` below `lg` — is not an
          acknowledgement.

          Resolved rather than trusted. `?from=` is a query string and anybody
          can type one, so it renders only when it names a lesson that is
          genuinely in this module AND is genuinely marked done for this reader.
          A hand-edited URL cannot forge a completion.

          No `aria-live`. This is a fresh navigation and a screen reader reads the
          page on arrival; a live region here would announce it twice.
        */}
        {finished ? (
          <p className="t-body-sm mb-4 inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-[var(--radius-card)] border border-line bg-surface-subtle px-3.5 py-2.5 text-ink-secondary">
            <CheckIcon size={15} weight="bold" aria-hidden="true" className="text-accent" />
            <span>
              <strong className="font-medium text-ink">{finished.name}</strong> is done. {doneIds.size}{" "}
              of {siblings.length} in module {module.n}.
            </span>
            <Link
              href={`/learn/${slug}/${n}/${finished.slug}`}
              className="text-accent no-underline hover:underline"
            >
              Open it again
            </Link>
          </p>
        ) : null}

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
        {/*
          One region, and it always contains a primary forward control.

          There used to be two: a tick here, and — rendered only once `done` was
          true — a promoted "Next lesson" below it. That second block was a
          duplicate of the pagination card at the foot of the page, appeared ten
          seconds after the press, and did not exist at all for a reader who had
          not ticked or was not signed in. Every visitor to the free module 1 met
          a lesson whose only forward controls were two grey pagination cards.

          The signed-out branch keeps its sentence about accounts and gains the
          same accent forward control, because being signed out is a reason not
          to SAVE progress and not a reason to be denied the next lesson.
        */}
        {signedIn ? (
          <LessonAdvance
            lessonId={lesson.id}
            slug={slug}
            n={n}
            lessonSlug={lessonSlug}
            done={done}
            next={next ? { slug: next.slug, name: next.name } : null}
            artifact={module.artifact ?? ""}
          />
        ) : (
          <div className="mt-10 border-t border-line pt-6">
            <Link
              href={
                next
                  ? `/learn/${slug}/${n}/${next.slug}`
                  : `/learn/${slug}/${n}#artifact-heading`
              }
              className="t-button inline-flex h-11 items-center gap-2 rounded-[var(--radius-control)] bg-accent px-5 text-on-accent no-underline transition-colors hover:bg-accent-hover"
            >
              {next
                ? `Next lesson: ${next.name}`
                : module.artifact
                  ? `Write your ${module.artifact.toLowerCase()}`
                  : "Finish the module"}
              <ArrowRightIcon size={15} weight="bold" aria-hidden="true" />
            </Link>
            <p className="t-body-sm mt-3 text-ink-secondary">
              Module 1 is open with no account, and saving your progress is not.{" "}
              <Link href={unlockHref(path)} className="text-accent no-underline hover:underline">
                A free account
              </Link>{" "}
              keeps track of what you have finished.
            </p>
          </div>
        )}

        {/*
          Where to go next, as two named cards.

          It was a pair of 14px text links at the very bottom, an arrow and a
          truncated title on each side, and it read as page furniture rather than
          as the way through the course. On a lesson that is the last thing on the
          page it is also the only forward control a reader has, so it has to look
          like one.

          Each card names the lesson AND says which direction it is, because
          "The launch checklist" on its own tells you nothing about whether you
          have read it.
        */}
        {/* "Move between lessons", not "Lessons in this module": the syllabus rail
            already owns that name, and two navigation landmarks with the same
            label leave a screen reader listing two identical regions with no way
            to tell the outline from the pagination. The site-header note records
            the same fix for the footer and the courses panel. */}
        <nav aria-label="Move between lessons" className="mt-10 grid gap-3 border-t border-line pt-6 sm:grid-cols-2">
          {prev ? (
            <Link
              href={`/learn/${slug}/${n}/${prev.slug}`}
              className="group flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 no-underline transition-colors hover:border-line-strong"
            >
              <ArrowLeftIcon
                size={16}
                weight="bold"
                aria-hidden="true"
                className="flex-none text-ink-muted transition-colors group-hover:text-accent"
              />
              <span className="min-w-0">
                <span className="t-meta block text-ink-muted">Previous lesson</span>
                <span className="t-body-sm block clamp-2 text-ink">{prev.name}</span>
              </span>
            </Link>
          ) : (
            <Link
              href={`/learn/${slug}/${n}`}
              className="group flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 no-underline transition-colors hover:border-line-strong"
            >
              <ArrowLeftIcon
                size={16}
                weight="bold"
                aria-hidden="true"
                className="flex-none text-ink-muted transition-colors group-hover:text-accent"
              />
              <span className="min-w-0">
                <span className="t-meta block text-ink-muted">Back to</span>
                <span className="t-body-sm block clamp-2 text-ink">Module {module.n}</span>
              </span>
            </Link>
          )}

          {next ? (
            <Link
              href={`/learn/${slug}/${n}/${next.slug}`}
              className="group flex items-center justify-between gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 text-right no-underline transition-colors hover:border-line-strong sm:col-start-2"
            >
              <span className="min-w-0 flex-1">
                <span className="t-meta block text-ink-muted">Next lesson</span>
                <span className="t-body-sm block clamp-2 text-ink">{next.name}</span>
              </span>
              <ArrowRightIcon
                size={16}
                weight="bold"
                aria-hidden="true"
                className="flex-none text-ink-muted transition-colors group-hover:text-accent"
              />
            </Link>
          ) : (
            <Link
              href={`/learn/${slug}/${n}#artifact-heading`}
              /* Neutral, like its sibling. This card used to carry the accent
                 and a tint because it was the only forward control a reader had
                 once they had ticked the lesson. The primary control above owns
                 that job now, and two accented forward controls on one page is
                 the duplication that made this page read as two prompts to
                 finish one lesson. */
              className="group flex items-center justify-between gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 text-right no-underline transition-colors hover:border-line-strong sm:col-start-2"
            >
              <span className="min-w-0 flex-1">
                <span className="t-meta block text-ink-muted">Last lesson in this module</span>
                <span className="t-body-sm block clamp-2 text-ink">
                  {module.artifact ? `Write your ${module.artifact.toLowerCase()}` : "Finish the module"}
                </span>
              </span>
              <ArrowRightIcon
                size={16}
                weight="bold"
                aria-hidden="true"
                className="flex-none text-ink-muted transition-colors group-hover:text-accent"
              />
            </Link>
          )}
        </nav>
        </div>
      </div>
    </Container>
  );
}
