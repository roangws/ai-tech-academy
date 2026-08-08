import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { StartDate } from "@/components/start-date";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { cta, startsOn, type Img } from "@/lib/content";

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

/**
 * Eyebrow, section heading and intro as one 640px-capped block.
 *
 * `asideIntro` is the one variation, and only #method asks for it: the intro
 * moves out of the stack and onto the heading's own row, in the space a
 * two-line heading leaves empty to its right.
 *
 * That band has the page's one hard height budget. It has to fit a 14in MacBook
 * without scrolling — about 780px once the browser chrome and the 72px sticky
 * header are out — and it is also the band carrying the most content, since the
 * method and the module format merged into it. Stacked, its eyebrow, two-line
 * heading and intro spend 166px of that budget before a reader sees anything
 * they can act on. Side by side they spend 106, because the heading wraps to
 * two lines either way and the intro is shorter than the hole beside it.
 *
 * `items-end` on the row is what makes it read as one object rather than two
 * columns: the intro's last line sits on the heading's last line.
 *
 * This replaced `wide`, which raised one section's intro cap from 640 to 760 to
 * buy the same band 24px. That was the cheap version of the same fix and it
 * bought a fifth of what this does, at the cost of a 95-character measure
 * against the 75 the rest of the page holds. Nothing uses it now, so it is
 * gone.
 */
export function SectionHeader({
  label,
  heading,
  intro,
  id,
  action,
  asideIntro = false,
}: {
  label?: string;
  heading: string;
  intro?: string;
  id?: string;
  action?: ReactNode;
  asideIntro?: boolean;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 md:mb-6">
      <div className={asideIntro ? "max-w-[620px]" : "max-w-[680px]"}>
        {label ? <p className="t-label mb-2 text-ink-muted">{label}</p> : null}
        <h2 id={id} className="t-h2 text-ink">
          {heading}
        </h2>
        {intro && !asideIntro ? (
          <p className="t-body mt-2.5 max-w-[640px] text-ink-secondary md:mt-3">{intro}</p>
        ) : null}
      </div>
      {/* `w-full` until lg, so on anything narrower than the two-column grid
          below this behaves exactly like the stacked form and wraps under the
          heading on the row's own 12px gap. */}
      {intro && asideIntro ? (
        <p className="t-body w-full text-ink-secondary lg:w-auto lg:max-w-[520px] lg:flex-1">
          {intro}
        </p>
      ) : null}
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

/**
 * The enrol control, which is the same button everywhere and says one extra
 * thing in the body of the page.
 *
 * Roan's split: the chrome carries the label alone, because a sticky bar has to
 * stay a bar and a two-line control in a 72px tier is a second tier. Every
 * in-page instance carries the date under it, because that is where a reader is
 * deciding and "starts today" is the fact that makes the decision easy.
 *
 * The second line is a fact rather than a flourish, so it is set as one: 12px,
 * 80% white, on the same centre line as the label. It reads as the button's own
 * subtitle rather than as a caption that happens to be inside a pill.
 *
 * `h-auto` is doing real work. Every `size` in the button variants sets a fixed
 * height, correctly, because a row of controls whose heights are decided by their
 * labels is a ragged row. Two lines need that released, and `cn` is
 * tailwind-merge, so the class arriving last through `className` wins over the
 * variant's `h-12` rather than fighting it at equal specificity.
 *
 * `leading-tight` and not the type scale: this is the one place on the page
 * where two lines share a control, and the scale's 20px and 18px leadings stack
 * to 38px inside a 48px pill, which puts 5px above the cap line and reads as
 * type that has slipped.
 */
export function EnrollButton({
  /*
    `/sign-up`, and this went through two wrong answers first.

    It was `#paths`, a bare fragment resolved against the current URL, so from
    /courses/gtm it pointed at /courses/gtm#paths and did nothing. Making it
    `/#courses` fixed the resolution and left a worse bug: the catalog is not an
    enrolment. On a course card it was a self-link, so pressing "Enroll for free"
    on the infrastructure card scrolled the reader back to the grid the card was
    already in. From the sticky header on a course page it threw the reader off
    that course entirely and back to the homepage.

    One label has to mean one thing. "Enroll for free" appears in the header, the
    hero, five catalog cards, the module section, the closing band and the course
    rail, and a reader who has pressed it once should be able to predict it. It
    starts the account, everywhere.

    Choosing a course is a different job and it already has its own controls:
    "View course" on each card, and "Compare all five courses" where the reader is
    somewhere else on the site.
  */
  href = "/sign-up",
  withDate = false,
  tone = "primary",
  size = "lg",
  className = "",
  ...props
}: Omit<ComponentProps<typeof Link>, "href" | "children"> & {
  href?: ComponentProps<typeof Link>["href"];
  withDate?: boolean;
  tone?: "primary" | "secondary" | "onDark";
  size?: "md" | "lg";
}) {
  if (!withDate) {
    return (
      <ButtonLink href={href} tone={tone} size={size} className={className} {...props}>
        {cta.primary}
      </ButtonLink>
    );
  }

  return (
    <ButtonLink
      href={href}
      tone={tone}
      size={size}
      className={`h-auto py-2.5 ${className}`}
      {...props}
    >
      <span className="flex flex-col items-center leading-tight">
        <span>{cta.primary}</span>
        {/*
          `new Date()` runs here, on the server, and its only job is to be the
          string hydration matches. StartDate replaces it with the reader's own
          date on mount; that file has the note on why the authority has to sit
          on the client.
        */}
        {/*
          90%, not 80%. The subtitle has to stay subordinate to the label, and at
          80% white it measured 4.29:1 against the resting fill, which is under the
          4.5 that AA asks of 12px type. 90% is 4.7:1 and still a visible step down
          from the label above it.
        */}
        <span
          className={`t-micro font-semibold ${tone === "secondary" ? "text-ink-muted" : "opacity-90"}`}
        >
          Starts <StartDate initial={startsOn(new Date())} />
        </span>
      </span>
    </ButtonLink>
  );
}

/**
 * The one class string both secondary affordances wear.
 *
 * 44px minimum tap target below lg and released above it, because a 44px row in a
 * dense desktop card is a hole rather than a target.
 */
const textActionClass =
  "t-button inline-flex min-h-[44px] items-center gap-1.5 py-2.5 text-accent no-underline transition-colors hover:text-accent-hover hover:underline lg:min-h-0 lg:py-0";

/** Text action. The default for every secondary affordance on the page. */
export function TextAction({
  className = "",
  children,
  ...props
}: ComponentProps<typeof Link>) {
  return (
    <Link className={`${textActionClass} ${className}`} {...props}>
      {children}
    </Link>
  );
}

/**
 * The same affordance where the thing it does is not navigation.
 *
 * The curriculum accordion's "Expand all" needed this and there was nowhere for
 * it to go: `TextAction` is a `<Link>`, and the two ways of forcing a link to do
 * this job are both wrong. `<a href="#">` with an onClick puts a fragment in the
 * address bar and jumps the page for anybody whose JavaScript has not arrived; an
 * anchor with no href is not focusable and is announced as text.
 *
 * A button that expands something is a button. It shares the class string above
 * so the two are indistinguishable on screen, which they should be, since to a
 * reader they are the same blue affordance.
 */
export function TextButton({
  className = "",
  children,
  ...props
}: ComponentProps<"button">) {
  return (
    <button type="button" className={`${textActionClass} ${className}`} {...props}>
      {children}
    </button>
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

/**
 * Middot-joined facts line. Coursera's single highest-value hero element.
 *
 * `tone` is a real prop rather than a className, and the reason is a trap worth
 * naming once. This component builds its class string by concatenation, so a
 * `text-white/70` arriving through `className` does not override the
 * `text-ink-muted` written here: both land in the attribute and the winner is
 * decided by CSS source order, which is whichever Tailwind emitted first. Only
 * the button wrapper runs through tailwind-merge. So anything on a dark ground
 * has to be selected here, where the losing class can be left out entirely.
 */
export function FactsLine({
  items,
  tone = "light",
  className = "",
}: {
  items: readonly string[];
  tone?: "light" | "dark";
  className?: string;
}) {
  const dark = tone === "dark";

  return (
    <p className={`t-meta ${dark ? "text-white/70" : "text-ink-muted"} ${className}`}>
      {items.map((item, i) => (
        <span key={item}>
          {i > 0 ? (
            <span className={`px-1.5 ${dark ? "text-white/35" : "text-line-strong"}`}>
              &middot;
            </span>
          ) : null}
          {item}
        </span>
      ))}
    </p>
  );
}

/**
 * The check row, which was inline in the module-format section and is now in two
 * places.
 *
 * 16px glyph at `weight="bold"`, `mt-0.5` so it sits on the first line's cap
 * height rather than centred on a two-line item, and `flex-none` so a long item
 * wraps under itself rather than around the glyph.
 */
export function CheckList({
  items,
  className = "",
  columns = 1,
}: {
  items: readonly string[];
  className?: string;
  columns?: 1 | 2;
}) {
  return (
    <ul
      className={`grid gap-x-8 gap-y-2.5 ${
        columns === 2 ? "sm:grid-cols-2" : ""
      } ${className}`}
    >
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5">
          {/* `aria-hidden`. The check is a bullet: the item beside it reads the
              same without it, and unmarked it put six nameless images into the
              AX tree of "What you will learn". */}
          <CheckIcon
            size={16}
            weight="bold"
            aria-hidden="true"
            className="mt-0.5 flex-none text-ink"
          />
          <span className="t-body-sm text-ink-secondary">{item}</span>
        </li>
      ))}
    </ul>
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
 * Course cover, drawn in the DOM.
 *
 * Every course used to share one flat placeholder tile, so roughly 40% of the
 * catalog carried zero information and five cards looked interchangeable. The
 * cover now states the path letter, the audience and the deliverable on its own
 * ground, one hue per course. The oversized letter is a watermark cut from the
 * ground itself rather than an added colour.
 */
export function CourseCover({
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

      ---------------------------- THE RATIO IS A FLOOR NOW, CHANGED 7 AUG

      It was `aspect-video` straight on this element, which is a height, not a
      minimum: when the type inside needed more than the ratio granted, the
      overflow was silently clipped by the `overflow-hidden` two lines down. The
      breakpoint that broke was lg on the course page, where "Four more, one
      method" runs four cards across at 222px. 16:9 gives that 125px; a chip, a
      two-line audience line, "You build" and a two-line artifact need 150. The
      bottom 25 were cut, which put the shear straight through the artifact line
      and is the clipped card in Roan's capture. `aspect-ratio` does not
      participate in automatic minimum sizing, so nothing anywhere reported it.

      A grid with one cell and two things in it fixes that with no measuring. The
      spacer carries the ratio and the content sits on top of it in the same cell,
      so the row resolves to whichever is taller: the ratio when the type fits,
      the type when it does not.

      Where the type wins, it wins by the same amount on every cover in a row,
      because the audience line and the artifact line each reserve two lines. The
      notes on those two say why. Without the reservation this fix trades a clipped
      cover for a ragged row, which it did for an hour.

      The type wins below sm, where 16:6 on a 288px card is 108px and the block
      needs about 157. That is one card per row down there, so there is nothing for
      it to be level with.

      Not `min-h-[125px]` and friends. The ratio has to follow the card's width
      and the card's width follows five breakpoints and three different grids.

      `grid-cols-1` is belt and braces, and the note here used to claim it was
      load-bearing on the grounds that an `auto` track's max-content maximum is not
      clamped by the container. Tested rather than asserted: forcing
      `grid-template-columns: auto` on every cover at 1024, 1152 and 1280 returns
      byte-identical geometry on both pages. An auto track in a definite-width
      container does not grow past the free space. The explicit `minmax(0, 1fr)`
      stays because it states the intent, not because anything depends on it.

      `fill` keeps its old behaviour and needs no spacer: there the height is
      already set by a sibling card in the same grid row.
    */
    <div
      className={`relative isolate grid grid-cols-1 overflow-hidden ${
        fill ? "h-full min-h-[260px]" : ""
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
        put every one of these people behind a grey-teal fog: on Course E the shop
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
          {/*
            `h-28` and a three-stop ramp, both changed on 7 Aug, and this is the
            other half of the change that stacked the chip and the audience line.

            Stacking moved the audience line from roughly y20-38 to y47-65. The old
            plate was 80px of a single 0.62-to-0 ramp, which is down to 0.26 by y47
            and 0.12 by y65, so the type walked out from under the cover it was
            measured for. Sampled on the rendered frames with the text hidden, the
            GTM cover came out at 2.09:1 median for 13px white against the 4.5 that
            AA wants, and all five failed in their darkest fifth.

            112px carries the ramp past the line's new position, and the 0.42 stop
            at 60% holds it up across y47-65 instead of letting a two-stop gradient
            sag through the middle of the band. Re-measured the same way, per cover:

              Course B  15.41 median  7.91 worst-5%
              Course C   8.66         4.81
              Course D  10.76         4.94
              Course E   7.27         4.36

            against 3.36-3.76 worst-5% for the position this replaced, so every
            cover is better than what shipped before the stack. The last few
            hundredths of a per cent of pixels sit at 3.7-4.5 in the corners of the
            band, which is where no glyph stroke lands.

            The alpha is not pushed further on purpose. The whole brief for this set
            of photographs was that the people in them read as human and warm, and
            the note above records the pass where a heavier treatment put every one
            of them behind a grey-teal fog. This is as much plate as the frames can
            take and still be photographs.
          */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-28 bg-linear-to-b from-[rgb(13_26_34/0.78)] via-[rgb(13_26_34/0.42)] via-60% to-transparent"
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

      {/* The ratio, as a cell-mate rather than as this element's height. It draws
          nothing and holds no content; the grid row takes the larger of it and the
          type layer beside it. Omitted under `fill`, where the row height comes
          from a sibling card. */}
      {fill ? null : (
        <span
          aria-hidden="true"
          className="col-start-1 row-start-1 aspect-[16/6] w-full sm:aspect-video"
        />
      )}

      {/*
        The type, in the same grid cell as the spacer and stretched to it.

        `min-w-0` because a grid item's automatic minimum size is its content, and
        without it a long unbroken word in a title would push the cover wider than
        its card at the narrow end of the catalog.
      */}
      <div className="col-start-1 row-start-1 flex min-w-0 flex-col justify-between p-4">
      {/*
        THE CHIP AND THE AUDIENCE LINE ARE STACKED, and they were a row until
        7 Aug.

        The row was `[COURSE B] Editors, producers, post supervisors` inside one
        `gap-2` flex, and three of the five covers have an audience line too long
        for what the chip leaves them. It wrapped, and the second line returned to
        the container's left edge while the first started 96px in, so the sentence
        stepped backwards under the chip: the chip read as a block sitting in the
        middle of the line, cutting it. Roan photographed Course B, which is the
        worst of them at 36 characters.

        Stacked, the audience line gets the cover's full width. At 260px of
        content that is one line for four of the five covers and a clean two for
        Course C, with no step and no collision, and the chip is back to being a
        label on the frame rather than an obstacle in a sentence.

        The block costs 4px of height against the row it replaced, and it is spent
        in the gap between two things rather than inside either.

        The chip still may not wrap or shrink. At 1024 in the old row, "PATH" and
        its letter broke across two lines inside a 22px pill and dropped the letter
        onto the photograph below it.
      */}
      <span className="relative block">
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
        {/*
          `clamp-2` and a reserved two lines, which are doing two different jobs.

          The clamp is a ceiling: two lines is the most this block can take before
          it meets the "You build" line on the 134px cover a phone gets, and no
          audience line in content.ts runs to three at any width this renders at.

          `min-h-[36px]` is the floor, and it is what lets a row of covers finish
          level. Four of the five audience lines wrap to two lines in a four-across
          card and one ("Owners and operators") does not, so without a reservation
          Course E's cover came out 18px shorter than the three beside it and its
          card title started on a different line from theirs. This is the same move
          the catalog card already makes on its own title and summary, for the same
          reason, and the note there says so.

          36 is two lines of `t-meta` at 13/18. When the cover is ratio-bound the
          reservation costs nothing: `justify-between` was going to spend that space
          on the gap anyway.

          `mt-1`, not `mt-1.5`. At 6px the gap inside the badge group was half the
          12px gap to the block below it, so chip, audience, "You build" and the
          artifact read as one four-line paragraph. 4 against 12 groups correctly.
        */}
        <span
          className={`t-meta clamp-2 mt-1 block min-h-[36px] ${image ? "text-white" : "text-white/85"}`}
        >
          {audience}
        </span>
      </span>

      {/* `pt-3`, so a tall audience line and a tall artifact line never close to
          nothing. `justify-between` only guarantees a gap while there is slack to
          distribute, and at the four-across width there is none.

          12 and not 16, which is what this was for an hour. 16 put the type
          layer 4px past 16:9 on three of the four covers in the cross-sell row,
          so those three grew off the ratio and the fourth did not, and a row of
          cards started their titles on two different lines. The gap is the one
          number in this block that was free to give. */}
      <span className="relative pt-3">
        <span className="t-field block text-white/75">You build</span>
        {/* Two lines reserved here too, and for the same reason as the audience
            line above: "Model serving on GPU cloud" fits one line in a four-across
            card where the other four take two, so without it that cover finished
            25px short of the row. `fill` needs no floor, since there the height is
            set by a sibling card. */}
        <span
          className={`mt-1 block font-semibold tracking-[-0.3px] text-white ${
            fill
              ? "text-[22px] leading-[28px]"
              : "min-h-[46px] text-[17px] leading-[23px] sm:min-h-[50px] sm:text-[19px] sm:leading-[25px]"
          }`}
        >
          {build}
        </span>
      </span>
      </div>
    </div>
  );
}
