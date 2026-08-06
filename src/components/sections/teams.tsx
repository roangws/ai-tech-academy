import { ArrowRightIcon, CalendarBlankIcon } from "@phosphor-icons/react/dist/ssr";
import { ButtonLink, Section } from "@/components/ui";
import { cta, teams } from "@/lib/content";

/**
 * Learning as a team. This is the page's one dark band.
 *
 * Two problems were fixed here on 6 Aug. The image was a 21:9 crop of the same
 * clip used twice already, framed so the subject's head sat above the top edge,
 * in a section about groups that showed one person. There is no team footage to
 * crop, so the photograph is replaced by a designed panel: one shared launch
 * date with three participants on their own paths, which is what the section
 * describes. That gives the page a second real content object alongside the
 * outcome sheet.
 *
 * And the band changed ground. Twelve sections alternating between white and
 * #EEF3F7 gives a 6% luminance swing, which is too little to act as rhythm.
 * Coursera and Udemy both anchor a long page with a saturated or dark band;
 * this is ours, and it stays the only one.
 *
 * Refinements from the same review:
 *   - Columns align at the top. `items-center` left the panel 46px below the
 *     eyebrow and 56px above the button, so nothing in the row met anything.
 *   - The step rules are capped at the text width. They used to run up to 249px
 *     past the line they underlined, and at white/12 on #0d1a22 they were close
 *     to invisible on a dim panel.
 *   - "Ships" is a column header stated once, rather than a label repeated on
 *     all three rows below the AA contrast floor.
 *   - The three steps lost their numerals. They are parallel choices rather than
 *     an ordered sequence, and numbering stays with the method, where the order
 *     carries meaning.
 */
export function Teams() {
  return (
    <Section id="teams" dark>
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,470px)] lg:gap-14">
        <div>
          <p className="t-label text-white/60">{teams.label}</p>
          <h2 className="t-h2 mt-2 text-white">{teams.headline}</h2>
          <p className="t-body mt-3 max-w-[58ch] text-[#c3d2dc]">{teams.intro}</p>

          <ul className="mt-7 flex max-w-[600px] flex-col">
            {teams.steps.map((step) => (
              <li key={step.title} className="border-t border-white/18 py-3.5">
                <h3 className="t-card-title text-white">{step.title}</h3>
                <p className="t-body-sm mt-1 text-[#a9bbc7]">{step.text}</p>
              </li>
            ))}
          </ul>

          <ButtonLink href="#paths" tone="onDark" size="md" className="mt-7">
            {cta.compare}
            <ArrowRightIcon size={14} weight="bold" />
          </ButtonLink>
        </div>

        {/* Designed artifact rather than a photograph. */}
        <figure className="m-0 overflow-hidden rounded-[var(--radius-card)] border border-white/18 bg-white/[0.045]">
          <div className="border-b border-white/18 px-5 py-4">
            <p className="t-label text-white/60">{teams.panel.label}</p>
            <h3 className="t-h3 mt-1.5 text-white">{teams.panel.title}</h3>
            <span className="t-meta mt-3 inline-flex items-center gap-1.5 rounded-[6px] bg-white/10 px-2.5 py-1.5 text-white">
              <CalendarBlankIcon size={14} weight="regular" className="flex-none" />
              {teams.panel.date}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 border-b border-white/12 px-5 py-2">
            <span className="t-field text-white/60">{teams.panel.columns.who}</span>
            <span className="t-field text-white/60">{teams.panel.columns.ships}</span>
          </div>

          <ul>
            {teams.panel.seats.map((s) => (
              <li
                key={s.who}
                className="flex items-center gap-3 border-b border-white/[0.08] px-5 py-3 last:border-b-0"
              >
                <span className="min-w-0 flex-1">
                  <span className="t-card-title block truncate text-white">{s.who}</span>
                  <span className="t-meta block text-[#9db0bd]">{s.path}</span>
                </span>
                <span className="t-meta flex-none text-right text-[#c3d2dc]">{s.ships}</span>
              </li>
            ))}
          </ul>

          <figcaption className="t-micro border-t border-white/12 px-5 pb-4 pt-3 text-[#8fa3b1]">
            {teams.panel.footnote}
          </figcaption>
        </figure>
      </div>
    </Section>
  );
}
