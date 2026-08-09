import Image from "next/image";
import Link from "next/link";
import { LinkedinLogoIcon } from "@phosphor-icons/react/dist/ssr";
import { Photo } from "@/components/ui";
import type { Seat } from "@/lib/content";

/**
 * One review-judge card, as a portrait. Shared by the homepage carousel
 * (board.tsx) and the full roster page, so the card stays one definition.
 *
 * ------------------------------------------------------- two kinds of card
 *
 * A NAMED JUDGE and an OPEN SEAT render through the same three slots, and the
 * slots hold different things:
 *
 *   title     the person's name          the discipline
 *   subtitle  their own stated role      the course that seat reads
 *   detail    employer and location      what that seat checks
 *
 * They are not two components because they are the same object at two stages of
 * the same process, and splitting them would put the scrim, the hover face, the
 * stretched link and the clamp rules in two places to be edited apart. The type
 * in content.ts carries the note on why a named judge has no `checks` and no
 * `reviews` to print.
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
  /**
   * The course an open seat reads. Ignored for a named judge, who has no course
   * assignment to print — see the type note in content.ts.
   */
  courseTitle?: string;
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
  /* The subtitle and the detail line, resolved once so the markup below reads
     as one card rather than as two branches interleaved. `org` and `location`
     are joined only when both are there: Liz Zhang publishes no employer, and a
     dangling separator in front of a city is the kind of small wrongness that
     reads as a broken template. */
  const subtitle = member.name ? member.role : courseTitle;
  const detail = member.name
    ? [member.org, member.location].filter(Boolean).join(" · ")
    : member.checks;

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

      {/*
        The profile link, and it renders only when the card is NOT one big link.

        The homepage carousel passes `href` and stretches an anchor over the
        whole card, so an anchor inside it would be a link nested in a link:
        invalid, and in practice unreachable, because the stretched overlay sits
        above it at z-20. The roster page passes no `href`, which is where a
        judge's own profile is worth reaching and where this appears.

        Top right, opposite the mark, on the other half of a head-and-shoulders
        frame that is reliably empty. 44px of target for a 19px glyph, which is
        the smallest this can be and still clear WCAG 2.5.8.

        It carries its own dark disc rather than sitting bare on the photograph.
        The first version was a 70% white glyph with the background arriving only
        on hover, and on Liz Zhang's card the top right corner is a pale studio
        backdrop, so the one control on the card was white-on-white until you
        found it with a pointer. A portrait is an arbitrary image and no fixed
        foreground colour is legible over all of them; the disc makes the
        background known, which is the only way to make the contrast a fact
        rather than a hope. WCAG 1.4.11 wants 3:1 for the glyph, and white on
        this scrim clears it over any photograph underneath.
      */}
      {member.linkedin && !href ? (
        <Link
          href={member.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${member.name ?? member.seat} on LinkedIn`}
          className="absolute right-2.5 top-2.5 z-30 grid size-11 place-items-center rounded-full bg-[rgb(13_26_34/0.55)] text-white no-underline backdrop-blur-[2px] transition-colors hover:bg-[rgb(13_26_34/0.82)] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        >
          <LinkedinLogoIcon size={19} weight="fill" aria-hidden="true" />
        </Link>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 z-10 p-4">
        <h3 className="t-card-title text-white">{member.name ?? member.seat}</h3>
        {/* One line, always. The block is bottom-anchored, so a
            subtitle that wraps lifts its own title 18px clear of the
            titles either side of it: four cards, three baselines. */}
        {subtitle ? <p className="t-meta clamp-1 mt-0.5 text-white/70">{subtitle}</p> : null}

        {/* Height-animated rather than mounted on hover, so the text
            is in the document for a screen reader and for anyone
            whose browser never fires a hover at all. */}
        {detail ? (
          <p
            className={`t-body-sm grid transition-[grid-template-rows,color] duration-200 ${
              checksAlwaysVisible
                ? "mt-2.5 grid-rows-[1fr] text-white/90"
                : "grid-rows-[0fr] text-white/0 group-hover/card:mt-2.5 group-hover/card:grid-rows-[1fr] group-hover/card:text-white/90 max-sm:mt-2.5 max-sm:grid-rows-[1fr] max-sm:text-white/90"
            }`}
          >
            <span className="overflow-hidden">{detail}</span>
          </p>
        ) : null}
      </div>
    </article>
  );
}
