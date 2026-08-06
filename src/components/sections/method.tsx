import {
  ChartLineUpIcon,
  FileTextIcon,
  RocketLaunchIcon,
  TargetIcon,
  WrenchIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import { Section, SectionHeader } from "@/components/ui";
import { method } from "@/lib/content";

/**
 * Horizontal numbered timeline with a connector rule, after Google Cloud's
 * learning-path timeline.
 *
 * The nodes carry a glyph now, and the step number moved into the type as a
 * "Step N" label above the name. Five identical circles differing only by the
 * numeral inside them meant the row had one visual idea repeated five times,
 * and the numeral is the part of a step a reader needs least: nobody scanning
 * this row is looking for step four, they are looking for the step where the
 * thing goes live. Profile, build, deploy, measure and document each have an
 * obvious glyph, so the row is now legible before it is read. The number is
 * still stated on every step, in text, because the brief names this a five-step
 * method and learners refer to steps by number.
 *
 * From the earlier review, and unchanged: the step name leads at 20px and the
 * deliverable follows as labelled meta. That was the wrong way round once, with
 * the name at 11px uppercase muted and the artifact at 16px ink, so a reader
 * scanning the row saw five artifacts rather than five steps.
 *
 * Below lg the row rotates to a vertical timeline with the connector as a left
 * rule, so the sequence survives on mobile.
 */
const glyphs: Record<number, Icon> = {
  1: TargetIcon,
  2: WrenchIcon,
  3: RocketLaunchIcon,
  4: ChartLineUpIcon,
  5: FileTextIcon,
};

export function Method() {
  return (
    <Section id="method">
      <SectionHeader label={method.eyebrow} heading={method.headline} intro={method.intro} />

      <ol className="relative mt-9 grid grid-cols-1 gap-7 lg:grid-cols-5 lg:gap-6">
        {method.steps.map((step, i) => {
          const Glyph = glyphs[step.n];
          const first = step.n === 1;

          return (
            <li key={step.n} className="relative pl-14 lg:pl-0">
              {/*
                Connector segment: this node's centre to the next node's centre,
                so the track terminates at step 5 rather than running on into
                dead space. Horizontal from lg, vertical below it, absent on
                step 5.
              */}
              {i < method.steps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute -bottom-7 left-[19px] top-11 w-0.5 bg-line lg:bottom-auto lg:left-5 lg:top-[19px] lg:h-0.5 lg:w-[calc(100%+24px)]"
                />
              ) : null}

              {/* Step 1 is the free one, so it takes the section's single
                  filled element. The rest are outlined. */}
              <span
                aria-hidden="true"
                className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 max-lg:absolute max-lg:left-0 max-lg:top-0 ${
                  first
                    ? "border-accent bg-accent text-white"
                    : "border-line-strong bg-surface text-ink"
                }`}
              >
                {Glyph ? <Glyph size={19} weight="regular" /> : null}
              </span>

              <p className="t-field mt-4 text-ink-muted max-lg:mt-0">Step {step.n}</p>
              <h3 className="t-h3 mt-1 text-ink">{step.name}</h3>
              <p className="t-body-sm mt-1.5 text-ink-secondary">{step.text}</p>
              <p className="t-meta mt-3 border-t border-line pt-2.5 text-ink-muted">
                <span className="t-field block">{method.produces}</span>
                <span className="mt-0.5 block font-semibold text-ink-secondary">{step.output}</span>
              </p>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
