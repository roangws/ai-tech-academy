import { LinkedinLogoIcon } from "@phosphor-icons/react/dist/ssr";
import { Photo } from "@/components/ui";
import type { Advisor } from "@/lib/content";

/**
 * One advisor: a portrait beside the four facts about them, on the dark ground.
 *
 * ------------------------------------------------- why not the judge card
 *
 * `board-card.tsx` already draws a person from a portrait, and this is
 * deliberately not it. That card is a 2:3 tile with the name laid over the
 * bottom third of the face, which is the right shape for six of them in a rail
 * and the wrong shape for a list that is currently one. A single portrait tile
 * in a 1216px band reads as a gap with a photograph in the corner of it.
 *
 * More to the point, an advisor is not a judge with a different label. A judge
 * card's job is to make six practitioners scannable; this card's job is to make
 * one person's standing legible to somebody who is deciding whether to be
 * assessed by them, so the type sits beside the face at full contrast instead of
 * over it at 70%.
 *
 * ------------------------------------------------------------ it scales to N
 *
 * The row shape holds at one card and at six. The list that renders it is a
 * two-column grid, so a lone advisor occupies half the band rather than all of
 * it, which is what stops one card from looking like a mistake.
 *
 * -------------------------------------------------------- the card is a link
 *
 * The whole card goes to their profile, with a stretched overlay rather than a
 * wrapping anchor, so the name and the role stay selectable text and the
 * accessible name is the one sentence below rather than the entire card read out
 * as a label. The badge in the corner is the visible sign of where it goes; it
 * is `aria-hidden` and `pointer-events-none`, because a second anchor over the
 * same destination is one more tab stop that says the same thing twice.
 */
export function AdvisorCard({ advisor }: { advisor: Advisor }) {
  return (
    <article className="group/advisor relative flex h-full overflow-hidden rounded-[var(--radius-feature)] bg-ink-band">
      {/*
        The portrait column, at the source's own 4:5 crop from a 1289x1600 file,
        so `object-cover` drops chest rather than chin.

        Fixed width rather than a fraction, which is the lesson written up at
        length in sections/instructors.tsx applied to a smaller box: `object-cover`
        pins the rendered head to a multiple of the frame's WIDTH, so a column
        sized as a percentage of the card renders a different-sized face at every
        breakpoint and in every grid arrangement. Fixed, the face is the same size
        in a one-card row and a two-card row.
      */}
      <div className="relative aspect-[4/5] w-[116px] flex-none self-start sm:w-[150px]">
        {/*
          Out of flow. An in-flow `<img>` carrying `h-full` inside an
          aspect-ratio box resolves that percentage against nothing, falls back
          to its own intrinsic ratio and grows the box to fit, so the 4:5 crop
          this column exists to make would never be made. Both instructor cards
          carry the same note, arrived at the same way.
        */}
        <span aria-hidden="true" className="absolute inset-0 block">
          <Photo
            image={advisor.photo}
            width={966}
            height={1200}
            sizes="(max-width: 640px) 116px, 150px"
            className="transition-transform duration-500 group-hover/advisor:scale-[1.04]"
          />
        </span>
      </div>

      {/*
        The hover face, in the advisor's own hue, over the ground and under the
        type. Opacity rather than a flip, and visible without a hover below sm,
        so a phone is not asked to do something it cannot: the same treatment the
        judge cards use, so two bands of people on one page respond to a pointer
        the same way.

        BEFORE the content in the DOM, and the content carries `relative z-10`,
        because neither of those is optional. An absolutely positioned element
        paints above a static one whatever the source order, so with this after
        the text block the wash covered the name on hover: the card said less the
        more you interacted with it. Source order alone does not fix it either,
        which is why the text block is positioned as well.
      */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-[116px] right-0 opacity-0 transition-opacity duration-200 group-hover/advisor:opacity-100 max-sm:opacity-100 sm:left-[150px]"
        style={{
          background: advisor.ground,
          backgroundImage:
            "linear-gradient(rgb(255 255 255 / 0.06) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgb(255 255 255 / 0.06) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-center p-4 sm:p-5">
        <h3 className="t-card-title text-white">{advisor.name}</h3>

        {/* Their own headline, unclamped. On the judge rail the equivalent line
            is `clamp-1` because the card is 240px wide and a wrap lifts the name
            off the baseline its neighbours sit on. Here the cards are in a grid
            with `h-full`, so a row is as tall as its tallest card and a second
            line costs nothing that has to be reserved. */}
        <p className="t-body-sm mt-1.5 text-white/75">{advisor.role}</p>

        {/* Joined only where both exist. A dangling middot in front of a city is
            the kind of small wrongness that reads as a broken template. */}
        {advisor.org || advisor.location ? (
          <p className="t-meta mt-2 text-white/55">
            {[advisor.org, advisor.location].filter(Boolean).join(" · ")}
          </p>
        ) : null}
      </div>

      {/*
        Its own dark disc rather than a bare glyph. The card's top right is
        arbitrary photograph on one card and flat ground on the next, and no
        fixed foreground colour is legible over both; a known background makes
        WCAG 1.4.11 a fact rather than a hope.
      */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-2.5 top-2.5 z-20 grid size-8 place-items-center rounded-full bg-white/12 text-white ring-1 ring-inset ring-white/20 transition-colors group-hover/advisor:bg-white/25"
      >
        <LinkedinLogoIcon size={16} weight="fill" />
      </span>

      {/* Stretched link, over the hover face and the badge so the whole card is
          the hit target. The focus ring is drawn on the card edge, because the
          anchor has no visible box of its own. */}
      <a
        href={advisor.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 z-30 rounded-[var(--radius-feature)] outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        <span className="sr-only">{`${advisor.name} on LinkedIn`}</span>
      </a>
    </article>
  );
}
