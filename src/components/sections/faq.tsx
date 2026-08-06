"use client";

import { useState } from "react";
import { CaretDownIcon } from "@phosphor-icons/react";
import { Section, SectionHeader } from "@/components/ui";
import { faqs } from "@/lib/content";

/**
 * Flat accordion: hairlines only, no card wrappers, left aligned. All eight
 * questions render and there is no "show more".
 *
 * Changed on 6 Aug. The whole list used to be capped at 760px inside a 1216px
 * section, so 672px of height carried a 456px empty right column. Google runs
 * its rows to the full content width and keeps only the answer narrow, which is
 * what happens here now: the row, the chevron and the hairline span the column,
 * and the answer stays at 640px for line length.
 */
export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Section id="faq" hairlineTop>
      <SectionHeader label="Questions" heading="Common questions" />

      <div className="max-w-[880px]">
        {faqs.map((f, i) => {
          const expanded = open === i;
          return (
            <div key={f.q} className="border-b border-line">
              <h3>
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={`faq-panel-${i}`}
                  id={`faq-button-${i}`}
                  onClick={() => setOpen(expanded ? null : i)}
                  className="flex min-h-[76px] w-full items-center justify-between gap-6 py-[26px] text-left transition-colors hover:bg-surface-subtle"
                >
                  <span className="t-card-title text-ink">{f.q}</span>
                  <CaretDownIcon
                    size={20}
                    className="flex-none text-ink-muted transition-transform duration-150"
                    style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </button>
              </h3>
              <div
                id={`faq-panel-${i}`}
                role="region"
                aria-labelledby={`faq-button-${i}`}
                hidden={!expanded}
              >
                <p className="t-body -mt-2 max-w-[640px] pb-6 text-ink-secondary">{f.a}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
