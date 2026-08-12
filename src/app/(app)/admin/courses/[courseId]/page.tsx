import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowDownIcon,
  ArrowSquareOutIcon,
  ArrowUpIcon,
  LockSimpleIcon,
  LockOpenIcon,
  PlusIcon,
  TrashIcon,
} from "@phosphor-icons/react/dist/ssr";
import { StatusChip } from "@/components/ui";
import { ActionForm, Area, Field, Save, Quiet, Danger, Text, inputClass } from "@/components/lms/admin-form";
import { createClient } from "@/lib/supabase/server";
import { getAdminCourseById } from "@/lib/catalog";
import { getCourseInstructorIds, getRoster } from "@/lib/roster";
import { setModuleAccess } from "@/app/actions/admin";
import {
  createLesson,
  createModule,
  deleteCourse,
  deleteLesson,
  deleteModule,
  moveLesson,
  moveModule,
  saveCourse,
  saveLesson,
  saveModule,
  setCourseInstructors,
  setCourseStatus,
} from "@/app/actions/catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseId: string }>;
}): Promise<Metadata> {
  const { courseId } = await params;
  return {
    title: (await getAdminCourseById(courseId))?.title ?? "Course",
    robots: { index: false, follow: false },
  };
}

/**
 * One course, editable.
 *
 * ---------------------------------------------------------------- three parts
 *
 * The screen is a course form, a module list, and a lesson list inside each
 * module. That is the shape of the data and it is also the order somebody works
 * in: name the course, break it into modules, fill each module with lessons,
 * then open a lesson and write it.
 *
 * ------------------------------------------------------- lists as text, not widgets
 *
 * The list-shaped fields — what you will learn, requirements, the description
 * paragraphs, keywords, skills — are textareas, one item per line. Facts and
 * stats are `label | value` per line.
 *
 * That is a deliberate choice over a repeater with add and remove buttons per
 * row. Six of these on one form is six sets of controls and six ways to lose an
 * edit, and the thing an author actually does is paste four paragraphs in from a
 * document. A textarea takes that paste; a repeater makes them do it four times.
 * It is also the format that cannot be malformed, which the JSON payloads on the
 * lesson block editor very much can.
 *
 * ------------------------------------------------------------- module numbers
 *
 * `n` is not editable here and is not a mistake. It is the URL segment —
 * `/learn/<course>/04` — so changing it breaks every saved link and every
 * `last_module_id` pointer that resolves through it. Reordering with the arrows
 * changes presentation order and leaves the addresses alone.
 */
export default async function AdminCourse({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const course = await getAdminCourseById(courseId);
  if (!course) notFound();

  /* The console needs row ids, which the catalogue reader does not carry — it
     returns the shape the public site renders. One query rather than threading
     ids through a type five components share. */
  const supabase = await createClient();
  const { data: moduleRows } = await supabase
    .from("modules")
    .select("id, n, name, summary, step, artifact, access, position, lessons(id, slug, name, kind, minutes, position, lesson_blocks(id, kind))")
    .eq("course_id", courseId)
    .order("position")
    .order("position", { referencedTable: "lessons" });

  const modules = moduleRows ?? [];
  const published = course.status === "published";

  /* The tick list below, and what is ticked. Drafts included on both sides: the
     console is editing the assignment rather than the public page, and a person
     whose card is still a draft is assigned to this course. Leaving them out
     would untick them, and saving would then quietly drop them. */
  const roster = (await getRoster("instructor")).sort(
    (a, b) => Number(b.lead) - Number(a.lead) || a.position - b.position,
  );
  const credited = await getCourseInstructorIds(course.id);

  return (
    <>
      <nav aria-label="Breadcrumb" className="t-meta text-ink-muted">
        <Link href="/admin/courses" className="text-ink-secondary no-underline hover:underline">
          Courses
        </Link>
        <span className="px-1.5">/</span>
        {course.badge}
      </nav>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="t-h2 min-w-0 flex-1 text-ink">{course.title}</h1>
        {published ? <StatusChip open>Published</StatusChip> : <StatusChip>Draft</StatusChip>}

        {/*
          Only a published course gets a link, and that is the honest answer
          rather than a missing feature.

          A draft is absent from the catalogue every public surface reads, which
          is exactly what makes it safe to build one on the live site — and it
          means `/courses/<slug>` and `/learn/<slug>` both 404 for it. Offering
          either would be a button that takes an author to "there is nothing at
          this address" for a course they are looking at. Previewing a draft in
          the player needs the reader to be resolved before the catalogue is,
          which is its own change.
        */}
        {published ? (
          <Link
            href={`/courses/${course.slug}`}
            className="t-meta inline-flex min-h-[36px] items-center gap-1.5 rounded-[var(--radius-control)] border border-line-control px-2.5 text-ink-secondary no-underline transition-colors hover:border-accent hover:text-accent"
          >
            View public page
            <ArrowSquareOutIcon size={13} aria-hidden="true" />
          </Link>
        ) : (
          <span className="t-meta text-ink-muted">Not on the site yet</span>
        )}

        <ActionForm action={setCourseStatus}>
          <input type="hidden" name="courseId" value={course.id} />
          <input type="hidden" name="status" value={published ? "draft" : "published"} />
          <Quiet title={published ? "Hide it from every public surface" : "Show it on the site"}>
            {published ? "Unpublish" : "Publish"}
          </Quiet>
        </ActionForm>
      </div>

      {/* ---------------------------------------------------------- course */}
      <ActionForm action={saveCourse} className="mt-6 rounded-[var(--radius-feature)] border border-line bg-surface p-5">
        <input type="hidden" name="courseId" value={course.id} />
        <p className="t-card-title text-ink">The course</p>
        <p className="t-meta mt-1 text-ink-muted">
          What a visitor reads before they enrol. The id, <code>{course.id}</code>, is fixed;
          everything else here can change.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Title">
            <Text name="title" defaultValue={course.title} />
          </Field>
          <Field label="URL slug" hint={`Public address: /courses/${course.slug}`}>
            <Text name="slug" defaultValue={course.slug} />
          </Field>
          <Field label="Badge" hint="The small label above the title on a card.">
            <Text name="badge" defaultValue={course.badge} />
          </Field>
          <Field label="Level">
            <Text name="level" defaultValue={course.level} placeholder="Intermediate" />
          </Field>
          <Field label="Duration">
            <Text name="duration" defaultValue={course.duration} placeholder="6 weeks" />
          </Field>
          <Field label="Workload hours">
            <Text name="workloadHours" type="number" defaultValue={course.workloadHours || ""} />
          </Field>

          <Field label="Summary" className="sm:col-span-2" hint="One line. It is what a card shows.">
            <Text name="summary" defaultValue={course.summary} />
          </Field>
          <Field label="Tagline" className="sm:col-span-2" hint="Two or three lines, at the top of the course page.">
            <Area name="tagline" rows={2} defaultValue={course.tagline} />
          </Field>
          <Field label="Who it is for" className="sm:col-span-2">
            <Text name="audience" defaultValue={course.audience} />
          </Field>
          <Field label="What they build" className="sm:col-span-2">
            <Text name="build" defaultValue={course.build} />
          </Field>

          <Field
            label="What you will learn"
            className="sm:col-span-2"
            hint="One per line."
          >
            <Area name="whatLearn" rows={6} defaultValue={course.whatLearn.join("\n")} />
          </Field>
          <Field label="Requirements" className="sm:col-span-2" hint="One per line.">
            <Area name="requirements" rows={4} defaultValue={course.requirements.join("\n")} />
          </Field>
          <Field
            label="Description"
            className="sm:col-span-2"
            hint="One paragraph per line. These are the long-form paragraphs on the course page."
          >
            <Area name="description" rows={6} defaultValue={course.description.join("\n")} />
          </Field>
          <Field label="Skills" hint="One per line.">
            <Area name="skills" defaultValue={course.skills.join("\n")} />
          </Field>
          <Field label="Keywords" hint="One per line. Search listings only.">
            <Area name="keywords" defaultValue={course.keywords.join("\n")} />
          </Field>
          <Field label="Facts" hint="One per line, as: label | value">
            <Area
              name="facts"
              defaultValue={course.facts.map((f) => `${f.label} | ${f.value}`).join("\n")}
            />
          </Field>
          <Field label="Stats" hint="One per line, as: value | label">
            <Area
              name="stats"
              defaultValue={course.stats.map((s) => `${s.value} | ${s.label}`).join("\n")}
            />
          </Field>

          <Field label="Cover image path" hint="A file under /public, e.g. /images/paths/gtm.jpg">
            <Text name="coverSrc" defaultValue={course.cover?.src} />
          </Field>
          <Field label="Cover alt text" hint="What the photograph shows. Never left blank.">
            <Text name="coverAlt" defaultValue={course.cover?.alt} />
          </Field>
          <Field label="Cover width" hint="The file's real pixel width. Social cards lay out against it.">
            <Text name="coverWidth" type="number" defaultValue={course.cover?.width ?? ""} />
          </Field>
          <Field label="Cover height">
            <Text name="coverHeight" type="number" defaultValue={course.cover?.height ?? ""} />
          </Field>
          <Field label="Cover focus" hint="CSS object-position, e.g. 49% 29%. Hero bands crop hard.">
            <Text name="coverFocus" defaultValue={course.cover?.focus} />
          </Field>
          <Field label="Cover caption" hint="What the frame is of, in the card.">
            <Text name="coverBuild" defaultValue={course.coverBuild} />
          </Field>
          <Field label="Path colour" hint="A CSS colour or var, e.g. var(--path-a)">
            <Text name="ground" defaultValue={course.ground} />
          </Field>

          <Field label="Search title" hint="Written for a result listing, not for the page.">
            <Text name="seoTitle" defaultValue={course.seoTitle} />
          </Field>
          <Field label="Search description" className="sm:col-span-2" hint="Cut at about 155 characters.">
            <Area name="seoDescription" rows={2} defaultValue={course.seoDescription} />
          </Field>
        </div>

        <div className="mt-4">
          <Save>Save the course</Save>
        </div>
      </ActionForm>

      {/* ----------------------------------------------------- instructors */}
      {/*
        Who is credited on the course page, above the curriculum.
        `components/course/instructors.tsx` renders exactly what is ticked here,
        in the order the names are printed below, which is the roster's order
        with the lead first.

        Tick boxes rather than a repeater with add and remove: the roster is five
        people and the question is which of them teach this course, so the whole
        answer fits on one screen and cannot be malformed.
      */}
      <ActionForm
        action={setCourseInstructors}
        className="mt-6 rounded-[var(--radius-feature)] border border-line bg-surface p-5"
      >
        <input type="hidden" name="courseId" value={course.id} />
        <p className="t-card-title text-ink">Who teaches it</p>
        <p className="t-meta mt-1 text-ink-muted">
          Their cards appear on the course page above the curriculum. A card is only shown to
          visitors once that person is published on{" "}
          <Link href="/admin/roster" className="text-ink-secondary underline">
            the roster
          </Link>
          .
        </p>

        <ul className="mt-4 flex flex-col gap-2">
          {roster.map((r) => (
            <li key={r.id}>
              <label className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  name="instructorIds"
                  value={r.id}
                  defaultChecked={credited.includes(r.id)}
                  className="mt-0.5 size-4 flex-none accent-[var(--accent)]"
                />
                <span className="min-w-0">
                  <span className="t-body-sm text-ink">{r.name}</span>
                  {r.role ? <span className="t-meta block text-ink-muted">{r.role}</span> : null}
                  {r.status === "published" ? null : (
                    <span className="t-meta block text-ink-muted">Draft, so no card is shown yet</span>
                  )}
                </span>
              </label>
            </li>
          ))}
        </ul>

        {roster.length === 0 ? (
          <p className="t-body-sm mt-3 text-ink-secondary">
            There are no instructors on the roster yet.
          </p>
        ) : null}

        <div className="mt-4">
          <Save>Save who teaches it</Save>
        </div>
      </ActionForm>

      {/* --------------------------------------------------------- modules */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="t-h3 text-ink">Modules</h2>
        <form action={createModule} className="flex items-end gap-2">
          <input type="hidden" name="courseId" value={course.id} />
          <label className="block">
            <span className="sr-only">New module name</span>
            <input name="name" placeholder="New module name" className={`${inputClass} mt-0 w-56`} />
          </label>
          <Save>
            <PlusIcon size={15} weight="bold" aria-hidden="true" />
            Add module
          </Save>
        </form>
      </div>

      <ul className="mt-4 flex flex-col gap-5">
        {modules.map((m, mi) => {
          const lessons = m.lessons ?? [];

          return (
            <li key={m.id} className="rounded-[var(--radius-feature)] border border-line bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="t-label text-ink-muted">
                  Module {m.n}
                  {m.access === "open" ? (
                    <span className="ml-2 inline-block align-middle">
                      <StatusChip open>Open, no account</StatusChip>
                    </span>
                  ) : null}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <form action={moveModule}>
                    <input type="hidden" name="courseId" value={course.id} />
                    <input type="hidden" name="moduleId" value={m.id} />
                    <input type="hidden" name="direction" value="up" />
                    {mi > 0 ? (
                      <Quiet ariaLabel={`Move module ${m.n} up`}>
                        <ArrowUpIcon size={13} aria-hidden="true" />
                      </Quiet>
                    ) : null}
                  </form>
                  <form action={moveModule}>
                    <input type="hidden" name="courseId" value={course.id} />
                    <input type="hidden" name="moduleId" value={m.id} />
                    <input type="hidden" name="direction" value="down" />
                    {mi < modules.length - 1 ? (
                      <Quiet ariaLabel={`Move module ${m.n} down`}>
                        <ArrowDownIcon size={13} aria-hidden="true" />
                      </Quiet>
                    ) : null}
                  </form>

                  <form action={setModuleAccess}>
                    <input type="hidden" name="moduleId" value={m.id} />
                    <input type="hidden" name="courseId" value={course.id} />
                    <input type="hidden" name="access" value={m.access === "open" ? "account" : "open"} />
                    <Quiet>
                      {m.access === "open" ? (
                        <>
                          <LockSimpleIcon size={13} aria-hidden="true" />
                          Require an account
                        </>
                      ) : (
                        <>
                          <LockOpenIcon size={13} aria-hidden="true" />
                          Open to everyone
                        </>
                      )}
                    </Quiet>
                  </form>

                  <ActionForm action={deleteModule}>
                    <input type="hidden" name="courseId" value={course.id} />
                    <input type="hidden" name="moduleId" value={m.id} />
                    <Danger title={`Deletes module ${m.n}, its ${lessons.length} lessons, and every learner's progress on them`}>
                      <TrashIcon size={13} aria-hidden="true" />
                      Delete module
                    </Danger>
                  </ActionForm>
                </div>
              </div>

              <ActionForm action={saveModule} className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_100px_auto] sm:items-end">
                <input type="hidden" name="moduleId" value={m.id} />
                <Field label="Name">
                  <Text name="name" defaultValue={m.name} />
                </Field>
                <Field label="What it hands in" hint="The artifact. Blank means the module asks for none.">
                  <Text name="artifact" defaultValue={m.artifact} placeholder="Baseline and brief" />
                </Field>
                <Field label="Method step" hint="1 to 5.">
                  <Text name="step" type="number" defaultValue={m.step ?? 1} />
                </Field>
                <Save />
                <Field label="Summary" className="sm:col-span-4">
                  <Area name="summary" rows={2} defaultValue={m.summary} />
                </Field>
              </ActionForm>

              {/* --------------------------------------------------- lessons */}
              <div className="mt-5 border-t border-line pt-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="t-label text-ink-muted">
                    {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}
                  </p>
                  <form action={createLesson} className="flex items-end gap-2">
                    <input type="hidden" name="moduleId" value={m.id} />
                    <label className="block">
                      <span className="sr-only">New lesson name</span>
                      <input name="name" placeholder="New lesson name" className={`${inputClass} mt-0 w-56`} />
                    </label>
                    <Quiet>
                      <PlusIcon size={13} weight="bold" aria-hidden="true" />
                      Add lesson
                    </Quiet>
                  </form>
                </div>

                <ul className="mt-3 flex flex-col gap-2">
                  {lessons.map((l, li) => {
                    const kinds = (l.lesson_blocks ?? []).map((b) => b.kind);

                    return (
                      <li key={l.id} className="rounded-[var(--radius-card)] border border-line bg-surface-subtle p-3">
                        <ActionForm action={saveLesson} className="grid gap-2 sm:grid-cols-[1fr_180px_110px_90px_auto] sm:items-end">
                          <input type="hidden" name="lessonId" value={l.id} />
                          <Field label="Name">
                            <Text name="name" defaultValue={l.name} />
                          </Field>
                          <Field label="URL slug" hint="Changing this breaks saved links.">
                            <Text name="slug" defaultValue={l.slug} />
                          </Field>
                          <Field label="Kind">
                            <select name="kind" defaultValue={l.kind} className={inputClass}>
                              <option value="lesson">lesson</option>
                              <option value="lab">lab</option>
                              <option value="template">template</option>
                            </select>
                          </Field>
                          <Field label="Minutes" hint="Media only.">
                            <Text name="minutes" type="number" defaultValue={l.minutes ?? ""} />
                          </Field>
                          <Save />
                        </ActionForm>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="t-meta flex-1 text-ink-muted">
                            {kinds.length ? kinds.join(" · ") : "not authored"}
                          </span>

                          <Link
                            href={`/admin/courses/${course.id}/${l.id}`}
                            className="t-meta inline-flex min-h-[36px] items-center gap-1.5 rounded-[var(--radius-control)] border border-line-control px-2.5 text-ink-secondary no-underline transition-colors hover:border-accent hover:text-accent"
                          >
                            Write the content
                          </Link>

                          <form action={moveLesson}>
                            <input type="hidden" name="moduleId" value={m.id} />
                            <input type="hidden" name="lessonId" value={l.id} />
                            <input type="hidden" name="direction" value="up" />
                            {li > 0 ? (
                              <Quiet ariaLabel={`Move ${l.name} up`}>
                                <ArrowUpIcon size={13} aria-hidden="true" />
                              </Quiet>
                            ) : null}
                          </form>
                          <form action={moveLesson}>
                            <input type="hidden" name="moduleId" value={m.id} />
                            <input type="hidden" name="lessonId" value={l.id} />
                            <input type="hidden" name="direction" value="down" />
                            {li < lessons.length - 1 ? (
                              <Quiet ariaLabel={`Move ${l.name} down`}>
                                <ArrowDownIcon size={13} aria-hidden="true" />
                              </Quiet>
                            ) : null}
                          </form>
                          <form action={deleteLesson}>
                            <input type="hidden" name="lessonId" value={l.id} />
                            <Danger title="Deletes the lesson, its content, and every learner's completion of it">
                              <TrashIcon size={13} aria-hidden="true" />
                            </Danger>
                          </form>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {lessons.length === 0 ? (
                  <p className="t-body-sm mt-2 text-ink-secondary">
                    This module has no lessons, so it opens to an empty page. Add one above.
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {/* ---------------------------------------------------------- delete */}
      <ActionForm
        action={deleteCourse}
        className="mt-10 rounded-[var(--radius-feature)] border border-line bg-surface-subtle p-5"
      >
        <input type="hidden" name="courseId" value={course.id} />
        <p className="t-card-title text-ink">Delete this course</p>
        <p className="t-body-sm mt-1.5 max-w-[68ch] text-ink-secondary">
          This removes the course, its {modules.length} modules, every lesson in them, and every
          learner&rsquo;s completions, artifacts, outcome sheets and judgements on this course.
          There is no undo. If what you want is to take it off the site, unpublish it instead:
          that is reversible and keeps everything.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <Field label={`Type ${course.id} to confirm`}>
            <Text name="confirm" placeholder={course.id} />
          </Field>
          <Danger title="Permanent">
            <TrashIcon size={13} aria-hidden="true" />
            Delete the course
          </Danger>
        </div>
      </ActionForm>
    </>
  );
}
