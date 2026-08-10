"use client";

import { AccordionItem, useDisclosureSet } from "@/components/ui/accordion";
import { Section, SectionHeader } from "@/components/ui";
import { faqs } from "@/lib/content";

/**
 * The FAQ, on the accordion-05 pattern Roan sent, third pass.
 *
 * WHAT THE PATTERN IS, since almost none of it is obvious from a screenshot:
 *
 *   1. The question is the largest type in the block and it is the row. There
 *      is no card, no chevron and no icon. The reference sets it uppercase;
 *      this one does not, from 7 Aug. See globals.css at `t-question` for why
 *      that also removed the row compression.
 *   2. A closed question is drawn down. It is legible, but it is grey the way a
 *      watermark is grey, so a column of them reads as a list of subjects
 *      rather than as eleven competing headlines.
 *   3. Opening a row takes it to full ink. That colour change *is* the
 *      affordance, which is what buys the right to drop the chevron.
 *   4. A closed row is vertically compressed and clipped. The reference does it
 *      with `-space-y-6` flipping to `space-y-0`, which is a negative bottom
 *      margin on the trigger's content inside an `overflow-hidden` trigger, so
 *      a closed row loses its bottom padding and the leading under the
 *      baseline. Uppercase has no descenders, so nothing is cut but air. This
 *      one is sentence case now and therefore does not do it; the rows are
 *      packed with padding instead.
 *
 * ------------------------------------------------- what changed on this pass
 *
 * THE GROUND IS TINTED. Roan's note was that the block felt "a little bit
 * outside" the big titles, and on white it did: eleven oversized headlines on
 * the same surface as the rest of the page had nothing holding them, so they
 * read as loose type rather than as a section. `--surface-subtle` gives the
 * index a plate to sit on, and it is the same device the catalog and the board
 * already use. The rhythm still holds, since the two bands either side of this
 * one are white.
 *
 * THE QUESTIONS ARE ALIGNED TO THE PAGE, not to their own numbers. They started
 * 36px right of every other left edge in the document, because the number was
 * taking a column in the flow and the 12px grey numeral is far too light to act
 * as the thing the eye aligns to. From lg the number hangs in the container
 * gutter and the question sits flush with the heading above it.
 *
 * THEY ARE ALSO SMALLER. 32px against a 33px `t-h2` meant the section heading
 * did not outrank its own contents. `t-question` tops out at 26, which is a
 * real step under the heading and still nearly twice the body.
 *
 * AND THE CROP IS GENTLER. At `-mb-3.5` the caps cleared the clip edge by 2px
 * against 16px of air above them, an 8:1 asymmetry that read as a rendering
 * fault rather than as compression. Half that much crop keeps the rows packing
 * tighter than their type size allows while leaving the letters sitting on
 * something.
 *
 * WHAT DID NOT COME ACROSS. The reference runs `text-5xl` and puts the
 * accordion on a page of its own. Eleven of those would make the FAQ the
 * second-largest type block on a site whose display is 44px.
 *
 * `role="region"` came off the panels. Eleven of them made the FAQ 61% of the
 * page's entire landmark map while nine real sections carried no accessible
 * name at all, and the ARIA APG warns against region on accordion panels past
 * about six. The `id` stays for `aria-controls`.
 */
/*
  REFACTORED ONTO ui/accordion.tsx, and nothing visual moved.

  This was the site's only accordion, so its disclosure wiring was also the site's
  only copy of that wiring. The course page needed a second one, and the parts
  worth sharing are exactly the parts that go wrong when they are retyped: the
  `aria-expanded` / `aria-controls` / id triple, the heading around the button, the
  `hidden` panel, and the policy that opening one closes the others.

  Those are now `useDisclosureSet` and `AccordionItem`. Everything below that
  belongs to this pattern in particular stayed here: the dimmed 55% closed state,
  the tabular index hung into the gutter, the absence of a chevron, the 900px
  measure. The curriculum accordion shares none of it.

  `mode: "single"` preserves the behaviour this section shipped with, and `initial`
  keeps question one open on first paint.
*/
export function Faq() {
  const ids = faqs.map((_, i) => String(i));
  const { isOpen, toggle } = useDisclosureSet({ ids, mode: "single", initial: ["0"] });

  /*
    WHITE, from tinted, 7 Aug, and this is fallout from the method merge rather
    than a preference.

    The method band used to sit between the review board and this one, white
    between two tints. It merged into the module section further up the page,
    which put a tinted board directly above a tinted FAQ and broke the one
    ground rule this page has: no two tinted bands adjacent. The FAQ is the one
    that gives, because the board's tint is what breaks the white run of
    instructors and teams above it, and dropping that would trade one
    three-band run for another.

    `tint`, SET 9 AUG on Roan's instruction: "behind this block Questions / Common
    questions the background color instead of white has to be the same light blue as
    Review Judge board." That light blue is `--surface-subtle`, the same ground the
    advisory band on /review-judge-board uses, so this is one token rather than a
    new colour.

    It is available, and that is not luck. The lock is that no two tinted bands may
    touch, and this section sits between the community partners and the closing
    band, both of which are white. The full rhythm is in the page's own docblock.

    `hairlineTop` came OFF in the same change, and forgetting that is how this ends
    up with a 2px seam. A tinted band draws its own top and bottom rules, so a
    hairline on one stacks two lines into one place. It needed the hairline only
    while it was white and following a white band: the tinted board used to be its
    neighbour, then the partner band went in between them on white, and the rule the
    FAQ used to inherit from a tinted neighbour stopped being drawn. Now it draws its
    own again.

    The knock-on is one line in closing.tsx: that band follows this one and had a
    `hairlineTop` of its own, which is now the second rule at the same boundary.
  */
  return (
    <Section id="faq" tint>
      <SectionHeader label="Questions" heading="Common questions" />

      <div className="max-w-[900px]">
        {faqs.map((f, i) => {
          const expanded = isOpen(String(i));
          return (
            <AccordionItem
              key={f.q}
              id={String(i)}
              idPrefix="faq"
              open={expanded}
              onToggle={() => toggle(String(i))}
              className="relative border-b border-line"
              header={() => (
                <span className="group flex w-full items-start py-3 md:py-4">
                    {/* The index. Tabular so eleven of them share an edge, and
                        hung into the container gutter from lg so the question
                        can start where the section heading starts. */}
                    <span
                      aria-hidden="true"
                      className={`t-micro absolute left-0 w-5 flex-none pt-1 tabular-nums transition-colors duration-200 md:pt-2 lg:-left-7 ${
                        expanded ? "text-accent" : "text-ink-muted/80"
                      }`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    <span
                      className={`t-question min-w-0 flex-1 pl-7 transition-colors duration-200 sm:text-[20px] md:text-[24px] lg:pl-0 lg:text-[26px] ${
                        /*
                          55%, not the reference's 20%.

                          The dimmed closed state is the whole pattern and it is
                          also the whole risk: `--ink` at 20% on this ground is
                          about 1.3:1, which is a watermark rather than a label,
                          and these are eleven buttons. At 55% it is 3.9:1,
                          which clears AA for large text at every size this runs
                          at, including the 18px semibold on a phone.
                        */
                        expanded ? "text-ink" : "text-ink/55 group-hover:text-ink/85"
                      }`}
                    >
                      {f.q}
                    </span>
                </span>
              )}
            >
              {/* Indented to the question's own left edge, not the row's, so
                  the answer hangs off the question rather than off the
                  number. */}
              <p className="t-body max-w-[640px] pb-6 pl-7 text-ink-secondary lg:pl-0">{f.a}</p>
            </AccordionItem>
          );
        })}
      </div>
    </Section>
  );
}
