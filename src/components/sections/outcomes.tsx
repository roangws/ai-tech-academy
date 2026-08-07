import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { OutcomeSheet } from "@/components/outcome-sheet";
import { Section, SectionHeader } from "@/components/ui";
import { outcomes } from "@/lib/content";

/**
 * One worked example, and a three-line list of what a learner walks away with.
 *
 * CONDENSED 7 AUG. This section had four blocks and three of them were
 * describing the same three artifacts at three different lengths: a "Live
 * system / Your deployed workflow" paragraph with four bullets, the outcome
 * sheet itself, and then two cards underneath headed "Your outcome sheet" and
 * "Your completion record". The second of those described, in three lines, the
 * sheet that was printed in full 200px to its left.
 *
 * Roan's note was that he does not have the rest of the evidence yet and wants
 * the quantity of information down until he does. That is the right instinct
 * for a different reason too: a section arguing "we measure things" is weakest
 * when it pads one real measurement with three restatements of what a
 * measurement is. One example and one list is a stronger claim than one example
 * and four paragraphs about the example.
 *
 * The figure keeps its place as the page's single element above 44px, and it
 * keeps its label. Unattributed, a 56px "6 h 00 becomes 40 min" under a heading
 * reading "Leave with evidence of what changed" parses as a claim about the
 * program rather than as one learner's result, which is what it is.
 */
export function Outcomes() {
  return (
    <Section id="outcomes" tint ariaLabelledBy="outcomes-heading">
      <SectionHeader id="outcomes-heading" label="Outcomes" heading={outcomes.headline} />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,512px)] lg:gap-12">
        <div className="flex flex-col">
          {/*
            The classifier, above the figure rather than under it. "Example" is
            the load-bearing word and it is first.
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

          {/*
            The three artifacts, named once each.

            A numbered or bulleted list would rank them and they are not
            ranked: you get all three or the path is not complete. Hairline
            rows with the name at card-title weight and the gloss under it is
            the same shape the method section's steps use, which is deliberate,
            since these are what those steps produce.
          */}
          <div className="mt-7 border-t border-line pt-5">
            <p className="t-label text-ink-muted">{outcomes.leaveWith.label}</p>
            <ul className="mt-3 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-3 lg:grid-cols-1 lg:gap-y-3.5">
              {outcomes.leaveWith.items.map((item) => (
                <li key={item.title} className="min-w-0">
                  <p className="t-card-title text-ink">{item.title}</p>
                  <p className="t-body-sm mt-0.5 max-w-[46ch] text-ink-secondary">{item.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <OutcomeSheet />
      </div>
    </Section>
  );
}
