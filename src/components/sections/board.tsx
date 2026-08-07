import Image from "next/image";
import { CarouselRail } from "@/components/carousel-rail";
import { Photo, Section, SectionHeader } from "@/components/ui";
import { board, paths } from "@/lib/content";

/**
 * The review board, as a controlled carousel of portrait cards.
 *
 * The card design is unchanged and it is the good part: at 240 x 340 the face
 * is the card, the name and the role sit on the frame under a scrim, and the
 * seat's definition arrives on the hue of the path that seat reads. That came
 * from the reference capture and it stays.
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
const pathTitles = new Map(paths.map((p) => [p.badge, p.title]));

export function Board() {
  return (
    <Section id="board" tint>
      <SectionHeader label="Review board" heading={board.headline} intro={board.intro} />

      <CarouselRail count={board.members.length} label="Review board members">
        {board.members.map((m) => {
          const reads = pathTitles.get(m.reviews) ?? m.reviews;
          return (
            <li
              key={m.id}
              className="flex w-[82vw] max-w-[320px] shrink-0 snap-start sm:w-[240px]"
            >
              <article className="group/card relative h-[300px] w-full overflow-hidden rounded-[var(--radius-feature)] bg-ink-band sm:h-[340px]">
                {m.photo ? (
                  <Photo
                    image={m.photo}
                    width={720}
                    height={1020}
                    sizes="(max-width: 640px) 82vw, 240px"
                    className="transition-transform duration-500 group-hover/card:scale-[1.04]"
                  />
                ) : null}

                {/* Reading scrim. The name sits on the photograph rather than
                    under it, which is what buys the card its height back. */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-linear-to-t from-[rgb(13_26_34/0.94)] via-[rgb(13_26_34/0.28)] via-46% to-transparent"
                />

                {/* The mark, on the one part of a head-and-shoulders frame that
                    is reliably empty. Decorative: the footnote names it as a
                    placeholder, so a screen reader reading the wordmark once
                    per card would be six announcements of a fact stated better
                    in a sentence. */}
                {m.logo ? (
                  <span className="absolute left-4 top-4 z-10">
                    <Image
                      src={m.logo.src}
                      alt=""
                      width={260}
                      height={84}
                      sizes="80px"
                      className="h-[18px] w-auto opacity-85"
                    />
                  </span>
                ) : null}

                {/*
                  The hover face, in the seat's own path hue. Opacity rather
                  than a flip, and from sm up only: below that the detail is
                  simply visible, so a phone is not asked to hover.
                */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover/card:opacity-100 max-sm:opacity-100"
                  style={{
                    background: m.ground,
                    // The faint grid the reference card carries. Two white-at-6%
                    // line gradients, so it costs no asset and sits on
                    // whichever of the five hues the seat uses. At this
                    // contrast it reads as texture rather than as a table.
                    backgroundImage:
                      "linear-gradient(rgb(255 255 255 / 0.06) 1px, transparent 1px)," +
                      "linear-gradient(90deg, rgb(255 255 255 / 0.06) 1px, transparent 1px)",
                    backgroundSize: "34px 34px",
                  }}
                />

                <div className="absolute inset-x-0 bottom-0 z-10 p-4">
                  <h3 className="t-card-title text-white">{m.name ?? m.seat}</h3>
                  {/* One line, always. The block is bottom-anchored, so a
                      subtitle that wraps lifts its own title 18px clear of the
                      titles either side of it: four cards, three baselines. */}
                  <p className="t-meta clamp-1 mt-0.5 text-white/70">{reads}</p>

                  {/* Height-animated rather than mounted on hover, so the text
                      is in the document for a screen reader and for anyone
                      whose browser never fires a hover at all. */}
                  <p className="t-body-sm grid grid-rows-[0fr] text-white/0 transition-[grid-template-rows,color] duration-200 group-hover/card:mt-2.5 group-hover/card:grid-rows-[1fr] group-hover/card:text-white/90 max-sm:mt-2.5 max-sm:grid-rows-[1fr] max-sm:text-white/90">
                    <span className="overflow-hidden">{m.checks}</span>
                  </p>
                </div>
              </article>
            </li>
          );
        })}
      </CarouselRail>

      <p className="t-meta mt-5 max-w-[68ch] text-ink-muted">{board.footnote}</p>
    </Section>
  );
}
