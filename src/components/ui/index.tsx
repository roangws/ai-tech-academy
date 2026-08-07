import Image from "next/image";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import type { Img } from "@/lib/content";

/**
 * Shared primitives, built to references/DESIGN-SPEC.md.
 *
 * Container is 1280px with 32px gutters, giving a 1216px content column at
 * desktop. Section padding is 64/64, or 40/40 for compressed bands. Nothing
 * here invents a radius, a shadow or a type size outside the scale.
 */

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1280px] px-4 sm:px-5 md:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Section shell. Three grounds now: white, tinted, and one dark anchor.
 *
 * The dark ground exists because a 6% luminance swing between white and
 * #EEF3F7 is too little to act as rhythm across twelve sections. Exactly one
 * section on the page uses `dark`, which is what Coursera does at this length.
 */
export function Section({
  id,
  tint = false,
  dark = false,
  compressed = false,
  hairlineTop = false,
  ariaLabel,
  ariaLabelledBy,
  className = "",
  children,
}: {
  id?: string;
  tint?: boolean;
  dark?: boolean;
  compressed?: boolean;
  hairlineTop?: boolean;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  className?: string;
  children: ReactNode;
}) {
  const ground = dark ? "bg-ink-band" : tint ? "bg-surface-subtle" : "bg-surface";

  return (
    <section
      id={id}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={[
        ground,
        !dark && (tint || hairlineTop) ? "border-t border-line" : "",
        !dark && tint ? "border-b border-line" : "",
        /*
          Mobile band padding is down a third, 12 to 8 and 8 to 6.

          Ten sections at py-12 spend 240px of a phone screen on the gaps
          between them, which is most of a viewport of pure air, and the brief
          asks for 20% off the mobile page. The desktop numbers are unchanged:
          at 1440 the bands need the room to read as separate objects, and
          nothing up there is scarce.
        */
        compressed ? "py-6 md:py-9 lg:py-10" : "py-8 md:py-14 lg:py-16",
        className,
      ].join(" ")}
    >
      <Container>{children}</Container>
    </section>
  );
}

/**
 * Inset panel. The page's second section shape.
 *
 * Every section on this page was one shape: a full-bleed band, a 1216px
 * container, a left-aligned eyebrow, a 28px heading, an intro, then a grid.
 * Fourteen of them in a row is one layout idea stated fourteen times, and the
 * white/#EEF3F7 alternation is too small a swing to break it up.
 *
 * Coursera and Udemy both solve this the same way, and it is the pattern in the
 * captures Roan pulled: content that would otherwise be another band is put
 * inside a rounded panel that is inset from the page edge and carries its own
 * ground. The container width does not change, so the page still reads as one
 * column, but the panel is unmistakably a different object from the sections
 * around it.
 *
 * Two grounds. `dark` is the page anchor, on the ink band the teams section
 * used to fill edge to edge. `tint` is the quieter one, for a panel that sits
 * on white and needs a border to hold its edge.
 *
 * Radius is --radius-feature, 16px, which is the largest radius in the spec.
 * The references run closer to 24, and matching them would mean adding a radius
 * the scale does not have.
 */
export function Panel({
  tone = "dark",
  id,
  ariaLabel,
  ariaLabelledBy,
  className = "",
  children,
}: {
  tone?: "dark" | "tint";
  id?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      id={id}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={[
        "overflow-hidden rounded-[var(--radius-feature)] p-5 md:p-8 lg:p-10",
        tone === "dark" ? "bg-ink-band" : "border border-line bg-surface-subtle",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

/** Eyebrow, section heading and intro as one 640px-capped block. */
export function SectionHeader({
  label,
  heading,
  intro,
  id,
  action,
}: {
  label?: string;
  heading: string;
  intro?: string;
  id?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 md:mb-6">
      <div className="max-w-[680px]">
        {label ? <p className="t-label mb-2 text-ink-muted">{label}</p> : null}
        <h2 id={id} className="t-h2 text-ink">
          {heading}
        </h2>
        {intro ? (
          <p className="t-body mt-2.5 max-w-[640px] text-ink-secondary md:mt-3">{intro}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/* ---------------------------------------------------------------- buttons */

/**
 * Every control on the page, rendered through the installed liquid-glass
 * component.
 *
 * This used to be a bare `<Link>` with a long class string, and three passes of
 * hand-copying the reference's shadow stacks onto it never produced the effect,
 * because the effect is a stack of layers rather than a set of classes. The
 * component now does the drawing; this wrapper's whole job is to keep the
 * sixteen existing call sites working and to map this page's three tones onto
 * its variants.
 *
 * `asChild` puts the glass onto the anchor itself, so the markup is still one
 * `<a>` per control rather than a button wrapped in a link.
 *
 * Tone names are unchanged (`primary`, `secondary`, `onDark`) so nothing that
 * imports this had to be touched.
 */
const toneToVariant = {
  primary: "accent",
  secondary: "default",
  onDark: "onDark",
} as const;

export function ButtonLink({
  tone = "primary",
  size = "lg",
  className = "",
  children,
  ...props
}: ComponentProps<typeof Link> & {
  tone?: keyof typeof toneToVariant;
  size?: "md" | "lg";
}) {
  return (
    <LiquidButton asChild variant={toneToVariant[tone]} size={size} className={`t-button ${className}`}>
      <Link {...props}>{children}</Link>
    </LiquidButton>
  );
}

/** Text action. The default for every secondary affordance on the page. */
export function TextAction({
  className = "",
  children,
  ...props
}: ComponentProps<typeof Link>) {
  return (
    <Link
      className={`t-button inline-flex min-h-[44px] items-center gap-1.5 py-2.5 text-accent no-underline transition-colors hover:text-accent-hover hover:underline lg:min-h-0 lg:py-0 ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ chips */

/** Status chip. Green is semantic: the module is open with no signup. */
export function StatusChip({
  children,
  open = false,
}: {
  children: ReactNode;
  open?: boolean;
}) {
  return (
    <span
      className={`t-label inline-flex h-6 items-center rounded-full px-2.5 ${
        open
          ? "bg-state-open-surface text-state-open"
          : "bg-surface-subtle text-ink-muted"
      }`}
    >
      {children}
    </span>
  );
}

export function SkillChip({ children }: { children: ReactNode }) {
  return (
    <span className="t-meta inline-flex h-7 items-center rounded-[6px] border border-line bg-surface-subtle px-2.5 text-ink-secondary">
      {children}
    </span>
  );
}

/** Middot-joined facts line. Coursera's single highest-value hero element. */
export function FactsLine({
  items,
  className = "",
}: {
  items: readonly string[];
  className?: string;
}) {
  return (
    <p className={`t-meta text-ink-muted ${className}`}>
      {items.map((item, i) => (
        <span key={item}>
          {i > 0 ? <span className="px-1.5 text-line-strong">&middot;</span> : null}
          {item}
        </span>
      ))}
    </p>
  );
}

/* ------------------------------------------------------------------ media */

/**
 * Local imagery. Four files, all real and all of Roan: the square portrait, a
 * lesson recording, an interview session and a room. Generated placeholder art
 * went at the 6 Aug review, and the three frames of people this site has no
 * name for went with it. See the imagery policy at the head of content.ts.
 */
export function Photo({
  image,
  width,
  height,
  className = "",
  sizes,
  priority = false,
}: {
  image: Img;
  width: number;
  height: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={image.src}
      alt={image.alt}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}

/**
 * Overlay chip for a poster corner. Solid ink at 78% rather than a gradient,
 * so the scrim stays a legibility device instead of a decorative wash.
 */
export function PosterChip({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`t-label inline-flex h-[22px] items-center rounded-[6px] bg-[rgb(13_26_34/0.78)] px-2 text-white ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * The title card that sits along the bottom of a poster.
 *
 * Google Prompting Essentials puts the lesson promise on its thumbnail rather
 * than shipping a raw frame, and that is the pattern here. The band is one
 * solid value so text contrast holds over any frame underneath it.
 */
export function PosterTitleCard({ title }: { title: string }) {
  return (
    <span className="pointer-events-none absolute inset-x-0 bottom-0 block bg-[rgb(13_26_34/0.86)] px-4 py-3">
      <span className="t-card-title block text-white">{title}</span>
    </span>
  );
}

/**
 * Path cover, drawn in the DOM.
 *
 * Every path used to share one flat placeholder tile, so roughly 40% of the
 * catalog carried zero information and five cards looked interchangeable. The
 * cover now states the path letter, the audience and the deliverable on its own
 * ground, one hue per path. The oversized letter is a watermark cut from the
 * ground itself rather than an added colour.
 */
export function PathCover({
  ground,
  badge,
  letter,
  audience,
  build,
  image,
  fill = false,
}: {
  ground: string;
  badge: string;
  letter: string;
  audience: string;
  build: string;
  /**
   * The photograph under the cover's graphic treatment. Absent leaves the flat
   * ground the covers shipped with, so a path with no picture yet degrades to
   * the old cover rather than to a gap.
   */
  image?: Img;
  /**
   * Take the height of whatever the cover is put in, rather than setting it
   * from an aspect ratio. Used by the featured card at md and up, where the
   * cover is a column beside the content and the row's height is already
   * decided by an ordinary card next to it.
   */
  fill?: boolean;
}) {
  return (
    /*
      Bounded by a ratio unless something else is doing the bounding, and that
      is the point: letting a cover flex inside a card that was itself
      stretching pooled every spare pixel into one field of flat colour, which
      is how this section once produced a 421px cover. `fill` is not that. It is
      only used where the height is already set by a sibling in the same grid
      row, so the cover matches a number rather than inventing one.

      16:6 below sm, 16:9 above it. Five covers at 16:9 on a 390px screen is
      1,005px of photograph in one section, and the cover only needs the height
      its two type blocks occupy: a 22px badge row and a two-line artifact line
      is 82px inside 32px of padding, so 134 has room to spare and 201 was
      spending 67px per card on empty ground.
    */
    <div
      className={`relative isolate flex flex-col justify-between overflow-hidden p-4 ${
        fill ? "h-full min-h-[260px]" : "aspect-[16/6] sm:aspect-video"
      }`}
      style={{ background: ground }}
    >
      {/*
        The photograph, and three layers of treatment over it.

        The covers were flat hue with a watermark letter, and the graphic design
        is unchanged: the same badge, the same audience line, the same "You
        build" block, the same letter, in the same places. What changed is what
        sits behind them.

        The path's own hue stays as a wash across the whole frame, which is what
        keeps five covers telling themselves apart at a glance. Then ink from the
        bottom and a lighter pass from the top, because each end of the cover
        carries text and a photograph cannot be trusted to be dark in the two
        places type needs it to be.

        The numbers matter more than the structure here. The first pass ran the
        wash at 52% with the bottom gradient reaching 45% up the frame, and it
        put every one of these people behind a grey-teal fog: on Path E the shop
        owner was barely findable, and the brief for this whole set of images was
        that they be human and warm. The wash is down to 26%, enough to tint and
        not enough to bury, and the ink now falls away by 38% so it does its work
        on the "You build" block and leaves the face above it alone.
      */}
      {image ? (
        <>
          <Image
            src={image.src}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 420px"
            className="absolute inset-0 -z-10 h-full w-full object-cover"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
            style={{ background: ground, opacity: 0.26 }}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-t from-[rgb(13_26_34/0.92)] via-[rgb(13_26_34/0.22)] via-38% to-transparent"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-20 bg-linear-to-b from-[rgb(13_26_34/0.48)] to-transparent"
          />
        </>
      ) : null}

      {/* Watermark cut from the ground itself, so the cover has texture without
          adding a second colour. Over a photograph it drops to a trace: at the
          flat-ground opacity it read as a compression artifact rather than as a
          letter. */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute right-2 select-none font-semibold leading-none tracking-[-0.06em] ${
          image ? "text-white/[0.13]" : fill ? "text-white/[0.07]" : "text-white/[0.10]"
        } ${fill ? "-bottom-20 text-[280px]" : "-bottom-14 text-[190px]"}`}
      >
        {letter}
      </span>

      {/* `items-start`, and the chip may not wrap or shrink. At 1024 the badge
          was competing with a two-line audience line inside one `gap-2` row,
          and "PATH" and its letter broke across two lines inside a 22px pill,
          dropping the letter onto the photograph below it. */}
      <span className="relative flex items-start gap-2">
        {/* The chip fill goes up over a photograph. At white/15 on flat hue it
            is a plate; at white/15 on a frame that might be bright behind it,
            it is nothing. */}
        <span
          className={`t-label inline-flex h-[22px] shrink-0 items-center whitespace-nowrap rounded-[6px] px-2 text-white ${
            image ? "bg-white/25" : "bg-white/15"
          }`}
        >
          {badge}
        </span>
        <span className={`t-meta pt-1 ${image ? "text-white" : "text-white/85"}`}>{audience}</span>
      </span>

      <span className="relative">
        <span className="t-field block text-white/75">You build</span>
        <span
          className={`mt-1 block font-semibold tracking-[-0.3px] text-white ${
            fill
              ? "text-[22px] leading-[28px]"
              : "text-[17px] leading-[23px] sm:text-[19px] sm:leading-[25px]"
          }`}
        >
          {build}
        </span>
      </span>
    </div>
  );
}
