import { BoardCard } from "@/components/board-card";
import { CarouselRail } from "@/components/carousel-rail";
import { Section, SectionHeader, TextAction } from "@/components/ui";
import { board, courses } from "@/lib/content";

/**
 * The review judge board, as a controlled carousel of portrait cards.
 *
 * The card design is unchanged and it is the good part: at 240 x 340 the face
 * is the card, the name and the role sit on the frame under a scrim, and the
 * seat's definition arrives on the hue of the path that seat reads. That came
 * from the reference capture and it stays. The card markup itself now lives in
 * board-card.tsx, shared with the full roster at /review-judge-board.
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
 *   - Six cards is a set a reader finishes. An indicator that says "3 / 6" is
 *     information; a track that never ends withholds it.
 *
 * So it is a scroll-snap rail now, with arrows and a position indicator, and
 * the cards are 82vw on a phone so the next one peeks. carousel-rail.tsx has
 * the note on why the edges come out clean without masks.
 *
 * The `checks` line is revealed on hover from sm up and simply shown below it.
 * A phone fires no hover, and on a card that is 82% of the screen there is room
 * for the one sentence that says what the seat is for.
 */
const courseTitles = new Map(courses.map((c) => [c.badge, c.title]));

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
        Each card links to its own judge on the list page rather than to the
        top of it. Six cards pointing at one URL is one link repeated six times;
        a reader who clicked a specific face wants that face, and `scroll-mt-24`
        on the card clears the sticky header when they land.
      */}
      <CarouselRail count={board.members.length} label="The judges on the Review Judge board">
        {board.members.map((m) => (
          <li
            key={m.id}
            className="flex w-[82vw] max-w-[320px] shrink-0 snap-start sm:w-[240px]"
          >
            <BoardCard
              member={m}
              courseTitle={courseTitles.get(m.reviews) ?? m.reviews}
              href={`/review-judge-board#${m.id}`}
            />
          </li>
        ))}
      </CarouselRail>

      {/* No footnote. It went on 7 Aug at Roan's request, and content.ts carries
          the note on what it was disclosing and the condition under which that
          disclosure has to come back in words. */}
    </Section>
  );
}
