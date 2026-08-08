import { InstructorCard, InstructorLeadCard } from "@/components/instructor-card";
import { Section, SectionHeader, TextAction } from "@/components/ui";
import { instructors } from "@/lib/content";

/**
 * The roster: one lead card, then four portraits at the size a portrait wants
 * to be.
 *
 * FIVE REAL PEOPLE, as of 7 Aug. This section spent its whole life working
 * around not having them. It ran grey monogram tiles, then text-only slots, then
 * faceless illustrations in path hues, each version an answer to the same
 * question: how do you show a roster you cannot name? The answer turned out to
 * be that you wait, and it arrived as five studio portraits from one shoot with
 * five profile links.
 *
 * What has not arrived is job titles for everyone, so a card renders every line
 * conditionally. That is deliberate and it is not a placeholder: a role line
 * under a real person's photograph is a claim about their employment. content.ts
 * has the note on what fills them.
 *
 * ============================================================================
 * REBUILT 7 AUG, because the faces were enormous. This is the arithmetic.
 * ============================================================================
 *
 * Roan's report was that the instructor images were too big and that the type
 * was landing on people's chins. Both were the same fault, and it was a fault
 * with one number in it: the width of the card.
 *
 * These portraits are 805 x 1200, and they are tight head-and-shoulders frames,
 * so the head occupies from y 40 to y 700 of the source. `object-cover` on a
 * card whose ratio is wider than 2:3 scales the source to the card's *width*,
 * which fixes the rendered head height at 0.93 x the card width regardless of
 * how tall the card is. The old bento put the four specialists two-by-two inside
 * seven of twelve columns, which is 343px each, so every specialist head
 * rendered 319px tall inside a 360px card: 89% of the card was face, the crown
 * was clipped, and the chin sat 3px above the name.
 *
 * Nothing that could be done to the *height* would have moved it. Taller rows
 * change the crop, not the scale. The card had to get narrower, and 343 came
 * from the bento, so the bento had to go.
 *
 * Four across the full twelve columns is 292px, and 292px is the number that
 * makes the rest of it fall out:
 *
 *   head          0.93 x 292 = 272px, down from 319
 *   card ratio    292 x 438 is 2:3, the source's own ratio, so `object-cover`
 *                 crops nothing at all and the framing on the page is the
 *                 framing the photographer shot
 *   chin          y 700 of 1200 lands at 58% of 438, which is 254px down
 *   text block    115px, so it starts at 323px
 *   clearance     69px of neck and shoulder between the chin and the type
 *
 * That last line is the one Roan asked for. The name is not near anybody's face
 * any more, and it did not have to move down the card to get there: the face
 * moved up out of its way by being the right size.
 *
 * THE TEXT BLOCK IS 147px: name, role over two reserved lines, affiliation, and
 * the "View profile" chip.
 *
 * The chip was cut for one build, on the theory that 36px of clearance had to be
 * bought from somewhere and the whole card could be the link instead. Both halves
 * of that were wrong. The clearance turned out to be 105px rather than the 40 the
 * estimate above predicted, because these heads sit higher in the frame than the
 * 700-of-1200 the arithmetic assumed, so nothing needed buying. And the card was
 * never the link: `before:absolute before:inset-0` resolves against the nearest
 * *positioned* ancestor, which is the bottom-anchored text block, not the article,
 * so the stretched pseudo-element was 292 x 115 and the top three quarters of
 * every card was dead. Worse than dead: `group-hover/tile` still zoomed the
 * photograph and underlined the name over that region, so the card advertised a
 * click it could not take.
 *
 * The chip is back, the cards are not links, and every affordance on them is one.
 *
 * The role reserves two lines whether it needs them or not. Without it Loc's
 * two-line title pushed his name 18px above the other three in the same row,
 * which is the fault the catalog cards fixed with `min-h` and the same fix
 * applies: four cards in a row share one internal grid or they read as four
 * different cards.
 *
 * THE LEAD CARD STOPPED BEING AN OVERLAY. He is 5/12 of nothing now; he is a
 * full-width feature with the portrait in a 292px column and the bio in the
 * space beside it. Same 292, same untouched 2:3 crop, same 272px head.
 *
 * The scrim went with the overlay, and that is the honest version of "reduce the
 * gradient": there is no type over this photograph, so there is nothing for a
 * gradient to make legible. His card was also the worst offender at the old
 * size, because 5/12 of the row is 497px and 0.93 x 497 is a 462px head.
 *
 * THE SCRIM ON THE FOUR, retuned rather than removed. It used to ramp to 66% of
 * the card, which put a wash over the whole face; every one of these five people
 * was shot on the same dark blue backdrop and the wash turned all five of them
 * grey. It is now solid under the type and fully clear by 46% up from the bottom.
 * Measured against the real frames rather than the estimate, the lowest chin of
 * the four sits at 50% up, so there are four points of margin and every pixel of
 * every face is unwashed photograph. The type still sits on 0.87 ink or better.
 *
 * THE TWO CARDS NOW LIVE IN components/instructor-card.tsx, because /instructors
 * renders the same two. Every number above is a property of the card rather than
 * of this band, so it is the card that has to carry it; this note stays here
 * because this is where the fault was found and where the reasoning was done.
 *
 * BELOW XL THE FOUR RUN ON A RAIL. Four across needs 1216px of container to give
 * each card its 292; at 1024 the same grid is 228px per card and the whole
 * calculation above inverts. So the grid is xl and up, and below it the four are
 * a full-bleed snap rail with the cards held at the same 2:3 and a 292px cap.
 * The gesture is right for the content either way: a roster is a set to browse.
 */
export function Instructors() {
  const [lead, ...specialists] = instructors.people;

  return (
    <Section id="instructors">
      <SectionHeader
        label="Instructors"
        heading={instructors.headline}
        intro={instructors.intro}
        /* The way to the roster page, and the count is derived rather than
           written for the same reason the board's is: a number typed into a
           label is a number that goes stale the day a sixth instructor signs.
           This band shows all five, so the link is not hiding anything — what
           it offers is the page where each one is a full card that a search
           result and a shared URL can land on. */
        action={
          <TextAction href="/instructors">
            {`All ${instructors.people.length} instructors`}
          </TextAction>
        }
      />

      <div className="flex flex-col gap-4">
        <InstructorLeadCard person={lead} />

        {/*
          One element, two layouts. Below xl it is a full-bleed snap rail: the
          negative margin lets a card reach the screen edge while the matching
          padding keeps a snapped card on the content column. From xl it is the
          four-column row the arithmetic at the head of this file is written
          against, and the flex, the scrolling and the bleed all switch off
          together.

          `tabIndex` and a label, because below xl this is a scroll container
          whose only focusable children are the cards themselves. Chrome puts
          such a thing in the tab order by itself, as an anonymous stop with no
          accessible name; naming it fixes that, and having it keeps the rail
          scrollable from a keyboard.
        */}
        {/*
          No `tabIndex` on the container. Chrome adds a scrollable box to the tab
          order by itself only when nothing inside it is focusable, and every card
          carries a profile link again, so the rail is already reachable and
          scrollable from a keyboard through its own contents. The explicit stop
          was there for the build where the cards had no links in them, and at xl
          it was a tab stop on an element that does not scroll.
        */}
        <ul
          aria-label="Specialist instructors"
          className="rail -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 sm:-mx-5 sm:px-5 md:-mx-6 md:px-6 xl:mx-0 xl:grid xl:grid-cols-4 xl:overflow-visible xl:px-0"
        >
          {specialists.map((person) => (
            <li
              key={person.id}
              className="flex w-[70vw] max-w-[292px] shrink-0 snap-start xl:w-auto xl:max-w-none"
            >
              <InstructorCard person={person} />
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
