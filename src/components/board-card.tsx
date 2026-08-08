import Image from "next/image";
import Link from "next/link";
import { Photo } from "@/components/ui";
import type { Seat } from "@/lib/content";

/**
 * One review-judge seat, as a portrait card. Shared by the homepage carousel
 * (board.tsx) and the full roster page, so the card stays one definition.
 */
export function BoardCard({
  member,
  courseTitle,
  checksAlwaysVisible = false,
  href,
  id,
  className = "",
}: {
  member: Seat;
  courseTitle: string;
  /**
   * Show `checks` at every width instead of revealing it on hover.
   *
   * The carousel on the homepage keeps the hover reveal: it is a teaser beside
   * nine other sections and the card is 240px wide. The roster page is the
   * opposite case. It exists to list these seats, `checks` is the only line that
   * tells one from another, and a touch screen never fires the hover that would
   * show it.
   */
  checksAlwaysVisible?: boolean;
  /**
   * Turn the whole card into one link.
   *
   * The homepage teaser used to carry a single text action beside the section
   * heading, so six faces sat there looking like the most clickable objects in
   * the band and were the only ones that were not. A card that reads as a card
   * has to go somewhere.
   *
   * It is a stretched overlay rather than a `<Link>` wrapped around the markup:
   * the anchor stays a sibling of the content, so the heading and the sentence
   * are still selectable text and the accessible name is the seat alone rather
   * than the whole card read out as one link label.
   */
  href?: string;
  /**
   * The anchor id, and it is passed in rather than taken from `member.id`.
   *
   * It used to be `id={member.id}`, unconditionally, which is correct on the
   * roster page — the homepage teaser deep-links to `/review-judge-board#<id>`
   * and every seat needs a landing target — and wrong on the homepage, where
   * `CarouselRail` renders its children a second time to make the loop. Six
   * seats rendered twice put six duplicated ids in the homepage document.
   *
   * Nothing on the homepage points at them: the teaser's own links are
   * cross-page, so the duplicates broke no behaviour and only made the markup
   * invalid. But an id that exists for a target on another page has no reason
   * to be emitted by the page that has no target, and deriving it here meant
   * the carousel could not opt out.
   */
  id?: string;
  className?: string;
}) {
  return (
    <article
      id={id}
      className={`group/card relative h-[300px] w-full overflow-hidden rounded-[var(--radius-feature)] bg-ink-band scroll-mt-24 sm:h-[340px] ${className}`}
    >
      {member.photo ? (
        <Photo
          image={member.photo}
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
      {member.logo ? (
        <span className="absolute left-4 top-4 z-10">
          <Image
            src={member.logo.src}
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
          background: member.ground,
          backgroundImage:
            "linear-gradient(rgb(255 255 255 / 0.06) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgb(255 255 255 / 0.06) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />

      {/* Stretched link. `z-20` puts it over the scrim and the hover face and
          under nothing, so the whole card is the hit target. The focus ring is
          drawn on the card edge rather than on the anchor, because the anchor
          has no visible box of its own. */}
      {href ? (
        <Link
          href={href}
          className="absolute inset-0 z-20 rounded-[var(--radius-feature)] outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink-band"
        >
          <span className="sr-only">{member.name ?? member.seat}</span>
        </Link>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 z-10 p-4">
        <h3 className="t-card-title text-white">{member.name ?? member.seat}</h3>
        {/* One line, always. The block is bottom-anchored, so a
            subtitle that wraps lifts its own title 18px clear of the
            titles either side of it: four cards, three baselines. */}
        <p className="t-meta clamp-1 mt-0.5 text-white/70">{courseTitle}</p>

        {/* Height-animated rather than mounted on hover, so the text
            is in the document for a screen reader and for anyone
            whose browser never fires a hover at all. */}
        <p
          className={`t-body-sm grid transition-[grid-template-rows,color] duration-200 ${
            checksAlwaysVisible
              ? "mt-2.5 grid-rows-[1fr] text-white/90"
              : "grid-rows-[0fr] text-white/0 group-hover/card:mt-2.5 group-hover/card:grid-rows-[1fr] group-hover/card:text-white/90 max-sm:mt-2.5 max-sm:grid-rows-[1fr] max-sm:text-white/90"
          }`}
        >
          <span className="overflow-hidden">{member.checks}</span>
        </p>
      </div>
    </article>
  );
}
