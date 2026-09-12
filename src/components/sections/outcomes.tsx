import { Section, SectionHeader } from "@/components/ui";

export function Outcomes() {
  return <Section id="outcomes" tint ariaLabelledBy="outcomes-heading">
    <SectionHeader id="outcomes-heading" label="Our learning framework" heading="World Models, by Roan Weigert" />
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,512px)] lg:gap-12">
      <div>
        <p className="t-body max-w-[48ch] text-ink-secondary">The framework behind this academy connects structured lessons, practical projects, and your learning progress.</p>
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {[ ["Learn", "Follow a clear course, one lesson at a time."], ["Practice", "Apply each skill to your own work."], ["Progress", "Pick up where you left off and earn your certification."] ].map(([title, text]) => <li key={title} className="py-3"><h3 className="t-card-title text-ink">{title}</h3><p className="t-body-sm mt-1 text-ink-secondary">{text}</p></li>)}
        </ul>
      </div>
      <aside className="rounded-[var(--radius-card)] border border-line bg-surface p-6 md:p-8" aria-label="Patent application information">
        <p className="t-label text-ink-muted">U.S. provisional patent application</p>
        <p className="t-h2 mt-3 text-ink">63/967,917</p>
        <p className="t-body-sm mt-4 text-ink-secondary">Filed January 26, 2026 by Roan Weigert, for research into personalized educational content and learner comprehension.</p>
        <p className="t-meta mt-5 border-t border-line pt-4 text-ink-muted">Provisional application, not a granted patent. Adaptive content generation is not currently offered in this academy.</p>
      </aside>
    </div>
  </Section>;
}
