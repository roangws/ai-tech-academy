"use client";

import { useState } from "react";
import { Section, SectionHeader } from "@/components/ui";
import { faqs } from "@/lib/content";

/**
 * The FAQ, on the accordion-05 pattern Roan sent, third pass.
 *
 * WHAT THE PATTERN IS, since almost none of it is obvious from a screenshot:
 *
 *   1. The question is the largest type in the block, uppercase, and it is the
 *      row. There is no card, no chevron and no icon.
 *   2. A closed question is drawn down. It is legible, but it is grey the way a
 *      watermark is grey, so a column of them reads as a list of subjects
 *      rather than as eleven competing headlines.
 *   3. Opening a row takes it to full ink. That colour change *is* the
 *      affordance, which is what buys the right to drop the chevron.
 *   4. A closed row is vertically compressed and clipped. The reference does it
 *      with `-space-y-6` flipping to `space-y-0`, which is a negative bottom
 *      margin on the trigger's content inside an `overflow-hidden` trigger, so
 *      a closed row loses its bottom padding and the leading under the
 *      baseline. Uppercase has no descenders, so nothing is cut but air.
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
export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Section id="faq" tint>
      <SectionHeader label="Questions" heading="Common questions" />

      <div className="max-w-[900px]">
        {faqs.map((f, i) => {
          const expanded = open === i;
          return (
            <div key={f.q} className="relative border-b border-line">
              <h3>
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={`faq-panel-${i}`}
                  id={`faq-button-${i}`}
                  onClick={() => setOpen(expanded ? null : i)}
                  /*
                    `overflow-hidden` is load-bearing, not tidiness. It is what
                    the compression below clips against; without it the negative
                    margin only pulls the hairline up and the type spills over
                    the row beneath.
                  */
                  className="group flex w-full cursor-pointer overflow-hidden text-left"
                >
                  <span
                    className={`flex w-full items-start py-3.5 transition-[margin] duration-200 ease-out md:py-5 ${
                      expanded ? "mb-0" : "-mb-1.5 md:-mb-2.5"
                    }`}
                  >
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
                </button>
              </h3>

              <div id={`faq-panel-${i}`} hidden={!expanded}>
                {/* Indented to the question's own left edge, not the row's, so
                    the answer hangs off the question rather than off the
                    number. */}
                <p className="t-body max-w-[640px] pb-6 pl-7 text-ink-secondary lg:pl-0">{f.a}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
