import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LockSimpleIcon, LockOpenIcon } from "@phosphor-icons/react/dist/ssr";
import { StatusChip } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { byId } from "@/lib/lms/queries";
import { setModuleAccess } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseId: string }>;
}): Promise<Metadata> {
  const { courseId } = await params;
  return { title: byId.get(courseId)?.title ?? "Course", robots: { index: false, follow: false } };
}

/**
 * One course: its modules, what each opens to, and which lessons are authored.
 *
 * The access toggle is the free-first-module gate, which is the promise this
 * site makes on six separate surfaces. `setModuleAccess` refuses to leave a
 * course with nothing open rather than letting it be closed by accident, and
 * says why.
 *
 * "Authored" means the lesson has at least one block. A lesson with none renders
 * the generated outline and a banner saying so, which is why the count matters
 * more than it looks: it is the number of lessons a learner would not be
 * apologised to for opening.
 */
export default async function AdminCourse({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const course = byId.get(courseId);
  if (!course) notFound();

  const supabase = await createClient();
  const { data: modules } = await supabase
    .from("modules")
    .select("id, n, name, access, position, lessons(id, slug, name, position, lesson_blocks(id, kind))")
    .eq("course_id", courseId)
    .order("position")
    .order("position", { referencedTable: "lessons" });

  return (
    <>
      <nav aria-label="Breadcrumb" className="t-meta text-ink-muted">
        <Link href="/admin/courses" className="text-ink-secondary no-underline hover:underline">
          Courses
        </Link>
        <span className="px-1.5">/</span>
        {course.badge}
      </nav>

      <h1 className="t-h2 mt-2 text-ink">{course.title}</h1>

      <ul className="mt-6 flex flex-col gap-4">
        {(modules ?? []).map((m) => {
          const lessons = m.lessons ?? [];
          const authored = lessons.filter((l) => (l.lesson_blocks ?? []).length > 0).length;

          return (
            <li
              key={m.id}
              className="rounded-[var(--radius-feature)] border border-line bg-surface p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="t-label text-ink-muted">Module {m.n}</p>
                  <p className="t-card-title text-ink">{m.name}</p>
                  <p className="t-meta mt-0.5 text-ink-muted">
                    {authored} of {lessons.length} lessons authored
                  </p>
                </div>

                <form action={setModuleAccess} className="flex items-center gap-2">
                  <input type="hidden" name="moduleId" value={m.id} />
                  <input type="hidden" name="courseId" value={courseId} />
                  <input
                    type="hidden"
                    name="access"
                    value={m.access === "open" ? "account" : "open"}
                  />
                  {m.access === "open" ? <StatusChip open>Open, no account</StatusChip> : null}
                  <button
                    type="submit"
                    className="t-meta inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-line-control px-3 text-ink-secondary transition-colors hover:border-accent hover:text-accent"
                  >
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
                  </button>
                </form>
              </div>

              <ul className="mt-3 divide-y divide-line border-t border-line">
                {lessons.map((l) => {
                  const kinds = (l.lesson_blocks ?? []).map((b) => b.kind);
                  return (
                    <li key={l.id}>
                      <Link
                        href={`/admin/courses/${courseId}/${l.id}`}
                        className="flex min-h-[44px] items-center gap-3 py-2 no-underline"
                      >
                        <span className="t-body-sm min-w-0 flex-1 text-ink">{l.name}</span>
                        <span className="t-meta text-ink-muted">
                          {kinds.length ? kinds.join(" · ") : "not authored"}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>
    </>
  );
}
