import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowSquareOutIcon,
  PlusIcon,
  StarIcon,
} from "@phosphor-icons/react/dist/ssr";
import { ActionForm, Field, Save, Quiet, Text } from "@/components/lms/admin-form";
import { getAdminCatalog, totalLessons, type AdminCourse } from "@/lib/catalog";
import { createCourse, moveCourse, setFeatured } from "@/app/actions/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Courses", robots: { index: false, follow: false } };

/**
 * The catalogue, from the authoring side.
 *
 * ------------------------------------------------------------------ the redesign
 *
 * Roan: "/admin/courses — this vibe-coded design has to be updated for one that
 * doesn't [look] vibe-coded."
 *
 * The version this replaces was five identical hairline rows, each ending in a
 * run of six same-sized controls — Published, Lead the homepage, up, down, Edit —
 * laid out left to right in the order they happened to be written. Nothing on the
 * row was larger than anything else, so there was no answer to "what is this
 * screen for": every course looked like every other course and every control
 * looked like every other control. That flatness is the tell, and it is a real
 * usability problem rather than a taste one — the primary act on this screen
 * (open a course and write it) had exactly the same weight as reordering the
 * grid.
 *
 * Three changes, each taking something that was being stated and letting it be
 * seen instead:
 *
 *   1. THE COVER. Every course on this site has a photograph and this screen
 *      ignored it, identifying five courses by a line of grey type. A 112px frame
 *      makes the list scannable at a glance and ties the console to the site it
 *      edits — the same argument `lms/course-photo.tsx` makes for the dashboard.
 *   2. DRAFTS ARE THEIR OWN GROUP. Status was a chip in a row of chips, so the
 *      one fact that decides whether a course is visible to the public was the
 *      same size as a sort button. Drafts now sit above the live catalogue under
 *      their own heading, which is also the order somebody works in.
 *   3. ONE PRIMARY PER ROW. "Edit" is the filled control and everything else is
 *      quiet. Reordering moved into a small stacked pair at the right edge where
 *      it stops competing.
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
  const drafts = catalog.filter((c) => c.status !== "published");
  const live = catalog.filter((c) => c.status === "published");

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="t-h2 text-ink">Courses</h1>
          <p className="t-body-sm mt-1.5 max-w-[60ch] text-ink-secondary">
            Everything here is what the site shows. A new course starts as a draft — invisible to
            visitors and to the player — with one open module and one lesson, so it can be opened
            from the moment it exists.
          </p>
        </div>
        <p className="t-meta text-ink-muted">
          {live.length} live · {drafts.length} draft{drafts.length === 1 ? "" : "s"}
        </p>
      </div>

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

      {/* Drafts first, because a draft is unfinished work and this is the screen
          somebody opens to finish it. Rendered only when there are any: an empty
          "Drafts" heading is a section describing its own absence. */}
      {drafts.length > 0 ? (
        <Group
          id="drafts"
          title="Drafts"
          blurb="Not on the site yet. Publishing checks the course can actually be opened first."
          courses={drafts}
          catalog={catalog}
        />
      ) : null}

      <Group
        id="live"
        title="On the site"
        blurb="In the order they appear on /courses and in the homepage grid."
        courses={live}
        catalog={catalog}
        empty="Nothing published yet. A draft becomes visible the moment you publish it."
      />
    </>
  );
}

function Group({
  id,
  title,
  blurb,
  courses,
  catalog,
  empty,
}: {
  id: string;
  title: string;
  blurb: string;
  courses: AdminCourse[];
  /*
    The WHOLE catalogue, not just this group, and the reason is a bug the
    grouping introduced.

    `moveCourse` swaps a course with its neighbour by global position. Deciding
    which arrows to draw from the index within a group would therefore describe a
    different list from the one the button operates on: the first live course
    would lose its "up" arrow while a draft sat above it and the move was
    perfectly legal, and the last draft's "down" would swap it with a published
    course while claiming to be the end of the list.

    So the arrows are drawn from where the course sits in the catalogue. The
    grouping is a reading aid; the order is one order.
  */
  catalog: AdminCourse[];
  empty?: string;
}) {
  return (
    <section aria-labelledby={id} className="mt-8">
      <h2 id={id} className="t-h3 text-ink">
        {title}
      </h2>
      <p className="t-meta mt-1 max-w-[64ch] text-ink-muted">{blurb}</p>

      {courses.length === 0 && empty ? (
        <p className="t-body-sm mt-4 rounded-[var(--radius-card)] border border-dashed border-line-control bg-surface-subtle p-4 text-ink-secondary">
          {empty}
        </p>
      ) : null}

      <ul className="mt-4 flex flex-col gap-3">
        {courses.map((course) => {
          const at = catalog.findIndex((c) => c.id === course.id);
          const lessons = totalLessons(course);
          const openModules = course.curriculum.filter((m) => m.access === "open").length;

          return (
            <li
              key={course.id}
              className="overflow-hidden rounded-[var(--radius-feature)] border border-line bg-surface transition-colors hover:border-line-strong"
            >
              <div className="flex flex-wrap items-stretch gap-4 p-3 sm:flex-nowrap">
                {/*
                  The course's own photograph, at the size a face is recognisable
                  and no larger. `ground` behind it so a course with no cover yet
                  degrades to its own hue rather than to a grey hole — the same
                  rule `lms/course-photo.tsx` holds, and the reason no placeholder
                  art is generated anywhere on this site.
                */}
                <Link
                  href={`/admin/courses/${course.id}`}
                  aria-hidden="true"
                  tabIndex={-1}
                  style={{ background: course.ground ?? "var(--surface-sunken)" }}
                  className="relative block h-[72px] w-[112px] flex-none overflow-hidden rounded-[var(--radius-control)] sm:h-auto sm:min-h-[84px]"
                >
                  {course.cover ? (
                    <Image
                      src={course.cover.src}
                      alt=""
                      fill
                      sizes="112px"
                      style={{ objectPosition: course.cover.focus ?? "50% 50%" }}
                      className="object-cover"
                    />
                  ) : null}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="t-label text-ink-muted">{course.badge}</span>
                    {course.featured ? (
                      <span className="t-micro inline-flex items-center gap-1 rounded-full border border-accent px-1.5 py-0.5 text-accent">
                        <StarIcon size={10} weight="fill" aria-hidden="true" />
                        Leads the homepage
                      </span>
                    ) : null}
                  </div>

                  <Link
                    href={`/admin/courses/${course.id}`}
                    className="t-card-title text-ink no-underline hover:underline"
                  >
                    {course.title}
                  </Link>

                  <p className="t-meta text-ink-muted">
                    {course.curriculum.length} modules · {lessons} lessons · {openModules} open ·{" "}
                    <code>/{course.slug}</code>
                  </p>
                </div>

                <div className="flex flex-none flex-wrap items-center gap-2 self-center">
                  {/* Reordering, stacked and small. It was two full-height
                      buttons in the middle of the control row, which gave a sort
                      affordance the same weight as the one control this screen
                      exists for. */}
                  <div className="flex flex-col gap-0.5">
                    <form action={moveCourse}>
                      <input type="hidden" name="courseId" value={course.id} />
                      <input type="hidden" name="direction" value="up" />
                      {at > 0 ? (
                        <Quiet ariaLabel={`Move ${course.title} up`}>
                          <ArrowUpIcon size={12} aria-hidden="true" />
                        </Quiet>
                      ) : null}
                    </form>
                    <form action={moveCourse}>
                      <input type="hidden" name="courseId" value={course.id} />
                      <input type="hidden" name="direction" value="down" />
                      {at < catalog.length - 1 ? (
                        <Quiet ariaLabel={`Move ${course.title} down`}>
                          <ArrowDownIcon size={12} aria-hidden="true" />
                        </Quiet>
                      ) : null}
                    </form>
                  </div>

                  {/* Only a published course can lead the homepage — featuring a
                      draft would name a course the homepage cannot render. */}
                  {course.status === "published" && !course.featured ? (
                    <form action={setFeatured}>
                      <input type="hidden" name="courseId" value={course.id} />
                      <Quiet title="Make this the wide lead card on the homepage">
                        <StarIcon size={13} aria-hidden="true" />
                        Lead
                      </Quiet>
                    </form>
                  ) : null}

                  {course.status === "published" ? (
                    <Link
                      href={`/courses/${course.slug}`}
                      title="Open the public page"
                      aria-label={`Open ${course.title} on the site`}
                      className="grid size-9 place-items-center rounded-[var(--radius-control)] border border-line-control text-ink-secondary no-underline transition-colors hover:border-accent hover:text-accent"
                    >
                      <ArrowSquareOutIcon size={14} aria-hidden="true" />
                    </Link>
                  ) : null}

                  {/* The one filled control on the row. Writing a course is what
                      this screen is for; everything else is bookkeeping around
                      it. */}
                  <Link
                    href={`/admin/courses/${course.id}`}
                    className="t-button inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-control)] bg-accent px-3.5 text-on-accent no-underline transition-colors hover:bg-accent-hover"
                  >
                    Edit
                    <ArrowRightIcon size={13} weight="bold" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
