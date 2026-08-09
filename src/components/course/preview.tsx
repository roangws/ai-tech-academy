import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { YouTubeBlock } from "@/components/lms/blocks/youtube";
import { publicMediaUrl } from "@/lib/lms/media";
import { createClient } from "@/lib/supabase/server";
import type { Course } from "@/lib/content";

/**
 * The first lesson's video, on the public course page.
 *
 * ------------------------------------------------------------------ why
 *
 * A visitor deciding whether to take a six-week course could read about it at
 * length and never see a second of it. Module 1 is open with no account, which
 * means the first video is already public — the gate lets anyone watch it, and
 * the marketing page was the one surface that never offered it. So the strongest
 * thing the course has was sitting one navigation away from the page whose whole
 * job is to convert.
 *
 * ------------------------------------------------------- it reads the database
 *
 * `/courses/[slug]` is dynamic, so this can query. It reads the first `video`
 * block in module 01 through the caller's own session, which for a signed-out
 * visitor means `catalog_blocks_read` decides — and it returns the block only
 * because module 01 is `access = 'open'`. If somebody closed module 1, this
 * would go quiet on its own rather than leaking a locked lesson onto a public
 * page. The gate is not re-implemented here; it is relied on.
 *
 * Renders nothing at all when there is no video yet, which is four of the five
 * courses today. An empty slot beats a placeholder.
 */
export async function CoursePreview({ course }: { course: Course }) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("lesson_blocks")
    .select("payload, title, lessons!inner(slug, modules!inner(n, course_id, access))")
    .eq("kind", "video")
    .eq("lessons.modules.course_id", course.id)
    .eq("lessons.modules.n", "01")
    .order("position")
    .limit(1)
    .maybeSingle();

  const row = data as unknown as {
    payload: { youtube_id: string; poster?: string };
    title: string | null;
    lessons: { slug: string; modules: { n: string } };
  } | null;

  if (!row?.payload?.youtube_id) return null;

  const lessonHref = `/learn/${course.slug}/${row.lessons.modules.n}/${row.lessons.slug}`;

  return (
    <section aria-labelledby="preview-heading" className="mt-12">
      <h2 id="preview-heading" className="t-h3 text-ink">
        Watch the first lesson
      </h2>
      <p className="t-body-sm mt-1.5 max-w-[62ch] text-ink-secondary">
        Module 1 is open to everyone. No account, no card, nothing to cancel.
      </p>

      <div className="mt-5 grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <YouTubeBlock
          id={row.payload.youtube_id}
          title={row.title ?? `${course.title}, lesson 1`}
          poster={publicMediaUrl(row.payload.poster ?? "")}
        />

        <div className="rounded-[var(--radius-feature)] border border-line bg-surface-subtle p-5">
          <p className="t-card-title text-ink">Start module 1 now</p>
          <p className="t-body-sm mt-2 text-ink-secondary">
            Four lessons, one lab, and you finish holding a baseline you measured yourself. It is
            the same course whether or not you ever make an account.
          </p>
          {/*
            The one control this section exists for, and it goes to the LESSON
            rather than to sign-up. The whole argument of the free first module is
            that somebody can start without deciding anything, and a call to
            action that opens an account form instead is the offer withdrawn at
            the moment it is accepted.
          */}
          <Link
            href={lessonHref}
            className="t-button mt-5 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[var(--radius-control)] bg-accent px-5 text-on-accent no-underline transition-colors hover:bg-accent-hover"
          >
            Start lesson 1
            <ArrowRightIcon size={15} weight="bold" aria-hidden="true" />
          </Link>
          <p className="t-meta mt-3 text-center text-ink-muted">
            An account keeps your progress and opens modules 2 to 8.
          </p>
        </div>
      </div>
    </section>
  );
}
