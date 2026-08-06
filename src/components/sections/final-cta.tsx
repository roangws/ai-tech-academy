import { ButtonLink, Section } from "@/components/ui";
import { cta, finalCta } from "@/lib/content";

/**
 * A quiet light band rather than a shouting full-bleed one.
 *
 * Changed on 6 Aug. The specification asked for a deliberately soft close: a
 * 20px heading in 40px of padding. It got exactly that, and the result was
 * indistinguishable from a footer utility strip, at the end of a page roughly
 * 8,000px long, with no signal that this was the decision point. The heading is
 * now 28px in 64px of padding, and it states the number a reader needs: the
 * module is open and it takes fourteen minutes.
 *
 * Still one button, and it is the only accent in the band.
 */
export function FinalCta() {
  return (
    <Section tint ariaLabel="Start the course">
      <div className="mx-auto max-w-[560px] text-center">
        <h2 className="t-h2 text-ink">{finalCta.headline}</h2>
        <p className="t-body mt-3 text-ink-secondary">{finalCta.body}</p>
        <ButtonLink href="#paths" className="mt-6">
          {cta.primary}
        </ButtonLink>
        <p className="t-meta mt-3 text-ink-muted">{finalCta.reassurance}</p>
      </div>
    </Section>
  );
}
