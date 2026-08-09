import { AdvisorCard } from "@/components/advisor-card";
import { FactsLine, Section, SectionHeader } from "@/components/ui";
import { advisorCount, advisors } from "@/lib/content";

/**
 * The advisory board, under the application band on both /instructors and
 * /review-judge-board.
 *
 * ------------------------------------------------------- why it is on both
 *
 * It is one board reading both kinds of application, so it is one component
 * rendered twice rather than a page of its own that both pages link to. A reader
 * deciding whether to apply is deciding whether to be assessed by these people,
 * and that question is answered where they are deciding, not one click away.
 *
 * ----------------------------------------------------- what makes it credible
 *
 * Not the headline. The two things that do any work here are the process list,
 * which says how a decision is reached and can be checked against what the
 * platform actually does, and the footnote, which says the board is one person
 * because one person has agreed. A section that answered only the first would be
 * a page describing a committee it does not have.
 *
 * ------------------------------------------------------------- the counting
 *
 * `advisorCount` is derived, and it is derived for the reason every count on
 * this site is: a numeral typed into prose is a numeral somebody has to remember
 * to edit. "1 advisor" and "6 advisors" both come out of the array.
 */
export function AdvisoryBoard() {
  return (
    <Section tint id="advisory-board" ariaLabelledBy="advisory-board-heading">
      <SectionHeader
        id="advisory-board-heading"
        label={advisors.label}
        heading={advisors.headline}
        intro={advisors.intro}
      />

      {/*
        The four steps of a decision, then the people who make it, in that
        order. The process is the part an applicant can act on; the roster is the
        part they can check. Putting the roster first would open the section with
        one card and invite the reader to count it before they know what it is
        for.
      */}
      <ol className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
        {advisors.process.map((step, i) => (
          <li key={step.title} className="border-t border-line-strong pt-4">
            {/* Decorative. The `<ol>` already announces the position, and a
                screen reader reading "1" and then "1 of 4" says it twice. */}
            <span aria-hidden="true" className="t-label text-ink-muted">
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="t-card-title mt-1.5 text-ink">{step.title}</p>
            <p className="t-body-sm mt-1.5 text-ink-secondary">{step.body}</p>
          </li>
        ))}
      </ol>

      <div className="mt-12">
        <h3 id="advisors-roster-heading" className="t-h3 text-ink">
          The advisors
        </h3>
        <FactsLine className="mt-2" items={[advisorCount, "No course, no seat", "Reads both tracks"]} />

        {/*
          Two columns from sm, which is what keeps one card from filling the
          band. The card is a row rather than a portrait tile precisely so that
          half a container is a reasonable width for it; advisor-card.tsx has the
          note.
        */}
        <ul aria-labelledby="advisors-roster-heading" className="mt-5 grid gap-4 sm:grid-cols-2">
          {advisors.members.map((advisor) => (
            <li key={advisor.id} id={advisor.id} className="scroll-mt-24">
              <AdvisorCard advisor={advisor} />
            </li>
          ))}
        </ul>

        <p className="t-meta mt-5 max-w-[720px] text-ink-muted">{advisors.footnote}</p>
      </div>
    </Section>
  );
}
