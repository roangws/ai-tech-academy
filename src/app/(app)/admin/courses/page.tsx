import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { courses as catalog, totalLessons } from "@/lib/content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Courses", robots: { index: false, follow: false } };

/**
 * The catalogue, from the authoring side.
 *
 * ------------------------------------------------- what is editable and what is not
 *
 * Course and module titles, summaries and lesson names are NOT editable here,
 * and that is a deliberate split rather than a missing feature.
 *
 * `src/lib/content.ts` is the source of truth for catalogue prose, and the five
 * marketing pages import it directly. If an admin renamed a module in the
 * database, `/courses/[slug]` would keep showing the old name forever, because
 * nothing on the marketing side reads Postgres. Making the database
 * authoritative means editing those pages, and they are frozen.
 *
 * So authority splits by column, not by table:
 *
 *   content.ts owns  course + module + lesson prose, deployed with the site
 *   the database owns module access, ordering, and every lesson block
 *
 * Which is the line the product already draws: marketing renders prose, the LMS
 * renders structure and media. Nothing that appears in two places is editable in
 * two places, so nothing can diverge.
 *
 * The cost, stated plainly: renaming a module is a code change and a deploy. For
 * a five-course catalogue authored by one person that is correct. At fifty
 * courses and ten authors it is not, and the fix is to unfreeze the marketing
 * pages and move them onto `use cache` + `cacheTag("catalog")` with `updateTag`
 * on save.
 */
export default async function AdminCourses() {
  const supabase = await createClient();
  const { data: modules } = await supabase
    .from("modules")
    .select("id, course_id, n, access, lessons(id, lesson_blocks(id))")
    .order("position");

  return (
    <>
      <h1 className="t-h2 text-ink">Courses</h1>
      <p className="t-body-sm mt-1.5 max-w-[64ch] text-ink-secondary">
        Titles and lesson names live in <code className="t-meta">content.ts</code> and ship with the
        site. What you set here is what each module opens to, and what each lesson is made of.
      </p>

      <ul className="mt-6 flex flex-col gap-3">
        {catalog.map((course) => {
          const mine = (modules ?? []).filter((m) => m.course_id === course.id);
          const open = mine.filter((m) => m.access === "open").length;
          const authored = mine.reduce(
            (n, m) =>
              n + (m.lessons ?? []).filter((l) => (l.lesson_blocks ?? []).length > 0).length,
            0,
          );
          const lessons = totalLessons(course);

          return (
            <li key={course.id}>
              <Link
                href={`/admin/courses/${course.id}`}
                style={{ borderLeftColor: course.ground ?? undefined }}
                className="flex flex-wrap items-center gap-4 rounded-[var(--radius-card)] border border-line border-l-[3px] bg-surface p-4 no-underline transition-colors hover:border-line-strong"
              >
                <span className="min-w-0 flex-1">
                  <span className="t-label block text-ink-muted">{course.badge}</span>
                  <span className="t-card-title block text-ink">{course.title}</span>
                </span>
                <span className="t-meta text-right text-ink-secondary">
                  <span className="block">
                    {authored} of {lessons} lessons authored
                  </span>
                  <span className="block text-ink-muted">
                    {mine.length} modules · {open} open
                  </span>
                </span>
                <ArrowRightIcon size={15} aria-hidden="true" className="flex-none text-ink-muted" />
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
