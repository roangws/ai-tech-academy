import { BoardCard } from "@/components/board-card";
import { CarouselRail } from "@/components/carousel-rail";
import { Section, SectionHeader, TextAction } from "@/components/ui";
import { board } from "@/lib/content";

/**
 * The review judge board, as a controlled carousel of portrait cards.
 *
 * The card design is unchanged and it is the good part: at 240 x 340 the face
 * is the card, the name and the role sit on the frame under a scrim, and the
 * rest arrives on hover. That came from the reference capture and it stays. The
 * card markup itself lives in board-card.tsx, shared with the full roster at
 * /review-judge-board.
 *
 * WHAT CHANGED IS THE TRACK. It was a marquee, on the argument that a roster
 * has no order worth paging through and that arrows imply an end to reach.
 * That argument was about the content and it lost to three facts about the
 * behaviour:
 *
 *   - A reader cannot stop it. The pause-on-hover rule came out two passes ago
 *     because the cards gained a hover state of their own and the two gestures
 *     fought, which left a moving row of faces with no way to hold one still.
 *   - It carried two fade masks to hide the clip at each edge, and at 390px a
 *     card is most of the screen, so the mask was a gradient across a face
 *     rather than across a gap. That is the hard-clipped edge Roan flagged.
 *   - A set a reader finishes deserves an indicator that says "3 / 5"; a track
 *     that never ends withholds it.
 *
 * So it is a scroll-snap rail now, with arrows and a position indicator, and
 * the cards are 82vw on a phone so the next one peeks. carousel-rail.tsx has
 * the note on why the edges come out clean without masks.
 */
/* The height lives on the list item rather than in the card, because the roster
   page wants a taller frame for the same component. Named because the rail and
   its clone must agree exactly: a pixel of difference between the two copies
   accumulates into a visible jump at the seam. */
const CARD_FRAME =
  "flex h-[300px] w-[82vw] max-w-[320px] shrink-0 snap-start sm:h-[340px] sm:w-[240px]";

export function Board() {
  return (
    <Section id="board" tint>
      <SectionHeader
        label="Review Judge board"
        heading={board.headline}
        intro={board.intro}
        /* The count is derived rather than written, which is the same reason
           the headline does not carry it: the board is still taking judges, and
           a number in prose is a number that goes stale. */
        action={
          <TextAction href="/review-judge-board">
            {`All ${board.members.length} judges`}
          </TextAction>
        }
      />

      {/*
        Cards go to the board page, at that judge's own anchor. The LinkedIn
        badge in the corner is the only thing that leaves the site.

        For one pass the whole card went to LinkedIn. Roan corrected it on 9 Aug
        and it was the right correction: a teaser on the homepage whose every
        click sends a reader off the site has no way back, and the roster page is
        where the summaries live.

        `clone` renders the same five with their links out of the tab order, for
        the loop. carousel-rail.tsx has the note on why the second copy cannot
        simply be `inert`.
      */}
      <CarouselRail
        count={board.members.length}
        label="The judges on the Review Judge board"
        clone={board.members.map((m) => (
          <li key={m.id} className={CARD_FRAME}>
            <BoardCard
              member={m}
              href={`/review-judge-board#${m.id}`}
              sizes="(max-width: 640px) 82vw, 240px"
              linkTabIndex={-1}
            />
          </li>
        ))}
      >
        {board.members.map((m) => (
          <li key={m.id} className={CARD_FRAME}>
            <BoardCard
              member={m}
              href={`/review-judge-board#${m.id}`}
              sizes="(max-width: 640px) 82vw, 240px"
            />
          </li>
        ))}
      </CarouselRail>

      {/* No footnote. There is nothing left to disclose: every card is a real
          person with their own photograph. content.ts carries the history of
          that sentence and the condition for it coming back. */}
    </Section>
  );
}
