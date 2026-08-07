"use client";

import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * The liquid-glass button.
 *
 * Second pass, after Roan reported three separate faults on the first install:
 * the glass was not refracting anything, the button flickered under the cursor,
 * and the effect ignored where the pointer was. All three had causes, and two
 * of them were the same cause wearing different clothes.
 *
 * ---------------------------------------------------------------- the effect
 *
 * `backdrop-filter` samples the *backdrop root*, and the backdrop root is not
 * simply "the page behind this element". It is the nearest ancestor that forms
 * one, and per Filter Effects 2 an ancestor forms one as soon as it carries
 * `filter`, `opacity` below 1, a mask, `mix-blend-mode`, or `isolation:
 * isolate`.
 *
 * The first pass put `isolate` on the button root, to contain the decorative
 * layers' negative z-index. That is exactly the last item on that list. So the
 * backdrop root became the button itself, the refraction layer sampled the
 * inside of a button that has nothing painted in it, and the filter dutifully
 * refracted nothing. The rim shadows still drew, which is why it looked like a
 * pill with a nice edge and no glass in it.
 *
 * `relative z-0` replaces it. A positioned element with a numeric z-index forms
 * a stacking context, which is all that was ever needed to keep `-z-10`
 * children inside the button, and a stacking context is *not* on the list
 * above. The backdrop root goes back to being the page.
 *
 * The same rule is why the sticky header stopped being frosted. `.glass` put
 * `backdrop-filter` on the header, and an element with a backdrop-filter forms
 * a backdrop root too, so every control inside the header could only refract
 * the header. site-header.tsx has that note.
 *
 * Nothing on the root may carry `filter`, `opacity`, `mix-blend-mode` or
 * `isolation` for the same reason, which is why hover lift here is a box-shadow
 * and a gradient overlay rather than the obvious `hover:brightness-110`.
 *
 * ------------------------------------------------------------- the flickering
 *
 * `hover:scale-105` on the root. A `backdrop-filter` descendant has to
 * re-sample and re-rasterise its entire backdrop on every frame that any
 * ancestor transform changes, and with an SVG displacement map in the chain
 * that is a filter graph per frame. The compositor drops and rebuilds the layer
 * as it goes, which is seen as flicker.
 *
 * There is no transform on this button at any state now. Press and hover are
 * carried by shadow and by the light layers, which composite without
 * invalidating the backdrop sample.
 *
 * --------------------------------------------------------- the pointer, and
 *
 * ...what Roan actually asked for: the glass should respond to where the mouse
 * is. `onPointerMove` writes the cursor position into `--gx` / `--gy` as CSS
 * custom properties directly on the element, so the specular highlight tracks
 * the pointer without React re-rendering anything. Two layers read those:
 * a tight white core, and a wide soft bloom that reaches past the button edge.
 * Together they read as a light source moving across a curved surface.
 *
 * ------------------------------------------------------------ the fallback
 *
 * The refraction is `backdrop-filter: url(#liquid-glass)`, which Safari does
 * not implement. An unsupported value invalidates the whole declaration, so on
 * Safari that layer would simply be nothing, and the button would go back to
 * being a flat pill. So the frost is a separate layer underneath carrying plain
 * `blur() saturate()`, which every engine has. Safari gets real frosted glass;
 * engines that support the filter get frosted glass with the lens on top.
 *
 * The two stack rather than combine because a backdrop-filter samples whatever
 * has already painted beneath it, and the frost layer paints first.
 *
 * ------------------------------------------------------------------ adapted
 *
 * The supplied file is a shadcn drop-in built on `bg-primary`,
 * `text-primary-foreground`, `border-input` and `ring-ring`, none of which
 * exist in this project's Tailwind v4 theme. The structure, the shadow stacks
 * and the SVG filter are the reference's; the colours are remapped onto the
 * tokens this page has. Its plain `Button` and `MetalButton` are left out: both
 * are built entirely from the missing tokens and neither is used here.
 *
 * `asChild` is why the Radix Slot dependency earns its place. Every control on
 * this page is a Next `<Link>`, and Slot puts the glass on the anchor itself
 * instead of nesting a button in a link.
 */
const liquidButtonVariants = cva(
  /*
    `z-0`, not `isolate`. See the note above; this one class is the difference
    between a glass button and a pill with a nice edge.
  */
  /*
    No `outline-none`, and no focus ring of its own.

    Both were in the reference and both had to go. `outline-none` is a Tailwind
    utility and the page's own focus rule lives in `@layer base`, so at equal
    specificity the utility won and every glass control on the page lost the
    3px `--focus` outline that the other forty controls get. What replaced it
    was `ring-accent/50`, which computes to 2.42:1 against the header and
    2.10:1 against the button's own fill: both under the 3:1 that SC 1.4.11
    asks for on a focus indicator. The page's own outline is already correct and
    already consistent, so this now simply lets it through.
  */
  "group/glass relative z-0 inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 " +
    "whitespace-nowrap rounded-full font-medium no-underline " +
    "transition-shadow duration-200 ease-out " +
    "disabled:pointer-events-none disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /**
         * Glass over whatever is behind it. The reference's own default.
         *
         * `hover:text-accent` is not decoration. This variant is the enrol control
         * on four of the five catalog cards, and its hover was `bg-white/35` going
         * to `bg-white/55` over a white card: a pixel diff across the face of the
         * pill measured zero, so the only thing that changed was a drop shadow
         * behind the control the cursor was on. Next to a filled blue button on the
         * fifth card it read as the one that could not be pressed. The label going
         * accent, with the tint going to `--accent-tint` below, is feedback a
         * reader can see without spending a second saturated fill on a band that
         * already has one.
         */
        default: "text-ink hover:text-accent hover:shadow-[0_8px_24px_rgb(16_24_32/0.10)]",
        /** The page's primary control. `--accent` moved onto the glass tint. */
        accent: "text-white hover:shadow-[0_10px_28px_rgb(10_63_224/0.30)]",
        /** For a dark panel, where a pale fill is the primary control. */
        onDark: "text-ink hover:shadow-[0_10px_28px_rgb(0_0_0/0.35)]",
      },
      size: {
        sm: "h-9 gap-1.5 px-4 text-[13px]",
        md: "h-11 px-6",
        lg: "h-12 px-7",
        xl: "h-14 px-10",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

/**
 * The tint, on a layer of its own above both filtered layers.
 *
 * Three placements were tried and the order matters more than the value.
 *
 * `bg-accent` on the button root is where it started, and an opaque fill is why
 * this never looked like glass: there is no such thing as a lens you cannot see
 * through.
 *
 * Moving it onto the frost layer fixed that and introduced a worse fault. A
 * backdrop-filter samples everything already painted beneath it, so with the
 * tint underneath, the refraction layer was displacing the *button's own fill*
 * rather than the page behind it. The displacement map pushed the fill's edge
 * in and out by up to 24px, and the result was a pill with a rippling outline,
 * which is the artifact Roan called a defect. Glass distorts what is behind it.
 * It does not distort its own rim.
 *
 * So the tint is a plain background on an unfiltered layer above the two
 * filtered ones. Its edge is a crisp `rounded-full`, the refraction beneath it
 * works on the page, and what shows through the tint is a lensed backdrop.
 *
 * 90% on the accent is the contrast floor rather than a taste call. White on
 * `#0a3fe0` at 90% over white computes to 6.20:1, which clears AA with room for
 * the white body highlight that paints over it. It ran at 85% for one pass,
 * which is 4.39:1 and fails.
 *
 * The accent variant also gets a quieter body highlight than the clear glass
 * does, for the same reason the base colour was deepened: a `from-white/35`
 * wash over a saturated fill is how a blue button turns lavender.
 */
const TINTS = {
  default: "bg-white/35",
  accent: "bg-accent/90",
  onDark: "bg-white/85",
} as const;

/**
 * Hover, which is a colour change now rather than only a shadow.
 *
 * The button lifted on hover with a drop shadow and nothing else, which on a
 * saturated fill is close to no feedback at all: the shadow is behind the
 * control and the control is the thing the cursor is on. `--accent-hover` is
 * the same blue two steps down in lightness, so pressing toward it reads as the
 * surface taking the weight of the pointer.
 *
 * The accent goes fully opaque on hover, and that is a correction rather than a
 * tweak. Roan's report was that pointing at the primary control turned it a pale
 * blue-white, which is the opposite of what hover here is meant to say, and two
 * things were making it happen at once: the tint stopped at 95% so the frosted
 * white page behind it still showed through, and the pointer light above it
 * painted a 0.55 white core across the middle of the pill. Together they lifted
 * a saturated blue toward white at exactly the moment the cursor arrived.
 *
 * At 100% the tint is `#0832b4`, which is unambiguously a darker blue than the
 * resting fill: measured through the whole stack the face of the pill goes
 * rgb(41,88,229) to rgb(21,61,184), a 47% drop in luminance, and white on it goes
 * from 5.8:1 to 8.8:1. Not `#0832b4` exactly, because the body highlight and the
 * pointer light are both `-z-10` after the tint in DOM order and still paint over
 * it, which is what keeps it reading as glass rather than as a flat pill.
 *
 * `default` gets the accent tint rather than more white. Its old hover was
 * `bg-white/35` to `bg-white/55` on a white card, which is invisible; see the note
 * on the variant itself. See GLOW below for the other half of the accent fix.
 */
const TINT_HOVER = {
  default: "group-hover/glass:bg-accent-tint/85",
  accent: "group-hover/glass:bg-accent-hover",
  onDark: "group-hover/glass:bg-white/95",
} as const;

/**
 * How hard the pointer light burns, per variant.
 *
 * One value for all three was the second half of the pale-hover fault. A 0.55
 * white core is right on clear glass, where the light is the whole effect and
 * there is nothing underneath for it to wash out. On a saturated fill it is a
 * spotlight on a blue surface, and the surface loses.
 *
 * The accent keeps a specular, because a lens with no highlight is a pill, but
 * at a quarter of the strength: enough to read as light moving across a curved
 * face, not enough to move the fill's hue. `onDark` sits between them, since a
 * white pill on an ink panel can take some light without changing colour.
 */
const GLOW = {
  default: { core: 0.55, bloom: 0.22 },
  accent: { core: 0.14, bloom: 0.06 },
  onDark: { core: 0.4, bloom: 0.16 },
} as const;

/** Per-variant body highlight. See the note at TINTS. */
const SHEEN = {
  default: "bg-linear-to-b from-white/35 via-white/5 to-white/15",
  accent: "bg-linear-to-b from-white/14 via-transparent to-white/8",
  onDark: "bg-linear-to-b from-white/30 via-white/5 to-white/10",
} as const;

/**
 * The rim, verbatim from the reference.
 *
 * Light and dark are two different stacks rather than one with swapped
 * opacities: the light one draws its edge in black at 0.9 and 0.85, which is
 * what produces the dark glass lip, and the dark one draws the same edge in
 * white. Getting this backwards is what made the first hand-built attempt look
 * like a soft pill instead of a lens.
 */
const RIM_LIGHT =
  "shadow-[0_0_6px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3px_rgba(0,0,0,0.9),inset_-3px_-3px_0.5px_-3px_rgba(0,0,0,0.85),inset_1px_1px_1px_-0.5px_rgba(0,0,0,0.6),inset_-1px_-1px_1px_-0.5px_rgba(0,0,0,0.6),inset_0_0_6px_6px_rgba(0,0,0,0.12),inset_0_0_2px_2px_rgba(0,0,0,0.06),0_0_12px_rgba(255,255,255,0.15)]";

const RIM_DARK =
  "shadow-[0_0_8px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3.5px_rgba(255,255,255,0.5),inset_-3px_-3px_0.5px_-3.5px_rgba(255,255,255,0.85),inset_1px_1px_1px_-0.5px_rgba(255,255,255,0.6),inset_-1px_-1px_1px_-0.5px_rgba(255,255,255,0.6),inset_0_0_6px_6px_rgba(255,255,255,0.12),inset_0_0_2px_2px_rgba(255,255,255,0.06),0_0_12px_rgba(0,0,0,0.15)]";

type Variant = keyof typeof TINTS;

export function LiquidButton({
  className,
  variant,
  size,
  asChild = false,
  children,
  style,
  onPointerMove,
  onPointerLeave,
  onPointerCancel,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof liquidButtonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  const v: Variant = (variant ?? "default") as Variant;
  const rim = v === "accent" ? RIM_DARK : RIM_LIGHT;

  /*
    Written straight onto the node, not into state.

    A pointermove fires at frame rate, and routing it through `useState` would
    re-render this component and every child of the link on every one of those
    frames, to move a gradient. Custom properties are read by the layers below
    at paint time, so the browser does the work it was going to do anyway and
    React never hears about it.
  */
  const track = React.useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    // Mouse and pen only. A finger has no hover, so on touch this fires once
    // at the tap point and lights a highlight the reader never asked for and
    // cannot move; `pointercancel` below is the other half of that story.
    if (e.pointerType === "touch") return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--gx", `${e.clientX - r.left}px`);
    el.style.setProperty("--gy", `${e.clientY - r.top}px`);
    el.style.setProperty("--glow", "1");
  }, []);

  const release = React.useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.style.setProperty("--glow", "0");
  }, []);

  return (
    <Comp
      data-slot="button"
      className={cn(liquidButtonVariants({ variant, size }), className)}
      style={
        {
          "--gx": "50%",
          "--gy": "50%",
          "--glow": "0",
          ...style,
        } as React.CSSProperties
      }
      onPointerMove={(e: React.PointerEvent<HTMLButtonElement>) => {
        track(e);
        onPointerMove?.(e);
      }}
      onPointerLeave={(e: React.PointerEvent<HTMLButtonElement>) => {
        release(e);
        onPointerLeave?.(e);
      }}
      /* A tap that turns into a scroll fires `pointercancel`, and whether a
         `pointerleave` follows it is not uniform across engines. Without this
         the highlight can be left switched on with nothing to turn it off. */
      onPointerCancel={(e: React.PointerEvent<HTMLButtonElement>) => {
        release(e);
        onPointerCancel?.(e);
      }}
      {...props}
    >
      {/*
        Layer order, and why it is not the reference's.

        The reference puts the rim at `z-0` and the label at `z-10`, which works
        because it always owns its own label. This one is used with `asChild` at
        every call site, so the label is not ours: Radix slots it in as a bare
        child of the anchor and there is no element to raise.

        All five decorative layers sit at `-z-10` instead. In a stacking context
        the negative-index children paint after the element's own background and
        before its in-flow content, so the order comes out frost, refraction,
        tint, body highlight, pointer light, rim, then the label, with no
        wrapper on the label at all. DOM order settles the six among themselves.

        `Slottable` is the other half. `Slot` accepts exactly one element child
        and there are seven here, so without it the page 500s with "Slot failed
        to slot onto its children" the moment `asChild` is used.
      */}

      {/* 1. Frost. Plain blur and saturate, which every engine implements, so
             Safari still gets glass. 6px rather than 12: the refraction above
             it has to have something left to refract. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 rounded-full [-webkit-backdrop-filter:blur(6px)_saturate(170%)] [backdrop-filter:blur(6px)_saturate(170%)]"
      />

      {/* 2. Refraction, over the frost and under the tint. Dropped whole by
             engines without `url()` support in backdrop-filter, which is the
             intended degradation rather than a bug. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-full"
        style={{ backdropFilter: 'url("#liquid-glass")' }}
      />

      {/* 3. The tint, unfiltered, so the pill keeps a crisp edge. See the note
             at TINTS for why this is not on the frost layer, and the one at
             TINT_HOVER for why hover darkens it. */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 rounded-full transition-colors duration-200 ease-out",
          TINTS[v],
          TINT_HOVER[v],
        )}
      />

      {/* 4. The fixed body highlight: light from above, the way a curved
             surface catches a room. Static, so the button still reads as glass
             before anyone touches it. Per-variant, because the wash that makes
             clear glass read as glass makes a saturated fill read as lavender. */}
      <span
        aria-hidden="true"
        className={cn("pointer-events-none absolute inset-0 -z-10 rounded-full", SHEEN[v])}
      />

      {/*
        5. The pointer light. Two stops on one gradient: a tight core that says
        where the cursor is, and a wide bloom that says the whole surface is
        curved. `--glow` fades the pair in and out, so a button nobody is
        pointing at costs nothing to paint.
      */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 rounded-full transition-opacity duration-300 ease-out"
        style={{
          opacity: "var(--glow)",
          background:
            `radial-gradient(60px circle at var(--gx) var(--gy), rgb(255 255 255 / ${GLOW[v].core}), transparent 65%),` +
            `radial-gradient(160px circle at var(--gx) var(--gy), rgb(255 255 255 / ${GLOW[v].bloom}), transparent 70%)`,
        }}
      />

      {/*
        6. The rim. `transition-all` is on it in the reference and stays: the
        shadow stack settles with the hover shadow on the root rather than
        snapping to it.
      */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 rounded-full transition-all",
          rim,
        )}
      />

      <Slottable>{children}</Slottable>
    </Comp>
  );
}

/**
 * The filter, mounted once per document from the root layout.
 *
 * Retuned from the reference's values, which are written for a 56px control and
 * were producing the artifact Roan described as a defect. `scale="70"` on a
 * 44px button displaces the backdrop by more than half the control's own
 * height, and `baseFrequency="0.05"` puts roughly two noise cells across it, so
 * what arrives is not a lens but two large blobs swimming in the middle of the
 * button.
 *
 * A lens distorts most at its edge and least at its centre, and it distorts
 * smoothly. The frequency is down an order of magnitude so one cell is wider
 * than the button, which turns the map from a pattern into a gradient across
 * the face; a second octave puts fine structure back on top of it; and the
 * displacement is down to 24, which is visible against type moving underneath
 * without tearing it.
 *
 * The final blur is 1 rather than 4. The frost layer beneath this one is
 * already doing 10px of Gaussian, so a second heavy blur here only ate the
 * refraction it had just drawn.
 *
 * The region runs 25% past the element on each side. A displacement map pulls
 * pixels in from outside the box, and at the reference's tight 100% region
 * there is nothing out there to pull, so the edges sampled transparent black
 * and the rim developed a dark fringe.
 */
export function GlassFilter() {
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute h-0 w-0">
      <defs>
        <filter
          id="liquid-glass"
          x="-25%"
          y="-25%"
          width="150%"
          height="150%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.006 0.009"
            numOctaves={2}
            seed={4}
            result="turbulence"
          />
          <feGaussianBlur in="turbulence" stdDeviation="1.5" result="blurredNoise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="blurredNoise"
            scale="24"
            xChannelSelector="R"
            yChannelSelector="B"
            result="displaced"
          />
          <feGaussianBlur in="displaced" stdDeviation="1" result="finalBlur" />
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  );
}

export { liquidButtonVariants };
