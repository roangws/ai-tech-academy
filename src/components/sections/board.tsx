import { AvatarSlot, LogoSlot } from "@/components/media-slots";
import { Section, SectionHeader } from "@/components/ui";
import { board } from "@/lib/content";

/**
 * The review board, stated by what each seat checks.
 *
 * Two changes on this pass.
 *
 * The headline dropped its numeral. It read "Six practitioners review the
 * curriculum each term" while the board is still taking seats, so the number
 * was a maintenance cost and a reader counting seven cards against it would
 * read the mismatch as an error rather than as growth.
 *
 * And the cards carry a portrait slot and an organization mark. The last build
 * ran this section text-only, on the reasoning that one imageless section is
 * what makes the page read as an institutional programme. That reasoning came
 * from the wrong failure: what was actually wrong was monogram tiles pretending
 * to be photographs. A slot that admits it is empty carries the structure
 * without the pretence, so the frames are back and marked. See media-slots.tsx.
 *
 * The hue on each card is the ground of the path that seat reads, which is the
 * same colour the path's cover carries in the catalog. Six cards that were
 * otherwise identical now sort at a glance.
 */
export function Board() {
  return (
    <Section id="board" tint>
      <SectionHeader label="Review board" heading={board.headline} intro={board.intro} />

      <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {board.members.map((m) => (
          <li key={m.id} className="flex">
            <article className="relative flex h-full w-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface p-5 pt-[21px]">
              {/* 4px of the path's own hue. The only colour on the card, and it
                  is the one fact a reader can match against the catalog. */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-1"
                style={{ background: m.ground }}
              />

              <div className="flex items-start justify-between gap-3">
                <AvatarSlot image={m.photo} ring={m.ground} size={48} />
                <LogoSlot logo={m.logo} />
              </div>

              <h3 className="t-card-title mt-3.5 text-ink">{m.seat}</h3>
              <p className="t-body-sm mt-2 text-ink-secondary">{m.checks}</p>

              <p className="t-label mt-auto flex items-center gap-2 border-t border-line pt-3 text-ink-muted">
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 flex-none rounded-full"
                  style={{ background: m.ground }}
                />
                Reviews {m.reviews}
              </p>
            </article>
          </li>
        ))}
      </ul>

      {/* Says what the empty slots are waiting for. An unexplained placeholder
          reads as an oversight; one sentence makes it a policy. */}
      <p className="t-meta mt-6 max-w-[68ch] text-ink-muted">{board.footnote}</p>
    </Section>
  );
}
