import { Section, SectionHeader } from "@/components/ui";

export function Outcomes() {
  return <Section id="outcomes" tint ariaLabelledBy="outcomes-heading">
    <SectionHeader id="outcomes-heading" label="Adaptive learning research" heading="Learning should respond to understanding" />
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,512px)] lg:gap-12">
      <div>
        <p className="t-body max-w-[52ch] text-ink-secondary">Finishing a video is not the same as understanding it. Roan Weigert's adaptive-learning research explores how educational content can respond to what a learner understands and where they need more support.</p>
        <div className="mt-6 rounded-[var(--radius-card)] border border-line bg-surface p-5 md:p-6">
          <h3 className="t-card-title text-ink">World Models, by Roan Weigert</h3>
          <p className="t-h3 mt-3 text-ink">What does this learner need next?</p>
          <p className="t-body-sm mt-3 text-ink-secondary">A clearer explanation, another example, or an opportunity to apply the idea. The research connects learner comprehension with personalized educational content.</p>
        </div>
        <p className="t-body-sm mt-5 max-w-[58ch] text-ink-secondary"><span className="font-medium text-ink">At the academy today, </span>you follow structured lessons, practice on real projects, and save your progress. Adaptive personalization remains a research focus.</p>
      </div>
      <aside className="rounded-[var(--radius-card)] border border-line border-t-4 border-t-accent bg-surface p-6 md:p-8" aria-label="Patent application information">
        <p className="t-label text-accent">Patent application filed</p>
        <h3 className="t-h3 mt-4 text-ink">Adaptive learning systems</h3>
        <p className="t-body-sm mt-3 text-ink-secondary">Research into personalized educational content and learner comprehension, by Roan Weigert.</p>
        <dl className="mt-6 space-y-4 border-t border-line pt-5">
          <div><dt className="t-meta text-ink-muted">U.S. provisional patent application</dt><dd className="t-h3 mt-1 text-ink">63/967,917</dd></div>
          <div><dt className="t-meta text-ink-muted">Filed</dt><dd className="t-body-sm mt-1 text-ink">January 26, 2026</dd></div>
          <div><dt className="t-meta text-ink-muted">Inventor</dt><dd className="t-body-sm mt-1 text-ink">Roan Weigert</dd></div>
        </dl>
        <p className="t-meta mt-5 border-t border-line pt-4 text-ink-muted">Provisional application, not a granted patent.</p>
      </aside>
    </div>
  </Section>;
}
