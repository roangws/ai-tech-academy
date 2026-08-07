import { ArrowRightIcon, ClockIcon, ListChecksIcon, TagIcon } from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import { HeroCollage } from "@/components/hero-collage";
import { ButtonLink, Container, Photo, StatusChip, TextAction } from "@/components/ui";
import { cta, hero, instructors } from "@/lib/content";

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
 *     "Free", "5 modules" and the open-access fact all sat mid-sentence at the
 *     weight of the words either side of them, which is the one place on the
 *     page where a numeral should not have to be found.
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
      <Container className="grid grid-cols-1 items-center gap-x-14 gap-y-8 pt-7 pb-9 sm:gap-y-12 md:pt-10 md:pb-12 lg:grid-cols-[minmax(0,600px)_minmax(0,496px)] lg:justify-between lg:pt-14 lg:pb-16">
        <div className="max-w-[600px]">
          <StatusChip open>{hero.eyebrow}</StatusChip>

          <h1 className="t-display mt-4 text-ink">{hero.headline}</h1>

          <p className="t-body mt-4 max-w-[520px] text-ink-secondary">{hero.subtext}</p>

          {/*
            The shape of the program, before the offer.

            It is set on a rule rather than as a third paragraph, because it is
            a different kind of sentence from the two above it: those sell, this
            one describes. Left rule and one step down in size is the quietest
            way to mark that without adding a card, a box or an icon to a fold
            that already carries a chip, a heading, a paragraph, three stats, a
            control, a link and a facepile.
          */}
          <p className="t-body-sm mt-4 max-w-[520px] border-l-2 border-line pl-3.5 text-ink-secondary">
            {hero.structure}
          </p>

          {/*
            A three-column grid rather than a wrapping flex row. Flex put the
            third stat alone on a second line at every width between the
            two-column break and about 1180px, which reads as a dropped item
            rather than as a third stat. Fixed cells also let the labels wrap to
            two lines without the values losing their shared baseline.

            The plate is tinted rather than filled: the accent lock keeps
            saturation for the control 32px below this row.
          */}
          <ul className="mt-6 grid grid-cols-1 gap-x-5 gap-y-3.5 sm:grid-cols-3 sm:gap-y-5 md:mt-7">
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

          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-1 md:mt-8">
            <ButtonLink href="#paths">{cta.primary}</ButtonLink>
            <TextAction href="#course">
              {cta.course}
              <ArrowRightIcon size={14} weight="bold" />
            </TextAction>
          </div>

          {/* The access model, directly under the control it qualifies. It was
              stated four times on this page and never once beside the button.
              content.ts has the note. */}
          <p className="t-meta mt-3 max-w-[46ch] text-ink-muted">{hero.access}</p>

          {/*
            The byline, as a facepile.

            The rule above it is gone. It drew a boundary between the offer and
            the person making it, and it was the only hairline in the fold, so
            it also left the avatar hanging 16px below a line that ran the full
            column width while the text beside it started at the avatar. Without
            it the block sits directly under the controls on the same left edge
            as everything else in the column.

            Five circles rather than one, because the roster is five people and
            the fold was crediting one of them. They overlap by a third, which
            is what makes a row of portraits read as a group rather than as a
            list, and the ring is the page ground so the overlap stays legible
            on white.
          */}
          <div className="mt-6 flex items-center gap-3 md:mt-8">
            <ul className="flex flex-none items-center">
              {instructors.people.map((person) => (
                <li key={person.id} className="-ml-2.5 first:ml-0">
                  <span className="block h-9 w-9 overflow-hidden rounded-full bg-surface-sunken ring-2 ring-surface">
                    {person.photo ? (
                      <Photo image={person.photo} width={96} height={96} sizes="36px" />
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>

            <p className="t-meta text-ink-muted">
              <span className="block font-semibold text-ink-secondary">
                Taught by {hero.instructor.name} and {instructors.people.length - 1} guest
                instructors
              </span>
              {hero.instructor.rosterNote}
            </p>
          </div>
        </div>

        <HeroCollage />
      </Container>
    </section>
  );
}
