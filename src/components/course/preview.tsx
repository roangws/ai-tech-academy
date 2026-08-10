import { YouTubeBlock } from "@/components/lms/blocks/youtube";
import { EnrollButton } from "@/components/ui";
import { publicMediaUrl } from "@/lib/lms/media";
import { createClient } from "@/lib/supabase/server";
import { type Course } from "@/lib/content";

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

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <YouTubeBlock
        id={row.payload.youtube_id}
        title={row.title ?? `${course.title}, lesson 1`}
        /*
          THE POSTER FALLS BACK TO THE COURSE'S OWN COVER, and without that this
          player rendered as a flat charcoal rectangle with a play button on it.

          `payload.poster` is optional and unset on every block seeded so far, so
          `publicMediaUrl("")` returned null and the facade drew no image at all —
          which is what Roan photographed and called a missing thumbnail. The old
          reading of "no poster gets a plain ground" was written for a lesson page
          where the surrounding chrome already says which course you are in. On a
          marketing page it is a hole.

          The cover is the right thing to fall back to rather than YouTube's
          `i.ytimg.com` frame: the whole reason this player is a facade is to make
          no request to Google before somebody presses play, and pulling the
          thumbnail from Google's CDN would undo that with the picture that
          advertises it. The cover is already on this page, already ours, and
          already the image this reader associates with the course.
        */
        poster={publicMediaUrl(row.payload.poster ?? "") ?? course.cover?.src ?? null}
      />

      <div className="rounded-[var(--radius-feature)] border border-line bg-surface p-5">
        <p className="t-card-title text-ink">Start module 1 now</p>
        <p className="t-body-sm mt-2 text-ink-secondary">
          Open to everyone. No account, no card, nothing to cancel.
        </p>
        {/*
          `ButtonLink`, not a hand-rolled class string — and that is the whole of
          what was wrong with this control. It carried its own `min-h-[48px]`,
          its own padding and its own hover, which is how it ended up a different
          height and a different radius from the rail's primary 200px above it.
          Two filled accent buttons on one page disagreeing about their own shape
          reads as two pages.

          It also goes through `/start` now rather than at a lesson URL computed
          here. Same destination for a signed-out reader; for a signed-in one it
          enrols them and resumes where they were, which a hardcoded "lesson 1"
          link cannot do. One control, one behaviour, wherever it appears.

          `EnrollButton withDate`, per Roan's instruction that every call to
          action on a course page reads "Enroll for free / Starts <today>". It was
          `cta.start`, which made this the second label on one page for the one
          thing the page is for — the rail 200px above said "Start the course" and
          this said it again, and neither of them said the word a reader arrived
          looking for. The enrol-rail note has the full argument.
        */}
        <EnrollButton
          withDate
          href={`/courses/${course.slug}/start`}
          className="mt-5 w-full"
        />
        <p className="t-meta mt-3 text-center text-ink-muted">
          An account keeps your progress and opens the rest.
        </p>
      </div>
    </div>
  );
}
