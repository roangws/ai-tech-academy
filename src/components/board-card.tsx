import Link from "next/link";
import { LinkedinLogoIcon } from "@phosphor-icons/react/dist/ssr";
import { Photo } from "@/components/ui";
import type { Seat } from "@/lib/content";

/**
 * One judge, as a portrait card. Shared by the homepage carousel (board.tsx)
 * and the full roster at /review-judge-board, so the card stays one definition.
 *
 * ------------------------------------------------------------- one shape now
 *
 * This used to render two things: a named judge and an open seat, the second
 * being a discipline over a stand-in portrait with a sentence about what it
 * checked. The seats are gone, so the branching is too. Every card is a person:
 * a name, their own stated role, their employer and where they are, their
 * employer's mark, and a link to their profile.
 *
 * -------------------------------------------------------- the card is a link
 *
 * The whole card links to that person's LinkedIn, on both surfaces, and the
 * badge in the corner is the visible sign of where it goes rather than a second
 * link beside it.
 *
 * The homepage previously stretched a link to `/review-judge-board#<id>` and the
 * roster page carried a small separate profile link, which was two behaviours
 * for one object and left the homepage cards pointing at a page that now says
 * exactly what the card already said. Roan asked for the profile links on the
 * homepage; making the card itself the link is the version where the accessible
 * name and the destination agree — "Liz Zhang on LinkedIn" goes to Liz Zhang on
 * LinkedIn — and where there is still only one link per card to tab through.
 *
 * It is a stretched overlay rather than a `<Link>` wrapped around the markup, so
 * the heading and the sentences stay selectable text and the accessible name is
 * the one below rather than the whole card read out as a label.
 */
export function BoardCard({
  member,
  sizes,
  id,
  className = "",
}: {
  member: Seat;
  /**
   * The `sizes` hint for the portrait, and it is a required thought rather than
   * a detail.
   *
   * Both surfaces used to share one value, `240px`, which is the homepage rail's
   * width. On the roster page the same card is drawn at 400, so every portrait
   * there was decoded from an image meant for a box 40% narrower and then
   * stretched — the softness Roan flagged. A wrong `sizes` does not fail
   * loudly; it just quietly ships a blurry photograph.
   */
  sizes: string;
  /**
   * The anchor id, and it is passed in rather than taken from `member.id`.
   *
   * The roster page is deep-linked into from elsewhere and every judge needs a
   * landing target. The homepage must not emit them: `CarouselRail` renders its
   * children a second time to make the loop, so deriving the id here would put
   * every one of them in the homepage document twice.
   */
  id?: string;
  className?: string;
}) {
  return (
    <article
      id={id}
      className={`group/card relative h-full w-full overflow-hidden rounded-[var(--radius-feature)] bg-ink-band scroll-mt-24 ${className}`}
    >
      <Photo
        image={member.photo}
        width={966}
        height={1200}
        sizes={sizes}
        className="transition-transform duration-500 group-hover/card:scale-[1.04]"
      />

      {/*
        The employer's mark, on the one part of a head-and-shoulders frame that
        is reliably empty.

        On a WHITE CHIP, at the mark's own colours. The alternative is to knock
        every logo back to flat white so it reads against the photograph, and
        that is both the thing most brand guidelines specifically prohibit and a
        gamble on contrast: a portrait is an arbitrary image, and no fixed
        foreground colour is legible over all of them. A known background makes
        the contrast a fact. It also means eBay's four colours and PG&E's blue
        and yellow arrive as themselves.

        A plain `<img>` rather than `next/image`. These are SVGs, and the image
        optimizer refuses SVG unless `dangerouslyAllowSVG` is set — a switch that
        exists because an SVG can carry script, and one worth leaving off for
        three files that are already a few kilobytes and already resolution
        independent. Vector is also the direct answer to the sharpness complaint:
        there is no size at which one of these goes soft.
      */}
      {member.logo ? (
        <span className="absolute left-3 top-3 z-10 flex h-8 items-center rounded-[6px] bg-white px-2.5 shadow-e1">
          {/*
            Bounded on BOTH axes, and sized from the SVG's own viewBox rather
            than from width and height attributes here.

            The first version pinned every mark to a fixed 14px height, which is
            right for a wordmark and wrong for a badge: NVIDIA is 5.3:1 and eBay
            is 2.5:1, but PG&E's mark is square, so at wordmark height it came
            out 14px across and read as a coloured speck. Two maxima with auto on
            both dimensions lets each mark grow until whichever axis binds first
            does, so the wide ones stay within the chip and the square one gets
            its height back.
          */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={member.logo.src}
            alt=""
            className="h-auto max-h-5 w-auto max-w-[96px] object-contain"
          />
        </span>
      ) : member.wordmark ? (
        <span className="t-micro absolute left-3 top-3 z-10 flex h-8 items-center rounded-[6px] bg-white px-2.5 font-semibold text-ink shadow-e1">
          {member.wordmark}
        </span>
      ) : null}

      {/*
        The hover face, in the card's own hue.

        ------------------------------------------------------------ the motif

        It was a 34px graph-paper grid: two hairline gradients, barely visible,
        and the same on every card. Roan asked on 9 Aug for the colour variety
        back and for the pattern itself to become a different element, pointing
        at a mid-century reference — bold rounded shapes tiled edge to edge with
        the ground showing through as four-pointed stars where they meet.

        That shape is one radial gradient. Circles on a square tile, sized so
        neighbours just touch, leave exactly that concave four-point star in the
        gap: the stars are not drawn, they are what is left. `48%` rather than
        50% keeps a hairline of ground between neighbours so the tiling reads as
        shapes rather than as a solid field, and the second, offset copy at half
        the scale puts a smaller mark inside each star, which is what stops the
        field looking like bubble wrap.

        WHITE AT ALPHA rather than the reference's second colour. Navy on orange
        is two saturated colours at full strength, and a card whose subject is a
        person cannot have a background louder than the face on it. Tinting the
        card's own hue keeps the motif clearly readable as a pattern while
        keeping the whole card one colour, which is also what makes five of these
        side by side look like a set rather than five posters.

        The strength it can carry comes from the scrim being moved on top of this
        rather than under it — see the note on that element. Without that, every
        part of this had to stay dark enough for white text, and the pattern was
        capped at a whisper.

        Opacity rather than a flip, and from sm up only: below that the face is
        simply on, so a phone is not asked to hover.
      */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover/card:opacity-100 max-sm:opacity-100"
        style={{
          backgroundColor: member.ground,
          backgroundImage:
            "radial-gradient(circle at 50% 50%, rgb(255 255 255 / 0.32) 48%, transparent 49%)," +
            "radial-gradient(circle at 50% 50%, rgb(255 255 255 / 0.19) 26%, transparent 27%)",
          backgroundSize: "76px 76px, 38px 38px",
          backgroundPosition: "0 0, 38px 38px",
        }}
      />

      {/*
        Reading scrim, and it sits ABOVE the hover face rather than below it.

        That order is the whole reason the pattern can be as strong as it is. The
        scrim was directly on the photograph, so hovering covered it and left the
        name, the role and the employer sitting on bare pattern — which caps how
        bold the pattern may be, because every part of it has to stay dark enough
        for white text. Moving it up puts one dark wash over both states: the
        photograph and the pattern each get the same guaranteed contrast at the
        bottom of the card, and the top of the card, where no text goes, is free
        to show the motif at full strength.
      */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-linear-to-t from-[rgb(13_26_34/0.94)] via-[rgb(13_26_34/0.32)] via-52% to-[rgb(13_26_34/0.05)]"
      />

      {/*
        The badge, which is deliberately NOT a link. The whole card is the link;
        a second anchor over the same destination would be one more stop for a
        keyboard reader and would say the same thing twice to a screen reader.
        `pointer-events-none` so it cannot swallow the click it is advertising.

        Its own dark disc rather than sitting bare on the photograph, because
        the top right of Liz Zhang's portrait is a pale studio backdrop and a
        white glyph over it was invisible. A known background is the only way to
        make WCAG 1.4.11 a fact rather than a hope on an arbitrary image.
      */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-2.5 top-2.5 z-20 grid size-9 place-items-center rounded-full bg-[rgb(13_26_34/0.55)] text-white backdrop-blur-[2px] transition-colors group-hover/card:bg-[rgb(10_63_224/0.92)]"
      >
        <LinkedinLogoIcon size={17} weight="fill" />
      </span>

      {/* Stretched link. `z-30` puts it over the scrim, the hover face and the
          badge, so the whole card is the hit target. The focus ring is drawn on
          the card edge rather than on the anchor, because the anchor has no
          visible box of its own. */}
      <Link
        href={member.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 z-30 rounded-[var(--radius-feature)] outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink-band"
      >
        {/* Says where it goes AND that it leaves. A whole card that silently
            opens a new tab is the kind of surprise WCAG 3.2.5 is about. */}
        <span className="sr-only">{member.name} on LinkedIn, opens in a new tab</span>
      </Link>

      <div className="absolute inset-x-0 bottom-0 z-10 p-4">
        <h3 className="t-card-title text-white">{member.name}</h3>
        {/* One line, always. The block is bottom-anchored, so a
            subtitle that wraps lifts its own title 18px clear of the
            titles either side of it: four cards, three baselines. */}
        <p className="t-meta clamp-1 mt-0.5 text-white/70">{member.role}</p>

        {/*
          ALWAYS VISIBLE. This used to open on hover on the homepage rail and
          stay open on the roster page, and Roan asked on 9 Aug for the employer
          and the location to be on the card either way.

          He is right, and the hover version was wrong for three reasons beyond
          the ask. A touch screen never fires the hover, so on a phone half the
          card's information depended on a gesture that does not exist. The rail
          advances itself every three seconds, so a card could slide out from
          under the pointer mid-reveal. And the employer is the point of the
          card — it is the line that says why this person's opinion of a
          curriculum is worth anything — so hiding it behind a gesture put the
          credential in the least reliable place on the card.
        */}
        {/*
          Two lines, not one joined by a separator.

          "The AI Collective · San Francisco Bay Area" is 42 characters and the
          rail's card is 240 wide, so it wrapped wherever it ran out of room:
          "The AI Collective · San / Francisco Bay Area" broke a place name in
          half and left the separator dangling at the end of a line. The two
          facts are different kinds of fact, so they get a line each, and the
          break happens where it means something.

          The employer is the louder of the two on purpose. It is the line that
          says why this person's reading of a curriculum is worth anything; the
          city is context.
        */}
        {member.org ? (
          <p className="t-body-sm mt-2.5 clamp-1 text-white/90">{member.org}</p>
        ) : null}
        {member.location ? (
          <p className="t-meta clamp-1 mt-0.5 text-white/60">{member.location}</p>
        ) : null}
      </div>
    </article>
  );
}
