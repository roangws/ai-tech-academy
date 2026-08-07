import { ArrowRightIcon, CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { OutcomeSheet } from "@/components/outcome-sheet";
import { Section, SectionHeader } from "@/components/ui";
import { outcomes } from "@/lib/content";

/**
 * One lead row for the outcome that matters, then two fact cards for the
 * records that document it. Not three equal cards.
 *
 * Rebuilt on 6 Aug. The strongest fact on the whole page, a measured drop from
 * six hours to forty minutes, was set at 13px inside a flattened screenshot.
 * Every reference has exactly one element above its own body scale: Coursera
 * runs a 91% donut, Google sets "2 hours" at 40px. This section carries that
 * one moment, at 56px, and the sheet beneath it is real markup.
 *
 * The section intro was deleted at the same time. It said "Every path ends with
 * a working implementation and a record of its effect", which the lead paragraph
 * 300px below restated almost word for word, and cutting it puts the figure one
 * line under the heading. That is the strongest sequencing available here.
 *
 * The two supporting cards dropped their 24px icons. They were the only
 * icon-led cards among roughly twenty on the page, and the glyph outweighed the
 * 16px title beneath it. The artifact label at the card foot already classifies
 * the card.
 */
export function Outcomes() {
  return (
    <Section id="outcomes" tint ariaLabelledBy="outcomes-heading">
      <SectionHeader id="outcomes-heading" label="Outcomes" heading={outcomes.headline} />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,512px)] lg:gap-12">
        <div className="flex flex-col">
          {/*
            The classifier, above the figure rather than under it.

            This is the page's single element above 44px and it sat directly
            beneath a heading reading "Leave with evidence of what changed",
            unattributed, with its scope in 13px underneath. Read top to bottom
            that is a claim about the program followed by a footnote walking it
            back. Labelled first, the same numbers are an example, and "Example"
            is the first word a reader meets.
          */}
          <p className="t-label mb-2 text-ink-muted">{outcomes.stat.label}</p>

          {/* The page's single element above 44px. */}
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="t-stat text-ink-muted">{outcomes.stat.before}</span>
            <ArrowRightIcon
              size={26}
              weight="bold"
              className="translate-y-[-4px] flex-none text-line-strong"
              aria-label="becomes"
            />
            <span className="t-stat text-accent">{outcomes.stat.after}</span>
          </div>
          <p className="t-body-sm mt-3 max-w-[52ch] text-ink-secondary">
            {outcomes.stat.caption}
          </p>

          <div className="mt-6 border-t border-line pt-5 md:mt-8 md:pt-6">
            <p className="t-label text-ink-muted">{outcomes.lead.artifact}</p>
            <h3 className="t-h3 mt-2 text-ink">{outcomes.lead.title}</h3>
            <p className="t-body mt-3 max-w-[58ch] text-ink-secondary">{outcomes.lead.text}</p>

            <ul className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
              {outcomes.lead.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2.5">
                  <CheckIcon size={16} weight="bold" className="mt-1 flex-none text-ink" />
                  <span className="t-body-sm text-ink-secondary">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <OutcomeSheet />
      </div>

      <ul className="mt-7 grid grid-cols-1 gap-4 md:mt-10 md:grid-cols-2 md:gap-5">
        {outcomes.supporting.map((item) => (
          <li
            key={item.title}
            className="flex flex-col rounded-[var(--radius-card)] border border-line bg-surface p-5"
          >
            <h3 className="t-card-title text-ink">{item.title}</h3>
            <p className="t-body-sm mt-2 text-ink-secondary">{item.text}</p>
            <p className="t-label mt-auto border-t border-line pt-3 text-ink-muted">
              {item.artifact}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
