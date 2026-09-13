import { BrainIcon, BookOpenIcon, TargetIcon, CertificateIcon } from "@phosphor-icons/react/dist/ssr";
import { Section, SectionHeader } from "@/components/ui";

export function Outcomes() {
  return <Section id="outcomes" tint ariaLabelledBy="outcomes-heading">
    <SectionHeader id="outcomes-heading" label="Adaptive learning research" heading="Learning that learns what you need" />
    <p className="t-body max-w-[64ch] text-ink-secondary">We are developing an intelligent system that learns from your progress and goals, then adapts the explanations, examples, and practice to what you need next.</p>
    <div className="mt-7 grid gap-6 sm:grid-cols-3">
      {[
        { icon: TargetIcon, title: "Start with your goal", text: "Connect what you learn to the work you want to do." },
        { icon: BrainIcon, title: "Understand your progress", text: "Identify what you understand and where you need support." },
        { icon: BookOpenIcon, title: "Adapt your next lesson", text: "Choose a clearer explanation, a relevant example, or more practice." },
      ].map(({ icon: Icon, title, text }) => <div key={title} className="flex items-start gap-3">
        <Icon size={25} weight="duotone" className="mt-1 shrink-0 text-accent" aria-hidden="true" />
        <div><h3 className="t-card-title text-ink">{title}</h3><p className="t-body-sm mt-2 text-ink-secondary">{text}</p></div>
      </div>)}
    </div>
    <aside className="mt-8 flex flex-col gap-5 rounded-[var(--radius-card)] border border-line bg-surface p-5 sm:flex-row sm:items-center md:px-6" aria-label="Patent application information">
      <div className="flex shrink-0 items-center gap-3 text-accent sm:w-40 sm:flex-col sm:border-r sm:border-line sm:pr-5 sm:text-center">
        <CertificateIcon size={36} weight="duotone" aria-hidden="true" />
        <p className="text-xs font-semibold leading-relaxed">PATENT APPLICATION<br />FILED</p>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="t-card-title text-ink">Adaptive learning systems</h3>
        <p className="t-meta mt-1 text-ink-secondary">U.S. provisional application 63/967,917</p>
        <dl className="mt-3 flex flex-wrap gap-x-7 gap-y-2 t-meta">
          <div><dt className="inline text-ink-muted">Filed </dt><dd className="inline text-ink">January 26, 2026</dd></div>
          <div><dt className="inline text-ink-muted">Inventor </dt><dd className="inline text-ink">Roan Weigert</dd></div>
        </dl>
        <p className="t-meta mt-3 text-ink-muted">Provisional application, not a granted patent.</p>
      </div>
    </aside>
    <p className="t-meta mt-4 max-w-[80ch] text-ink-secondary">Personalization is in development. Today, the academy offers structured video lessons, practical projects, and saved progress.</p>
  </Section>;
}
