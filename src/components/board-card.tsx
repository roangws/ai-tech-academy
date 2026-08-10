import Link from "next/link";
import { LinkedinLogoIcon } from "@phosphor-icons/react/dist/ssr";
import { Photo } from "@/components/ui";
import type { Seat } from "@/lib/content";

/**
 * The hover pattern, as a mask.
 *
 * ---------------------------------------------------------------- why a mask
 *
 * The motif is two-tone: a ground and a shape colour. The ground has to be the
 * card's own hue, which lives in CSS as `var(--path-a)` and friends, and a CSS
 * variable cannot be interpolated into a `data:` URI — the browser parses the
 * URI as an opaque string long before custom properties resolve. So the SVG
 * carries no colour at all. It is a silhouette used as a `mask-image` over a
 * flat white-at-alpha layer, and the colour underneath comes from the card.
 * One static asset, five colours, no per-card image.
 *
 * ---------------------------------------------------------------- the motif
 *
 * Wavy bands in a two-column check, from the reference Roan sent on 9 Aug: each
 * column is a stack of bands with a curved top and bottom edge, and the
 * neighbouring column is the same stack shifted by half a band so the curves
 * interlock rather than line up.
 *
 * The tile is 200 x 200 holding one full column and the two half-bands of its
 * neighbour. The neighbour is drawn as two pieces, one running off the top edge
 * and one off the bottom, because the shifted band is cut by the tile boundary
 * and the halves have to meet exactly when the tile repeats.
 *
 * This replaces tiled circles, which replaced a graph-paper grid. The circles
 * were a legible pattern and still too quiet to read as a deliberate one at the
 * size a card shows.
 */
const WAVE_MASK =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E" +
  "%3Cg fill='%23fff'%3E" +
  /* Left column: one band, wavy top at y=50 and wavy bottom at y=150. */
  "%3Cpath d='M0,50 c25,-30 25,30 50,0 c25,-30 25,30 50,0 L100,150 c-25,30 -25,-30 -50,0 c-25,30 -25,-30 -50,0 Z'/%3E" +
  /* Right column, shifted half a band, so it arrives as a piece off the top... */
  "%3Cpath d='M100,-50 c25,-30 25,30 50,0 c25,-30 25,30 50,0 L200,50 c-25,30 -25,-30 -50,0 c-25,30 -25,-30 -50,0 Z'/%3E" +
  /* ...and the matching piece off the bottom. */
  "%3Cpath d='M100,150 c25,-30 25,30 50,0 c25,-30 25,30 50,0 L200,250 c-25,30 -25,-30 -50,0 c-25,30 -25,-30 -50,0 Z'/%3E" +
  "%3C/g%3E%3C/svg%3E\")";

/**
 * One judge, as a portrait card. Shared by the homepage carousel (board.tsx)
 * and the full roster at /review-judge-board, so the card stays one definition.
 *
 * ------------------------------------------------------- what a click does
 *
 * The card goes to the REVIEW JUDGE BOARD, at that judge's own anchor. The
 * LinkedIn badge, and only the badge, goes to LinkedIn.
 *
 * For one pass the whole card went to LinkedIn, which Roan corrected on 9 Aug
 * and was wrong for a reason worth keeping: a card on this site that sends you
 * off it on any click has no way back, and the profile is a fact ABOUT the judge
 * rather than the thing the site is presenting. The badge is the escape hatch,
 * clearly marked, and everything else stays here.
 *
 * The two are siblings rather than nested, with the badge on the higher layer.
 * A link inside a link is invalid and the inner one is unreachable; two
 * overlapping absolute anchors are neither, and each keeps its own accessible
 * name. On the page the card would link to, `href` is left off and the badge is
 * the only link — a card that navigates to the page it is already on is a dead
 * control that still looks live.
 */
export function BoardCard({
  member,
  sizes,
  href,
  id,
  linkTabIndex,
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
  /** Where the card goes. Omitted on the page it would point at. */
  href?: string;
  /**
   * The anchor id, and it is passed in rather than taken from `member.id`.
   *
   * The roster page is deep-linked into from elsewhere and every judge needs a
   * landing target. The homepage must not emit them: the carousel renders its
   * children a second time to make the loop, so deriving the id here would put
   * every one of them in the homepage document twice.
   */
  id?: string;
  /**
   * `-1` for the carousel's duplicate copy.
   *
   * The clone exists so the loop has something to scroll into. It must not be a
   * second set of tab stops or a second reading of the same five people, and it
   * used to be marked `inert`, which handled both — and also set
   * `pointer-events: none`, which is what broke hovering on half the rail. See
   * the note in carousel-rail.tsx. Taking the links out of the tab order here
   * is the half of `inert` that is still wanted.
   */
  linkTabIndex?: number;
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
        The hover face: the card's own hue, with the wave mask over it.

        Two elements because the mask needs its own layer. The outer one is the
        flat ground and carries the fade; the inner is white at alpha with the
        silhouette cut out of it, so what shows through is the ground.

        Opacity rather than a flip, and from sm up only: below that the face is
        simply on, so a phone is not asked to hover.
      */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover/card:opacity-100 max-sm:opacity-100"
        style={{ backgroundColor: member.ground }}
      >
        <span
          className="absolute inset-0 bg-[rgb(255_255_255/0.34)]"
          style={{
            maskImage: WAVE_MASK,
            WebkitMaskImage: WAVE_MASK,
            maskSize: "124px 124px",
            WebkitMaskSize: "124px 124px",
            maskRepeat: "repeat",
            WebkitMaskRepeat: "repeat",
          }}
        />
      </span>

      {/*
        TWO SCRIMS, and it was one, split on 9 Aug because the single one was
        shading the faces.

        Roan: "its hard to see the pic, i think there is a shade in their faces,
        correct it."

        Measured, and he is right. The one scrim ran `0.94` at the bottom to `0.34`
        at 56% to `0.05` at the top, so it was a dark wash over the ENTIRE card. On a
        3:4 head-and-shoulders frame the face sits between roughly 15% and 50% from
        the top, which is exactly the stretch where that gradient is still carrying
        15 to 30 percent black. Every portrait on the board was rendering behind a
        grey veil, on the one page whose subject is other people.

        The reason it covered the whole card was the hover state. The scrim sits ABOVE
        the hover face rather than below it, which is what lets the wave pattern be as
        bold as it is: one wash guarantees contrast over the photograph and over the
        pattern alike. But the hover state needs a taller wash than the resting state
        does, because the summary opens upward and occupies about 45% of the card,
        while at rest the text only reaches 30%. Sizing one gradient for the taller
        case is what cost the resting photograph.

        So there are two, and the second is the hover-only difference:

          1. THE BASE, clear above 48%. Strong enough at the bottom for the name, the
             role, the employer and the location, and gone by the time it reaches a
             chin.
          2. THE EXTRA, faded in with the pattern and reaching 66%, which is what
             carries the summary over the waves. It is also on permanently below `sm`,
             where the face is on permanently because a phone fires no hover.

        Both are `to-transparent` rather than to a low alpha. `to-[rgb(13_26_34/0.05)]`
        reads as nothing and is not nothing: it is a 5% black film over the brightest
        part of every photograph, and five of them on one page is what made the whole
        grid look flat.
      */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-linear-to-t from-[rgb(13_26_34/0.95)] from-0% via-[rgb(13_26_34/0.55)] via-22% to-transparent to-48%"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-linear-to-t from-[rgb(13_26_34/0.55)] from-0% via-[rgb(13_26_34/0.42)] via-34% to-transparent to-66% opacity-0 transition-opacity duration-200 group-hover/card:opacity-100 max-sm:opacity-100"
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

        A plain `<img>` rather than `next/image`. Some of these are SVGs, and the
        image optimizer refuses SVG unless `dangerouslyAllowSVG` is set — a
        switch that exists because an SVG can carry script, and one worth leaving
        off for a handful of files that are already a few kilobytes and already
        resolution independent.
      */}
      {member.logo ? (
        <span className="absolute left-3 top-3 z-10 flex h-8 items-center rounded-[6px] bg-white px-2.5 shadow-e1">
          {/*
            Bounded on BOTH axes, and sized from the file's own intrinsic ratio
            rather than from width and height attributes here.

            The first version pinned every mark to a fixed 14px height, which is
            right for a wordmark and wrong for a badge: NVIDIA is 5.3:1 and eBay
            is 2.5:1, but PG&E's mark is square, so at wordmark height it came
            out 14px across and read as a coloured speck. Two maxima with auto on
            both dimensions lets each mark grow until whichever axis binds first
            does.
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

      {/* Stretched link to this judge on the board. `z-20`, under the badge and
          over everything else, so the whole card is the hit target except the
          one corner that goes somewhere else. */}
      {href ? (
        <Link
          href={href}
          tabIndex={linkTabIndex}
          className="absolute inset-0 z-20 rounded-[var(--radius-feature)] outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink-band"
        >
          <span className="sr-only">{member.name} on the Review Judge Board</span>
        </Link>
      ) : null}

      {/*
        The profile link. `z-30`, above the stretched link, so a click on this
        corner reaches it rather than the card underneath.

        Its own dark disc rather than sitting bare on the photograph, because the
        top right of Liz Zhang's portrait is a pale studio backdrop and a white
        glyph over it was invisible. A known background is the only way to make
        WCAG 1.4.11 a fact rather than a hope on an arbitrary image.
      */}
      <Link
        href={member.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={linkTabIndex}
        aria-label={`${member.name} on LinkedIn, opens in a new tab`}
        className="absolute right-2.5 top-2.5 z-30 grid size-9 place-items-center rounded-full bg-[rgb(13_26_34/0.62)] text-white no-underline backdrop-blur-[2px] transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
      >
        <LinkedinLogoIcon size={17} weight="fill" aria-hidden="true" />
      </Link>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-4">
        <h3 className="t-card-title text-white">{member.name}</h3>
        {/* One line, always. The block is bottom-anchored, so a
            subtitle that wraps lifts its own title 18px clear of the
            titles either side of it: four cards, three baselines. */}
        <p className="t-meta clamp-1 mt-0.5 text-white/70">{member.role}</p>

        {/*
          Employer and location, always visible, two lines rather than one
          joined by a separator.

          "The AI Collective · San Francisco Bay Area" is 42 characters and the
          rail's card is 240 wide, so it wrapped wherever it ran out of room and
          broke a place name in half. The two facts are different kinds of fact,
          so they get a line each and the break happens where it means
          something. The employer is the louder of the two: it is the line that
          says why this person's reading of a curriculum is worth anything.
        */}
        {member.org ? (
          <p className="t-body-sm mt-2.5 clamp-1 text-white/90">{member.org}</p>
        ) : null}
        {member.location ? (
          <p className="t-meta clamp-1 mt-0.5 text-white/60">{member.location}</p>
        ) : null}

        {/*
          THE SEAT, when this judge holds one.

          Roan's report was that /judge showed nothing and that the seats "have to
          be here" — on this board. The console's own empty state pointed a
          seatless judge at /review-judge-board to "see the six seats", and this
          page has never printed one, so the two screens described a board that
          existed in neither of them.

          It is a chip rather than a fourth line of text because it is a different
          kind of fact from the three above it: name, title and employer are about
          the person, and this is about their job here. It also has to survive a
          240px card, so it carries the seat name and the course it reads on one
          line each rather than joined by a separator — the same break the employer
          and location pair already makes, for the same measured reason.

          Absent on an unassigned card. See `Seat.seat` in content.ts on why that
          is the correct rendering rather than a hole.
        */}
        {member.seat ? (
          <p className="mt-2.5 flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <span className="t-micro inline-flex items-center rounded-full bg-white/15 px-2 py-0.5 font-semibold text-white ring-1 ring-inset ring-white/25">
              {member.seat.name}
            </span>
            <span className="t-micro clamp-1 text-white/60">reads {member.seat.reads}</span>
          </p>
        ) : null}

        {/*
          The summary, on hover.

          Roan asked for it on 9 Aug: hovering used to change the background and
          tell you nothing new, so the gesture cost a reader their view of the
          photograph and returned a pattern. Now it returns the thing a board of
          judges exists to establish, which is what each of them actually works
          on.

          Height-animated rather than mounted on hover, so the sentence is in the
          document for a screen reader and for anyone whose browser never fires a
          hover at all — and simply open below sm, where nothing fires one.

          The block is `pointer-events-none` as a whole and the two links sit
          above it, so text growing upward under the cursor cannot steal the
          click from the card it is drawn on.
        */}
        {member.summary ? (
          <p
            className={
              "t-body-sm grid transition-[grid-template-rows,color,margin] duration-200 " +
              "grid-rows-[0fr] text-white/0 " +
              "group-hover/card:mt-2.5 group-hover/card:grid-rows-[1fr] group-hover/card:text-white/85 " +
              "max-sm:mt-2.5 max-sm:grid-rows-[1fr] max-sm:text-white/85"
            }
          >
            <span className="overflow-hidden">{member.summary}</span>
          </p>
        ) : null}
      </div>
    </article>
  );
}
