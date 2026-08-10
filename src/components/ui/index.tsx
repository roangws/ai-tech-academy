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
 * `items-end` is what makes it read as one object rather than two columns: the
 * intro's last line sits on the heading's last line.
 *
 * IT IS A GRID, on the same tracks as #method's own content, and that is the
 * whole point rather than an implementation detail. The first version was a
 * `justify-between` flex row, which put the intro hard against the container's
 * right edge and let its left edge fall wherever the text happened to wrap —
 * measured, x=844 above a card starting at x=718. Two blocks in the right half
 * of one band, 126px out of line, with nothing between them to explain why.
 * Sharing the tracks means the intro starts exactly where the card below it
 * starts, and the heading ends where the video does.
 *
 * The caller owns the track sizes, via `tracks`, because the header can only
 * line up with a grid it is told about.
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
  tracks = "lg:grid-cols-2",
  as: Heading = "h2",
}: {
  label?: string;
  heading: string;
  intro?: string;
  id?: string;
  /**
   * The right-hand affordance, usually a `TextAction` to the page a band
   * teases.
   *
   * NOT COMPATIBLE WITH `asideIntro`, and the failure is silent rather than
   * loud, which is why it is written down here. In the split form the header is
   * a two-column grid holding the heading and the intro; an action is a third
   * child, so it does not sit at the end of the row — it drops to a second row
   * under the heading and reads as a stray link. If a section ever needs both,
   * the action belongs inside the intro's cell rather than beside it.
   */
  action?: ReactNode;
  asideIntro?: boolean;
  /** Tailwind column classes for `asideIntro`, matched to the section's grid. */
  tracks?: string;
  /**
   * The heading level, and it exists for exactly one call site.
   *
   * Every band on the homepage is a section of a page whose h1 is the hero, so
   * `h2` is right and is the default. `/courses` is different: it is a page
   * whose whole subject is the thing this header names, and it had no h1 at all
   * until this prop existed — the document outline started at h2 and a screen
   * reader jumping by heading found no title for the page.
   *
   * A prop rather than a second component, because the visible treatment is
   * identical and should stay identical; `t-h2` is the type scale's section
   * heading and the level is a semantic fact about the document, not a size.
   */
  as?: "h1" | "h2";
}) {
  return (
    <div
      className={
        asideIntro
          ? `mb-5 grid grid-cols-1 items-end gap-x-8 gap-y-3 md:mb-6 ${tracks}`
          : "mb-5 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 md:mb-6"
      }
    >
      <div className={asideIntro ? "min-w-0" : "max-w-[680px]"}>
        {label ? <p className="t-label mb-2 text-ink-muted">{label}</p> : null}
        <Heading id={id} className="t-h2 text-ink">
          {heading}
        </Heading>
        {intro && !asideIntro ? (
          <p className="t-body mt-2.5 max-w-[640px] text-ink-secondary md:mt-3">{intro}</p>
        ) : null}
      </div>
      {/* One column until `tracks` splits it, so at every narrower width this is
          the ordinary stacked header: the intro sits under the heading on the
          row's own 12px gap, capped at the page's 640px measure like every
          other intro on the site. The cap stays in force in the split form too,
          where #method's column measures 646px at 1512 and the last 6px of it
          are rag anyway. */}
      {intro && asideIntro ? (
        <p className="t-body min-w-0 max-w-[640px] text-ink-secondary">{intro}</p>
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
 * cover now states the deliverable over the course's own photograph, tinted with
 * one hue per course. The oversized letter is a watermark cut from that ground
 * rather than an added colour.
 */
/**
 * ------------------------------------------- WHAT THE COVER NO LONGER CARRIES
 *
 * The `[COURSE B]` chip and the audience line under it ("Editors, producers,
 * post supervisors") were removed on 8 Aug, on Roan's note to make the cover
 * cleaner. Three things followed from it and all three are improvements the
 * cover could not have had while they were there:
 *
 *   - The top gradient plate went with them. It was 112px of ink from 0.78,
 *     and it existed for one reason: to hold 13px white type up to AA over an
 *     unpredictable frame. The note it replaced records that the whole brief
 *     for this set of photographs was that the people in them read as human and
 *     warm, and that the plate was as much treatment as the frames could take
 *     and still be photographs. With no type in the top half there is nothing to
 *     make legible, so the plate is pure loss, and every one of these faces is
 *     now uncovered.
 *
 *   - The two-line reservations went too. `min-h-[36px]` on the audience line
 *     existed so four covers in a row finished level when four of five wrapped
 *     to two lines and one did not. One block of type cannot disagree with
 *     itself, so the problem is gone rather than solved.
 *
 *   - Every cover is now bounded by its ratio at every width. The type layer
 *     resolves to about 99px against 108 at 16:6 on the narrowest card and 125
 *     at 16:9 four-across, so the spacer always wins. That is the case the grid
 *     arrangement below was built to survive; it stays as the safety net, but
 *     nothing currently relies on it.
 *
 * `letter` stays and is still derived from the badge. It is a watermark at 13%
 * over a photograph — texture, not a label — and it is the only thing left that
 * distinguishes two covers whose photographs are similar.
 */
export function CourseCover({
  ground,
  letter,
  build,
  image,
  fill = false,
  href,
  title,
}: {
  ground: string;
  letter: string;
  build: string;
  /**
   * Where the picture goes when it is pressed.
   *
   * It went nowhere, on every card on the site. The largest, most obviously
   * pressable element on a course card — a photograph with the course's own
   * colour washed over it — was inert, and the only way into the course was a
   * title link a third of its size sitting underneath. People press pictures;
   * this one answered by doing nothing, which reads as a broken card rather
   * than as a deliberate omission.
   *
   * A stretched link INSIDE the cover rather than over the whole card. The note
   * on `CourseCard` records why the card-wide version had to be removed — it
   * covered the card's own controls and made them unreachable — and that
   * reasoning still holds. The cover is a separate box above the content with
   * no controls in it, so a link filling it takes nothing away.
   *
   * `aria-hidden` plus `tabIndex={-1}`: the card's title already links to the
   * same place with the same name, and a second tab stop announcing the same
   * destination is noise for a keyboard reader, not an affordance.
   */
  href?: string;
  /** Names the destination for the one case where nothing else does. */
  title?: string;
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
      its one type block occupies: "You build" and a two-line artifact is 67px
      inside 32px of padding, so 134 has room to spare and 201 was spending 67px
      per card on empty ground.

      ---------------------------- THE RATIO IS A FLOOR NOW, CHANGED 7 AUG

      It was `aspect-video` straight on this element, which is a height, not a
      minimum: when the type inside needed more than the ratio granted, the
      overflow was silently clipped by the `overflow-hidden` two lines down. The
      breakpoint that broke was lg on the course page, where the cross-sell runs
      four cards across at 222px. 16:9 gives that 125px; the block then was a
      chip, a two-line audience line, "You build" and a two-line artifact, which
      need 150. The bottom 25 were cut, which put the shear straight through the
      artifact line and is the clipped card in Roan's capture. `aspect-ratio`
      does not participate in automatic minimum sizing, so nothing anywhere
      reported it.

      A grid with one cell and two things in it fixes that with no measuring. The
      spacer carries the ratio and the content sits on top of it in the same cell,
      so the row resolves to whichever is taller: the ratio when the type fits,
      the type when it does not.

      NOTHING CURRENTLY MAKES THE TYPE WIN, and that changed on 8 Aug when the
      chip and the audience line came off the cover. The block is about 99px now
      against 108 at the narrowest 16:6 and 125 at four-across 16:9, so the
      spacer sets the height at every width. This arrangement stays as the safety
      net rather than as live machinery: it is what makes the failure a taller
      cover instead of a silent crop, and the artifact line keeps its two-line
      reservation so a row stays level if the type ever does win again.

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
      className={`group/cover relative isolate grid grid-cols-1 overflow-hidden ${
        fill ? "h-full min-h-[260px]" : ""
      }`}
      style={{ background: ground }}
    >
      {/* Last in paint order would be tidier and is wrong: the treatment layers
          below are `absolute` siblings, so a link declared after them would sit
          on top of the type as well as the photograph. It is declared here with
          an explicit `z-20` instead, which is inside this element's own
          `isolate` and so cannot reach anything outside the cover. */}
      {href ? (
        <Link
          href={href}
          aria-hidden="true"
          tabIndex={-1}
          title={title}
          className="absolute inset-0 z-20"
        />
      ) : null}
      {/*
        The photograph, and three layers of treatment over it.

        The covers were flat hue with a watermark letter. The path's own hue
        stays as a wash across the whole frame, which is what keeps five covers
        telling themselves apart at a glance, and ink comes up from the bottom
        because the "You build" block sits there and a photograph cannot be
        trusted to be dark where type needs it.

        There were three layers and there are two. The third was a plate across
        the top, for the chip and the audience line, and it went when they did:
        with no type up there it was ink over a face for nothing.

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
          {/*
            `objectPosition` from `image.focus`, added 8 Aug in the same pass as
            the course hero's.

            It was missed there and the note on `Img.focus` in content.ts said
            outright that the horizontal value "does take effect on the catalog
            covers", which was false for as long as this line did not exist —
            the covers were still cropping from the centre. A comment asserting
            behaviour the code does not have is the exact failure the notes in
            this repo are supposed to prevent, so it is worth saying plainly
            that this is the fix for one.

            It matters more here than on the hero, because both axes work. These
            boxes are 16:9 and 16:6 against frames that are 16:9 and one 4:5, so
            a cover has horizontal overflow at some widths and vertical at
            others, and the same string steers whichever one exists.
          */}
          <Image
            src={image.src}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 420px"
            style={{ objectPosition: image.focus ?? "50% 50%" }}
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
      <div className="col-start-1 row-start-1 flex min-w-0 flex-col justify-end p-4">
      {/* `pt-3` is what is left of a gap that used to separate this block from
          the chip and audience line above it. It is harmless under `justify-end`
          and kept because the block is not guaranteed to be the only child
          forever. */}
      <span className="relative pt-3">
        <span className="t-field block text-white/75">You build</span>
        {/* Two lines reserved: "Model serving on GPU cloud" fits one line in a
            four-across card where the other four take two, so without it that
            cover finished 25px short of the row. It costs nothing while the
            covers are ratio-bound and is the one thing keeping a row level if
            they stop being. `fill` needs no floor, since there the height is set
            by a sibling card. */}
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
