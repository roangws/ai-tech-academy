import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpIcon, ArrowDownIcon, TrashIcon } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { byId } from "@/lib/lms/queries";
import { saveBlock, deleteBlock, moveBlock } from "@/app/actions/admin";
import type { LessonBlock } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Lesson", robots: { index: false, follow: false } };

/**
 * What one lesson is made of.
 *
 * ------------------------------------------------------------------ the model
 *
 * A lesson is an ordered list of typed blocks. Order is what the author sets;
 * identity is the `key`, which is why editing a block keeps its id and anything
 * pointing at it — a learner's playback position, their exercise answer —
 * survives the edit. Renaming a key creates a new block; that is the same rule
 * `lessons.slug` follows one table up, for the same reason.
 *
 * ------------------------------------------------------- typed and untyped fields
 *
 * Video, audio and doc get real inputs because they are what gets authored
 * daily. The structured kinds take JSON, and that is a stated limitation rather
 * than an oversight: a form that builds a nested array of quiz questions with
 * per-choice inputs is a real piece of software, and the CHECK constraint on
 * `payload` already refuses a malformed one with a message naming the field.
 * Worth building the day somebody is writing quizzes every morning.
 *
 * Paths, not URLs. `audio/<courseId>/<file>.mp3` — push the file with
 * `npm run media:push` and paste the path it prints.
 */

const KINDS = [
  "prose",
  "video",
  "audio",
  "doc",
  "quiz",
  "embed",
  "exercise",
  "checklist",
] as const;

const EXAMPLES: Record<string, string> = {
  prose: '{"md":"## A heading\\n\\nA paragraph.\\n\\n- a point\\n- another"}',
  quiz: '{"questions":[{"id":"q1","q":"The question?","choices":["a","b"],"answer":"b","why":"Because."}]}',
  embed: '{"src":"https://www.figma.com/…","height":520}',
  exercise: '{"prompt":"Paste your process below…","placeholder":"What came back"}',
  checklist: '{"steps":[{"id":"s1","text":"First thing"},{"id":"s2","text":"Second thing"}]}',
};

const field =
  "t-body mt-1.5 h-11 w-full rounded-[var(--radius-control)] border border-line-control bg-surface px-3 text-ink transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25";

export default async function AdminLesson({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const course = byId.get(courseId);
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

      <h1 className="t-h2 mt-2 text-ink">{lesson.name}</h1>
      <p className="t-meta mt-1 text-ink-muted">
        {lesson.modules.name} · <code>{lesson.slug}</code>
      </p>

      {/* ------------------------------------------------------ current blocks */}
      <ol className="mt-6 flex flex-col gap-3">
        {list.map((block, i) => (
          <li
            key={block.id}
            className="rounded-[var(--radius-card)] border border-line bg-surface p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="t-label text-ink-muted">
                  {block.kind} · <code>{block.key}</code>
                </p>
                {block.title ? <p className="t-body-sm text-ink">{block.title}</p> : null}
                <pre className="t-meta mt-1.5 max-w-full overflow-x-auto whitespace-pre-wrap break-all text-ink-muted">
                  {JSON.stringify(block.payload)}
                </pre>
              </div>

              <div className="flex flex-none items-center gap-1">
                {[
                  { dir: "up", Icon: ArrowUpIcon, label: "Move up", disabled: i === 0 },
                  {
                    dir: "down",
                    Icon: ArrowDownIcon,
                    label: "Move down",
                    disabled: i === list.length - 1,
                  },
                ].map(({ dir, Icon, label, disabled }) => (
                  <form key={dir} action={moveBlock}>
                    <input type="hidden" name="blockId" value={block.id} />
                    <input type="hidden" name="direction" value={dir} />
                    <button
                      type="submit"
                      disabled={disabled}
                      aria-label={`${label}: ${block.key}`}
                      className="grid size-9 place-items-center rounded-[var(--radius-control)] border border-line-control text-ink-secondary transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
                    >
                      <Icon size={14} aria-hidden="true" />
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
                    className="grid size-9 place-items-center rounded-[var(--radius-control)] border border-line-control text-ink-secondary transition-colors hover:border-danger hover:text-danger"
                  >
                    <TrashIcon size={14} aria-hidden="true" />
                  </button>
                </form>
              </div>
            </div>
          </li>
        ))}
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
          Add or replace a block
        </h2>
        <p className="t-body-sm mt-1 max-w-[64ch] text-ink-secondary">
          Saving an existing key edits that block in place, so learner answers and playback
          positions attached to it survive. Media takes a path rather than a URL: push the file
          with{" "}
          <code className="t-meta">npm run media:push</code> and paste what it prints.
        </p>

        <form action={saveBlock} className="mt-4 grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="lessonId" value={lessonId} />
          <input type="hidden" name="position" value={nextPosition} />

          <label>
            <span className="t-field block text-ink-secondary">Key</span>
            <input name="key" required placeholder="intro-video" className={field} />
          </label>

          <label>
            <span className="t-field block text-ink-secondary">Kind</span>
            <select name="kind" defaultValue="prose" className={field}>
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>

          <label className="sm:col-span-2">
            <span className="t-field block text-ink-secondary">Title (optional)</span>
            <input name="title" className={field} />
          </label>

          <label>
            <span className="t-field block text-ink-secondary">
              YouTube id <span className="text-ink-muted">video only</span>
            </span>
            <input name="youtube_id" placeholder="dQw4w9WgXcQ" className={field} />
          </label>

          <label>
            <span className="t-field block text-ink-secondary">
              Storage path <span className="text-ink-muted">audio and doc</span>
            </span>
            <input name="path" placeholder="audio/gtm/01-episode.mp3" className={field} />
          </label>

          <label className="sm:col-span-2">
            <span className="t-field block text-ink-secondary">
              Payload JSON <span className="text-ink-muted">every other kind</span>
            </span>
            <textarea
              name="payload"
              rows={5}
              defaultValue="{}"
              className="t-body mt-1.5 w-full rounded-[var(--radius-card)] border border-line-control bg-surface p-3.5 font-mono text-ink transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
            />
            <span className="t-meta mt-1.5 block text-ink-muted">
              {Object.entries(EXAMPLES).map(([k, v]) => (
                <span key={k} className="block truncate">
                  <strong className="font-medium">{k}</strong> {v}
                </span>
              ))}
            </span>
          </label>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="t-button h-11 rounded-[var(--radius-control)] bg-accent px-5 text-on-accent transition-colors hover:bg-accent-hover"
            >
              Save block
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
