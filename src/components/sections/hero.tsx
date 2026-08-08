import { ArrowRightIcon, ClockIcon, ListChecksIcon, TagIcon } from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import { HeroCollage } from "@/components/hero-collage";
import { Container, EnrollButton, Photo, StatusChip, TextAction } from "@/components/ui";
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

          {/*
            `balance`, not the base rule's `pretty`.

            The new headline is 55 characters, which at 44px in a 600px column is
            three lines however it breaks, and `pretty` only guarantees that the
            last line is not a single short word — it took "Practical AI training
            that / ends with a deployed / workflow", a 25/22/8 split with one word
            alone on the third line. `balance` evens all three instead, which is
            what it is for and what a three-line display heading needs. It is
            scoped here rather than added to the base rule because `balance` is
            capped at a few lines by every engine that implements it, and the base
            rule covers every h2 and h3 on the page.
          */}
          <h1 className="t-display mt-4 text-ink [text-wrap:balance]">{hero.headline}</h1>

          <p className="t-body mt-4 max-w-[520px] text-ink-secondary">{hero.subtext}</p>

          {/*
            Two paragraphs used to sit here, one on a left rule stating the shape
            of the program and one under the control stating the access model.
            Both are gone at Roan's request; content.ts has the note on where
            each of their facts is carried now, and why nothing in this sequence
            has room for a paragraph that explains the sequence.
          */}

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
            <EnrollButton withDate />
            {/* `#method` since the merge: the module band and the method band
                are one section now, and this link always meant the one that
                answers "how does this work". */}
            <TextAction href="#method">
              {cta.howItWorks}
              <ArrowRightIcon size={14} weight="bold" />
            </TextAction>
          </div>

          {/*
            The byline, as a facepile, with the faces after the words.

            Three changes on 7 Aug, all Roan's, and the first two are one
            decision. The pile moved to the right of the text and grew 30%, from
            36px circles to 47px.

            Those had to happen together. At 36px on the left the pile was a
            36px-tall object leading a 36px-tall two-line paragraph, so the two
            read as one row of the same weight and the faces were decoration in
            front of a sentence. Moved after the text and set larger than the
            block they sit beside, they become the thing the sentence points at,
            which is the only reason a fold shows five faces at all. `ml-auto`
            puts them at the right edge of the 600px column rather than 12px
            after whatever length the sentence happens to be, so the pile lines
            up with the collage in the column beside it instead of floating.

            The overlap is a third of a circle, unchanged, because that is what
            makes a row of portraits read as a group rather than as a list, and
            the ring is the page ground so the overlap stays legible on white.

            And the block is a link now: five faces and a sentence naming a room
            of practitioners is the strongest invitation in the fold and it was
            the only element down here that went nowhere.
          */}
          {/*
            Stacked below sm, side by side above it.

            Five 47px circles overlapping by a third measure 187px, and at 390px
            that leaves the sentence 155px of a 358px row: "Taught by Roan Weigert
            and 4 guest instructors" broke over two lines, the roster note over
            three, and "Meet the instructors" put its arrow on a line of its own.
            At sm the same row has 397px for the text, which is 100px more than the
            longest of the three lines needs, so the split is exactly where it stops
            working rather than at a breakpoint chosen for tidiness.

            The pile stays after the text in both, so the reading order is the same
            on a phone as on a desktop: who teaches it, then their faces.
          */}
          <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4 md:mt-8">
            <div className="min-w-0">
              <p className="t-meta text-ink-muted">
                <span className="block font-semibold text-ink-secondary">
                  Taught by {hero.instructor.name} and {instructors.people.length - 1} guest
                  instructors
                </span>
                {hero.instructor.rosterNote}
              </p>

              {/* A sibling of the paragraph rather than a child of it. `TextAction`
                  carries `t-button` and a 44px tap target, and nesting it in the
                  `<p>` put both inside a 13px line box for no gain. */}
              {/* `/instructors` rather than the `#instructors` band, from 8 Aug.
                  The band is four screens down and shows the same five people;
                  the page shows them with room, and it is what "meet" promises.
                  This is the one link in the hero that leaves the page, which is
                  the trade: a reader who wanted the roster gets the roster. */}
              <TextAction href="/instructors" className="whitespace-nowrap">
                Meet the instructors
                <ArrowRightIcon size={13} weight="bold" />
              </TextAction>
            </div>

            {/* `aria-hidden`, because every one of these five portraits carries a
                real alt text and the sentence beside them already names the room.
                Announcing "Portrait of ..." five times after it is the same fact
                read twice, once usefully. */}
            {/* `sm:ml-auto`, not `ml-auto`. Stacked below sm this is a block in a
                column and `auto` on the inline-start margin would push it to the
                right edge on its own line, away from the text it belongs to. */}
            <ul aria-hidden="true" className="flex flex-none items-center sm:ml-auto">
              {instructors.people.map((person) => (
                <li key={person.id} className="-ml-3 first:ml-0">
                  <span className="block h-[47px] w-[47px] overflow-hidden rounded-full bg-surface-sunken ring-2 ring-surface">
                    {person.photo ? (
                      <Photo image={person.photo} width={128} height={128} sizes="47px" />
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <HeroCollage />
      </Container>
    </section>
  );
}
