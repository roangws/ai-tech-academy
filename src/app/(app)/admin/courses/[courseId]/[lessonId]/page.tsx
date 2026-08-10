import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowSquareOutIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArticleIcon,
  CheckSquareIcon,
  FileTextIcon,
  FrameCornersIcon,
  HeadphonesIcon,
  PencilLineIcon,
  PlayCircleIcon,
  PlusIcon,
  QuestionIcon,
  TrashIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/server";
import { getAdminCourseById } from "@/lib/catalog";
import { ActionForm, Field, Save, Text } from "@/components/lms/admin-form";
import { BlockFields } from "@/components/lms/block-fields";
import { saveBlock, deleteBlock, moveBlock } from "@/app/actions/admin";
import type { LessonBlock } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Lesson", robots: { index: false, follow: false } };

/**
 * What one lesson is made of, and the screen where it is written.
 *
 * ------------------------------------------------------------------ the rebuild
 *
 * Roan, on the version this replaces: "I was not able to find any way to edit
 * this as a final user. That's totally broken. It's very bad… nothing is working
 * at all."
 *
 * Three things were true of that page at once, and together they made it
 * unusable rather than merely awkward:
 *
 *   1. Every structured block was a JSON textarea. Editing a quiz meant
 *      hand-balancing a nested array of quoted strings, and prose — 174 of the
 *      site's blocks — was a `{"md":"…"}` string literal with every newline
 *      typed as a backslash-n.
 *   2. Every failure threw. A mistyped key or a short YouTube id routed to the
 *      route's error boundary, which replaces the page and therefore discards
 *      everything the author had written, and which deliberately does not print
 *      the message. So the common authoring mistake looked identical to a crash
 *      and cost the work.
 *   3. Adding a block meant scrolling past everything to one form at the bottom
 *      and choosing a kind from a `<select>` before any of its fields existed.
 *
 * All three are gone. `components/lms/block-fields.tsx` gives every kind real
 * inputs and `components/lms/rich-text.tsx` gives prose a toolbar and a preview
 * that is literally the learner's renderer. `saveBlock` answers instead of
 * throwing, so a bad key is a sentence above the form with the form intact. And
 * adding a block starts from the kind — the buttons below open a form that is
 * already the right shape.
 *
 * -------------------------------------------------------- the model, unchanged
 *
 * A lesson is an ordered list of typed blocks. Order is what the author sets;
 * identity is the `key`, which is why editing a block keeps its id and anything
 * pointing at it — a learner's playback position, their exercise answer —
 * survives the edit. Renaming a key creates a new block; that is the same rule
 * `lessons.slug` follows one table up, for the same reason.
 *
 * Nothing about the storage moved. `payload` holds the same JSON it always did,
 * the CHECK constraints still validate it, and every renderer under `blocks/` is
 * untouched. What changed is who types the JSON.
 */

/** The kinds an author can add, in the order they reach for them. */
const KINDS: readonly { kind: string; label: string; blurb: string; Icon: Icon }[] = [
  { kind: "prose", label: "Text", blurb: "Headings, paragraphs, lists", Icon: ArticleIcon },
  { kind: "video", label: "Video", blurb: "A YouTube lesson", Icon: PlayCircleIcon },
  { kind: "audio", label: "Audio", blurb: "An episode from storage", Icon: HeadphonesIcon },
  { kind: "doc", label: "Document", blurb: "A PDF to download", Icon: FileTextIcon },
  { kind: "quiz", label: "Quiz", blurb: "Questions with an answer", Icon: QuestionIcon },
  { kind: "checklist", label: "Checklist", blurb: "Steps they tick off", Icon: CheckSquareIcon },
  { kind: "exercise", label: "Exercise", blurb: "A prompt they write into", Icon: PencilLineIcon },
  { kind: "embed", label: "Embed", blurb: "An external frame", Icon: FrameCornersIcon },
];

const KIND_LABEL = new Map(KINDS.map((k) => [k.kind, k.label]));
const KIND_ICON = new Map(KINDS.map((k) => [k.kind, k.Icon]));

export default async function AdminLesson({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
  /* Which kind's "add" form is open, if any. Held in the URL rather than in
     client state so this page stays a server component and the back button
     closes the form. */
  searchParams: Promise<{ add?: string }>;
}) {
  const { courseId, lessonId } = await params;
  const { add } = await searchParams;

  /* The ADMIN catalogue, which includes drafts. `byId` reads the published one,
     so writing the first lesson of a course that had not been published yet —
     which is the entire point of a draft — answered "There is nothing at this
     address". */
  const course = await getAdminCourseById(courseId);
  if (!course) notFound();

  const supabase = await createClient();
  /* The `modules!inner(...)` embed is to-one and arrives as an object; PostgREST
     infers it as an array without the generated Database generic. Same note as
     lms/queries.ts and lms/admin.ts. */
  const { data: lesson } = (await supabase
    .from("lessons")
    .select("id, name, slug, kind, modules!inner(n, name)")
    .eq("id", lessonId)
    .maybeSingle()) as unknown as {
    data: { id: string; name: string; slug: string; kind: string; modules: { n: string; name: string } } | null;
  };
  if (!lesson) notFound();

  const { data: blocks } = await supabase
    .from("lesson_blocks")
    .select("*")
    .eq("lesson_id", lessonId)
    .order("position");

  const list = (blocks ?? []) as LessonBlock[];
  const nextPosition = list.length ? Math.max(...list.map((b) => b.position)) + 1 : 0;
  const adding = add && KIND_LABEL.has(add) ? add : null;

  return (
    <>
      <nav aria-label="Breadcrumb" className="t-meta text-ink-muted">
        <Link href="/admin/courses" className="text-ink-secondary no-underline hover:underline">
          Courses
        </Link>
        <span className="px-1.5">/</span>
        <Link
          href={`/admin/courses/${courseId}`}
          className="text-ink-secondary no-underline hover:underline"
        >
          {course.badge}
        </Link>
        <span className="px-1.5">/</span>
        Module {lesson.modules.n}
      </nav>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="t-h2 text-ink">{lesson.name}</h1>
          <p className="t-meta mt-1 text-ink-muted">
            {lesson.modules.name} · <code>{lesson.slug}</code>
          </p>
        </div>

        {/* The lesson as a learner sees it. It was not reachable from here at
            all, so checking a block meant retyping its URL by hand — on the one
            screen whose whole job is changing what that page shows. */}
        <Link
          href={`/learn/${course.slug}/${lesson.modules.n}/${lesson.slug}`}
          className="t-meta inline-flex min-h-[36px] items-center gap-1.5 rounded-[var(--radius-control)] border border-line-control px-2.5 text-ink-secondary no-underline transition-colors hover:border-accent hover:text-accent"
        >
          <ArrowSquareOutIcon size={13} aria-hidden="true" />
          Open in the player
        </Link>
      </div>

      {/* ------------------------------------------------------ current blocks */}
      <ol className="mt-6 flex flex-col gap-4">
        {list.map((block, i) => {
          const Glyph = KIND_ICON.get(block.kind) ?? ArticleIcon;

          return (
            <li
              key={block.id}
              className="rounded-[var(--radius-feature)] border border-line bg-surface"
            >
              <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-2.5">
                <span className="t-label inline-flex items-center gap-1.5 text-ink-secondary">
                  <Glyph size={14} aria-hidden="true" className="text-ink-muted" />
                  {KIND_LABEL.get(block.kind) ?? block.kind}
                </span>
                <code className="t-meta text-ink-muted">{block.key}</code>
                {block.title ? (
                  <span className="t-body-sm min-w-0 flex-1 clamp-1 text-ink">{block.title}</span>
                ) : (
                  <span className="flex-1" />
                )}

                <div className="flex flex-none items-center gap-1">
                  {[
                    { dir: "up", Icon: ArrowUpIcon, label: "Move up", disabled: i === 0 },
                    {
                      dir: "down",
                      Icon: ArrowDownIcon,
                      label: "Move down",
                      disabled: i === list.length - 1,
                    },
                  ].map(({ dir, Icon: Arrow, label, disabled }) => (
                    <form key={dir} action={moveBlock}>
                      <input type="hidden" name="blockId" value={block.id} />
                      <input type="hidden" name="direction" value={dir} />
                      <button
                        type="submit"
                        disabled={disabled}
                        aria-label={`${label}: ${block.key}`}
                        className="grid size-8 place-items-center rounded-[var(--radius-control)] border border-line-control text-ink-secondary transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
                      >
                        <Arrow size={13} aria-hidden="true" />
                      </button>
                    </form>
                  ))}
                  <form action={deleteBlock}>
                    <input type="hidden" name="blockId" value={block.id} />
                    <button
                      type="submit"
                      aria-label={`Delete block ${block.key}`}
                      /* Names its blast radius. Deleting an exercise or checklist
                         cascades every learner's answers through block_responses. */
                      title={
                        block.kind === "exercise" || block.kind === "checklist"
                          ? "Deleting this also deletes every learner's answers to it"
                          : "Delete this block"
                      }
                      className="grid size-8 place-items-center rounded-[var(--radius-control)] border border-line-control text-ink-secondary transition-colors hover:border-danger hover:text-danger"
                    >
                      <TrashIcon size={13} aria-hidden="true" />
                    </button>
                  </form>
                </div>
              </div>

              {/*
                Edit in place, with the fields the kind actually has.

                `ActionForm` rather than a bare `<form>`: it renders the action's
                answer above the fields and keeps everything typed. That is the
                whole of the difference between "the key is wrong, fix it" and
                losing a page of prose to an error boundary.

                `key`, `kind` and `position` travel as hidden fields, so saving
                updates this row in place and every learner answer and playback
                position attached to it survives.
              */}
              <ActionForm action={saveBlock} className="p-4">
                <input type="hidden" name="lessonId" value={lessonId} />
                <input type="hidden" name="key" value={block.key} />
                <input type="hidden" name="kind" value={block.kind} />
                <input type="hidden" name="position" value={block.position} />
                <input type="hidden" name="title" value={block.title ?? ""} />

                <BlockFields kind={block.kind} payload={block.payload} />

                <div className="mt-3">
                  <Save>Save this block</Save>
                </div>
              </ActionForm>
            </li>
          );
        })}
      </ol>

      {list.length === 0 ? (
        <p className="t-body-sm mt-6 rounded-[var(--radius-card)] border border-dashed border-line-control bg-surface-subtle p-4 text-ink-secondary">
          No blocks yet, so this lesson renders its generated outline with a banner saying it is not
          written. Add one below and both disappear.
        </p>
      ) : null}

      {/* ------------------------------------------------------------ add one */}
      <section aria-labelledby="add-block" className="mt-8">
        <h2 id="add-block" className="t-h3 text-ink">
          Add a block
        </h2>
        <p className="t-body-sm mt-1 max-w-[64ch] text-ink-secondary">
          Pick what it is and the right fields appear. Media takes a path rather than a URL: push
          the file with <code className="t-meta">npm run media:push</code> and paste what it prints.
        </p>

        {/*
          THE KIND IS CHOSEN FIRST, and it used to be the second field of a form
          that already showed every input for every kind at once — a YouTube id,
          a storage path, a Markdown area and a JSON textarea, stacked, with at
          most two of them ever meaning anything.

          Links rather than a `<select>`, so the choice is one press and the page
          that comes back is already the right shape. `?add=` in the URL is what
          lets this stay a server component, and it means the back button closes
          the form.
        */}
        <ul className="mt-4 flex flex-wrap gap-2">
          {KINDS.map(({ kind, label, blurb, Icon: Glyph }) => (
            <li key={kind}>
              <Link
                href={adding === kind ? "?" : `?add=${kind}`}
                scroll={false}
                aria-current={adding === kind ? "true" : undefined}
                title={blurb}
                className={`t-body-sm flex min-h-[44px] items-center gap-2 rounded-[var(--radius-control)] border px-3 no-underline transition-colors ${
                  adding === kind
                    ? "border-accent bg-accent-tint text-accent"
                    : "border-line-control text-ink-secondary hover:border-accent hover:text-accent"
                }`}
              >
                <Glyph size={15} aria-hidden="true" />
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {adding ? (
          <ActionForm
            action={saveBlock}
            className="mt-4 rounded-[var(--radius-feature)] border border-line bg-surface p-4"
          >
            <input type="hidden" name="lessonId" value={lessonId} />
            <input type="hidden" name="position" value={nextPosition} />
            <input type="hidden" name="kind" value={adding} />

            <p className="t-card-title text-ink">New {KIND_LABEL.get(adding)?.toLowerCase()} block</p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field
                label="Key"
                hint="How this block is addressed. Lowercase letters, numbers and hyphens, unique within the lesson."
              >
                <Text name="key" placeholder={adding === "prose" ? "body" : `${adding}-1`} />
              </Field>
              <Field label="Title" hint="Optional. Printed above the block.">
                <Text name="title" />
              </Field>
            </div>

            <div className="mt-3">
              <BlockFields kind={adding} payload={{}} />
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Save>
                <PlusIcon size={15} weight="bold" aria-hidden="true" />
                Add this block
              </Save>
              <Link href="?" scroll={false} className="t-body-sm text-ink-secondary no-underline hover:underline">
                Cancel
              </Link>
            </div>
          </ActionForm>
        ) : null}
      </section>
    </>
  );
}
