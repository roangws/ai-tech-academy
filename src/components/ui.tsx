import Image from "next/image";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
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
        compressed ? "py-8 md:py-9 lg:py-10" : "py-12 md:py-14 lg:py-16",
        className,
      ].join(" ")}
    >
      <Container>{children}</Container>
    </section>
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
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
      <div className="max-w-[640px]">
        {label ? <p className="t-label mb-2 text-ink-muted">{label}</p> : null}
        <h2 id={id} className="t-h2 text-ink">
          {heading}
        </h2>
        {intro ? <p className="t-body mt-3 text-ink-secondary">{intro}</p> : null}
      </div>
      {action}
    </div>
  );
}

/* ---------------------------------------------------------------- buttons */

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] t-button transition-colors duration-150 active:translate-y-px";

const tones = {
  // AA: #fff on #066C94 = 6.5:1
  primary: "bg-accent text-white hover:bg-accent-hover",
  secondary: "bg-surface text-ink border border-line-strong hover:bg-surface-subtle",
  // For the one dark band. White fill reads as the primary control there.
  onDark: "bg-white text-ink hover:bg-surface-subtle",
} as const;

const sizes = {
  md: "h-10 px-4",
  lg: "h-11 px-5",
} as const;

export function ButtonLink({
  tone = "primary",
  size = "lg",
  className = "",
  children,
  ...props
}: ComponentProps<typeof Link> & {
  tone?: keyof typeof tones;
  size?: keyof typeof sizes;
}) {
  return (
    <Link className={`${base} ${tones[tone]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </Link>
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
export function PosterTitleCard({
  title,
  beats,
}: {
  title: string;
  beats: readonly string[];
}) {
  return (
    <span className="pointer-events-none absolute inset-x-0 bottom-0 block bg-[rgb(13_26_34/0.86)] px-4 py-3">
      <span className="t-card-title block text-white">{title}</span>
      <span className="mt-2 flex flex-wrap gap-1.5">
        {beats.map((b) => (
          <span
            key={b}
            className="t-micro inline-flex h-[22px] items-center rounded-[5px] border border-white/25 px-2 font-medium text-white/90"
          >
            {b}
          </span>
        ))}
      </span>
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
  tall = false,
}: {
  ground: string;
  badge: string;
  letter: string;
  audience: string;
  build: string;
  tall?: boolean;
}) {
  return (
    <div
      className={`relative isolate flex flex-col justify-between overflow-hidden p-4 ${
        // Bounded on both variants. Letting the tall cover flex pooled every
        // spare pixel of the two-row grid into one field of flat colour, which
        // is the same hollow the small cards used to have, moved somewhere
        // bigger. 4:3 gives the featured composition room without a void.
        tall ? "aspect-[4/3]" : "aspect-video"
      }`}
      style={{ background: ground }}
    >
      {/* Watermark cut from the ground itself, so the cover has texture without
          adding a second colour. It scales with the cover so the tall featured
          variant reads as a poster rather than a stretched tile. */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute select-none font-semibold leading-none tracking-[-0.06em] ${
          tall
            ? "-bottom-20 right-2 text-[280px] text-white/[0.07]"
            : "-bottom-14 right-2 text-[190px] text-white/[0.10]"
        }`}
      >
        {letter}
      </span>

      <span className="relative flex items-center gap-2">
        <span className="t-label inline-flex h-[22px] items-center rounded-[6px] bg-white/15 px-2 text-white">
          {badge}
        </span>
        <span className="t-meta text-white/85">{audience}</span>
      </span>

      <span className="relative">
        <span className="t-field block text-white/75">You build</span>
        <span
          className={`mt-1 block font-semibold tracking-[-0.3px] text-white ${
            tall ? "text-[22px] leading-[28px]" : "text-[19px] leading-[25px]"
          }`}
        >
          {build}
        </span>
      </span>
    </div>
  );
}
