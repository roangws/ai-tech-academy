import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, ArrowUpIcon, ArrowDownIcon, PlusIcon, StarIcon } from "@phosphor-icons/react/dist/ssr";
import { StatusChip } from "@/components/ui";
import { ActionForm, Field, Save, Quiet, Text } from "@/components/lms/admin-form";
import { getAdminCatalog, totalLessons } from "@/lib/catalog";
import { createCourse, moveCourse, setFeatured } from "@/app/actions/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Courses", robots: { index: false, follow: false } };

/**
 * The catalogue, from the authoring side.
 *
 * ------------------------------------------------------------------ what changed
 *
 * This page used to open with a paragraph explaining that course titles, module
 * names and lesson names were not editable here — that they lived in
 * `content.ts` and shipped with the site — and it was true. The only control on
 * the whole console was a module access toggle.
 *
 * The reasoning behind that split was sound for a five-course catalogue written
 * by one person, and it made the product impossible to hand to anybody else:
 * creating a course meant editing TypeScript and deploying. The catalogue lives
 * in Postgres now, so the words on this screen are the words on the site.
 *
 * ------------------------------------------------------------ draft and lead
 *
 * Two states, and they answer different questions.
 *
 * `status` is whether the course exists for a visitor at all. A draft is absent
 * from the homepage, from /courses, from the sitemap and from the player, which
 * is what makes it safe to build one on the live site. Publishing checks the
 * course is actually openable first — see `setCourseStatus`.
 *
 * `featured` is which published course leads the homepage grid as the wide card.
 * Exactly one, so setting it clears the others.
 */
export default async function AdminCourses() {
  const catalog = await getAdminCatalog();

  return (
    <>
      <h1 className="t-h2 text-ink">Courses</h1>
      <p className="t-body-sm mt-1.5 max-w-[64ch] text-ink-secondary">
        Everything here is what the site shows. A new course starts as a draft — invisible to
        visitors and to the player — with one open module and one lesson, so it can be opened from
        the moment it exists.
      </p>

      {/* ------------------------------------------------------------- new */}
      <ActionForm
        action={createCourse}
        className="mt-6 rounded-[var(--radius-feature)] border border-line bg-surface-subtle p-4"
      >
        <p className="t-card-title text-ink">Create a course</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_200px_auto] sm:items-end">
          <Field label="Title" hint="What it is called everywhere. Everything else is editable next.">
            <Text name="title" placeholder="Applied AI for finance teams" />
          </Field>
          <Field label="Id (optional)" hint="Built from the title when blank.">
            <Text name="id" placeholder="finance" />
          </Field>
          <Save>
            <PlusIcon size={15} weight="bold" aria-hidden="true" />
            Create draft
          </Save>
        </div>
      </ActionForm>

      <ul className="mt-6 flex flex-col gap-3">
        {catalog.map((course, i) => {
          const lessons = totalLessons(course);
          const open = course.curriculum.filter((m) => m.access === "open").length;

          return (
            <li
              key={course.id}
              style={{ borderLeftColor: course.ground ?? undefined }}
              className="rounded-[var(--radius-card)] border border-line border-l-[3px] bg-surface p-4"
            >
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href={`/admin/courses/${course.id}`}
                  className="min-w-0 flex-1 no-underline"
                >
                  <span className="t-label block text-ink-muted">{course.badge}</span>
                  <span className="t-card-title block text-ink">{course.title}</span>
                  <span className="t-meta mt-0.5 block text-ink-muted">
                    {course.curriculum.length} modules · {lessons} lessons · {open} open · /
                    {course.slug}
                  </span>
                </Link>

                <div className="flex flex-wrap items-center gap-2">
                  {course.status === "published" ? (
                    <StatusChip open>Published</StatusChip>
                  ) : (
                    <StatusChip>Draft</StatusChip>
                  )}

                  {/* The lead card, and only a published course can be one —
                      featuring a draft would name a course the homepage cannot
                      render. */}
                  {course.status === "published" ? (
                    course.featured ? (
                      <span className="t-meta inline-flex min-h-[36px] items-center gap-1.5 rounded-[var(--radius-control)] border border-accent px-2.5 text-accent">
                        <StarIcon size={13} weight="fill" aria-hidden="true" />
                        Leads the homepage
                      </span>
                    ) : (
                      <form action={setFeatured}>
                        <input type="hidden" name="courseId" value={course.id} />
                        <Quiet title="Make this the wide lead card on the homepage">
                          <StarIcon size={13} aria-hidden="true" />
                          Lead the homepage
                        </Quiet>
                      </form>
                    )
                  ) : null}

                  <form action={moveCourse} className="flex gap-1">
                    <input type="hidden" name="courseId" value={course.id} />
                    <input type="hidden" name="direction" value="up" />
                    {i > 0 ? (
                      <Quiet ariaLabel={`Move ${course.title} up`}>
                        <ArrowUpIcon size={13} aria-hidden="true" />
                      </Quiet>
                    ) : null}
                  </form>
                  <form action={moveCourse} className="flex gap-1">
                    <input type="hidden" name="courseId" value={course.id} />
                    <input type="hidden" name="direction" value="down" />
                    {i < catalog.length - 1 ? (
                      <Quiet ariaLabel={`Move ${course.title} down`}>
                        <ArrowDownIcon size={13} aria-hidden="true" />
                      </Quiet>
                    ) : null}
                  </form>

                  <Link
                    href={`/admin/courses/${course.id}`}
                    className="t-meta inline-flex min-h-[36px] items-center gap-1.5 rounded-[var(--radius-control)] border border-line-control px-2.5 text-ink-secondary no-underline transition-colors hover:border-accent hover:text-accent"
                  >
                    Edit
                    <ArrowRightIcon size={13} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
