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
        Every card links to that judge's own LinkedIn now, which is what Roan
        asked for on this page. They used to point at `/review-judge-board#<id>`,
        and with the open seats gone that page says exactly what the card in
        front of you already says: five cards linking to a longer copy of
        themselves.
      */}
      <CarouselRail count={board.members.length} label="The judges on the Review Judge board">
        {board.members.map((m) => (
          <li
            key={m.id}
            /* The height lives here rather than in the card, because the roster
               page wants a taller frame for the same component. */
            className="flex h-[300px] w-[82vw] max-w-[320px] shrink-0 snap-start sm:h-[340px] sm:w-[240px]"
          >
            <BoardCard member={m} sizes="(max-width: 640px) 82vw, 240px" />
          </li>
        ))}
      </CarouselRail>

      {/* No footnote. There is nothing left to disclose: every card is a real
          person with their own photograph. content.ts carries the history of
          that sentence and the condition for it coming back. */}
    </Section>
  );
}
