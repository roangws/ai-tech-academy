import { ArrowRightIcon, ClockIcon, ListChecksIcon, TagIcon } from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import { HeroCollage } from "@/components/hero-collage";
import { ButtonLink, Container, Photo, StatusChip, TextAction } from "@/components/ui";
import { cta, hero } from "@/lib/content";

/**
 * Two columns, white, with no gradient and no background image.
 *
 * Left carries the value prop then immediately hard facts, which is the
 * Coursera pattern: the fold sells with information rather than mood. Right
 * carries the collage, which is where the free lesson now lives.
 *
 * Rebuilt from a collage hero pattern. What that changed here:
 *
 *   - The right column was one flat lesson card. It is now two overlapping
 *     photographs with the lesson card as the third tile, entering on a
 *     stagger. hero-collage.tsx has the note on what did and did not come
 *     across from the pattern, and why only that column animates.
 *   - The three facts became three stats with a glyph each. As bullet rows,
 *     "Free", "5 modules" and "14 min" all sat mid-sentence at the weight of
 *     the words either side of them, which is the one place on the page where a
 *     numeral should not have to be found.
 *   - The byline moved up under the stats. The collage runs deeper than the old
 *     card and the byline was the element paying for it, stranded at the foot of
 *     a column that no longer had a facing row to finish level with.
 *
 * Kept from the earlier review: one filled control in the fold, with the second
 * action as a text link. Every reference has a single saturated element here.
 */
const glyphs: Record<string, Icon> = {
  cost: TagIcon,
  modules: ListChecksIcon,
  open: ClockIcon,
};

export function Hero() {
  return (
    /* `overflow-hidden` because the collage's shapes are offset outside their
       own box by design, and at 390px that put 12px of decoration past the
       gutter and gave the whole document a horizontal scrollbar. Clipping them
       at the section edge is what the bleed wants anyway. */
    <section id="top" className="overflow-hidden border-b border-line bg-surface">
      <Container className="grid grid-cols-1 items-center gap-x-14 gap-y-12 pt-10 pb-12 lg:grid-cols-[minmax(0,600px)_minmax(0,496px)] lg:justify-between lg:pt-14 lg:pb-16">
        <div className="max-w-[600px]">
          <StatusChip open>{hero.eyebrow}</StatusChip>

          <h1 className="t-display mt-4 text-ink">{hero.headline}</h1>

          <p className="t-body mt-4 max-w-[520px] text-ink-secondary">{hero.subtext}</p>

          {/*
            A three-column grid rather than a wrapping flex row. Flex put "14
            min" alone on a second line at every width between the two-column
            break and about 1180px, which reads as a dropped item rather than as
            a third stat. Fixed cells also let the labels wrap to two lines
            without the values losing their shared baseline.

            The plate is tinted rather than filled: the accent lock keeps
            saturation for the control 32px below this row.
          */}
          <ul className="mt-7 grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-3">
            {hero.stats.map((stat) => {
              const Glyph = glyphs[stat.id];
              return (
                <li key={stat.id} className="flex items-center gap-3">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-surface-subtle text-ink">
                    {Glyph ? <Glyph size={19} weight="regular" aria-hidden="true" /> : null}
                  </span>
                  <span>
                    <span className="t-h3 block text-ink">{stat.value}</span>
                    <span className="t-meta block text-ink-muted">{stat.label}</span>
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-1">
            <ButtonLink href="#paths">{cta.primary}</ButtonLink>
            <TextAction href="#course">
              {cta.course}
              <ArrowRightIcon size={14} weight="bold" />
            </TextAction>
          </div>

          <div className="mt-8 flex items-center gap-2.5 border-t border-line pt-4">
            <span className="h-9 w-9 flex-none overflow-hidden rounded-full bg-surface-sunken">
              <Photo image={hero.instructor.image} width={96} height={96} sizes="36px" />
            </span>
            <p className="t-meta text-ink-muted">
              Taught by{" "}
              <span className="font-semibold text-ink-secondary">{hero.instructor.name}</span>
              <span className="px-1.5 text-line-strong">&middot;</span>
              {hero.instructor.role}
            </p>
          </div>
        </div>

        <HeroCollage />
      </Container>
    </section>
  );
}
