import { LessonImage } from "./lesson-image";
import { ArrowDownIcon, DownloadSimpleIcon, BookOpenIcon } from "@phosphor-icons/react/dist/ssr";
import { ButtonLink } from "@/components/ui";
import { filmmakingVisuals } from "@/lib/filmmaking-visuals";
import { filmmakingCookbook } from "@/lib/filmmaking-cookbook";

export function LessonResourceLinks({ index }: { index: number }) {
  const notes = filmmakingVisuals[String(index + 1)];
  const kit = filmmakingCookbook[index].kits[0];
  return <nav aria-label="Lesson materials" className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
    {kit ? <ButtonLink href={`/api/course-kits/${kit}`} download prefetch={false} size="md"><DownloadSimpleIcon size={17} aria-hidden="true" />Download project kit</ButtonLink> : notes && <ButtonLink href={`/api/lesson-materials/${index + 1}`} download prefetch={false} size="md"><DownloadSimpleIcon size={17} aria-hidden="true" />Download class materials</ButtonLink>}
    {notes && <a href="#class-notes" className="t-meta inline-flex min-h-11 items-center gap-2 text-accent underline underline-offset-4"><BookOpenIcon size={16} aria-hidden="true" />Visual notes</a>}
    <a href={kit ? `#kit-${kit}` : "#hands-on"} className="t-meta inline-flex min-h-11 items-center gap-2 text-accent underline underline-offset-4"><ArrowDownIcon size={16} aria-hidden="true" />{kit ? "Use the skill in Claude Code or Codex" : "Open the cookbook"}</a>
  </nav>;
}

export function FilmmakingVisualNotes({ index }: { index: number }) {
  const notes = filmmakingVisuals[String(index + 1)];
  if (!notes) return null;
  return <section id="class-notes" aria-labelledby="class-notes-heading" className="mt-9 scroll-mt-24 border-t border-line pt-7">
    <p className="t-label text-accent">Watch. Understand. Apply.</p>
    <h3 id="class-notes-heading" className="t-h3 mt-2 text-ink">A closer look at this class</h3>
    <p className="t-body-sm mt-3 max-w-[68ch] text-ink-secondary">{notes.intro}</p>
    <ol aria-label="Workflow at a glance" className="my-6 flex flex-wrap gap-2">{notes.flow.map((step, i) => <li key={step} className="t-meta flex items-center gap-2 rounded-lg border border-line bg-surface-subtle px-3 py-2"><span className="text-accent tabular-nums">{String(i + 1).padStart(2, "0")}</span>{step}</li>)}</ol>
    <div className="space-y-8">{notes.figures.map((figure, i) => <figure key={figure.title}>
      <LessonImage src={`/api/lesson-materials/${index + 1}?image=${i}`} title={figure.title} alt={figure.alt} width={figure.width} height={figure.height} />
      <figcaption className="mt-4"><h4 className="t-card-title text-ink">{figure.title}</h4><p className="t-body-sm mt-2 max-w-[68ch] text-ink-secondary">{figure.text}</p></figcaption>
    </figure>)}</div>
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4"><p className="t-meta text-ink-muted">Visuals from the original class presentation.</p><a href={`/api/lesson-materials/${index + 1}`} download className="t-meta inline-flex min-h-11 items-center gap-2 text-accent underline underline-offset-4"><DownloadSimpleIcon size={16} aria-hidden="true" />Download visuals + notes</a></div>
  </section>;
}
