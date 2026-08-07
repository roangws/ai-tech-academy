"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";
import { ListIcon, XIcon } from "@phosphor-icons/react";
import { Logo } from "@/components/logo";
import { ButtonLink, Container, EnrollButton } from "@/components/ui";
import { nav } from "@/lib/content";

/**
 * Single-tier product header, 72px.
 *
 * ---------------------------------------------------- the frosting, round two
 *
 * The bar is translucent and frosted again, at Roan's request, but the blur is
 * on a layer inside the header rather than on the header.
 *
 * That is not a refactor, it is the whole point. An element carrying
 * `backdrop-filter` becomes a *backdrop root*: the boundary that any
 * backdrop-filter inside it can sample back to. With the filter on the
 * `<header>`, the three glass controls that live in the chrome could only
 * refract the inside of the header, which is empty, so the page's primary CTA
 * was the one control on the site that could never work. That is why the blur
 * came off entirely for one pass.
 *
 * A sibling layer solves both halves. The `<header>` itself carries no filter,
 * so it forms no backdrop root and the buttons sample the page. The blur layer
 * sits at `-z-10`, which in a stacking context paints after the element's own
 * background and before its in-flow content, so it is beneath the controls and
 * therefore *inside* their backdrop. The controls refract an already-frosted
 * bar, which is the correct optical order and the reason the CTA now reads as a
 * lens sitting on frosted glass rather than as a pill sitting on a blur.
 *
 * `supports-[backdrop-filter]` keeps the fallback honest: an engine without it
 * gets the opaque surface rather than a see-through bar with the page legible
 * through it.
 *
 * ------------------------------------------------------------- the liquid nav
 *
 * The current-section marker used to be a filled pill that appeared under one
 * item and disappeared from under another. There is one pill now and it travels
 * between them, and the travel is the effect Roan asked for: it stretches along
 * its direction of motion and thins across it, in proportion to how fast it is
 * going, so leaving one item and arriving at the next reads as one body of
 * liquid moving rather than as two states swapping.
 *
 * The stretch is derived from the spring's own velocity rather than animated on
 * a timeline, which is what keeps it honest: a short hop between neighbours
 * barely deforms, and a jump from Paths to FAQ visibly draws out. Nothing is
 * keyframed, so there is no duration to fall out of sync with the spring.
 *
 * `x` and `width` are motion values written straight to the compositor. React
 * re-renders only when the *target* changes, not on the frames between.
 *
 * -------------------------------------------------------------- what else is
 *
 * The docked search field was removed at Roan's request several passes ago,
 * along with the "/" focus shortcut, the shortcut hint and the icon button that
 * stood in for the field below md. The audience strip that used to sit above
 * this bar went with it, so this is the whole of the chrome: one 72px tier
 * carrying the lockup, five nav links and the primary control.
 */
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");
  const [hovered, setHovered] = useState<string | null>(null);

  /**
   * Bumped on resize, purely to re-run the pill's placement effect.
   *
   * The effect keyed only on which item was lit, so the pill measured once and
   * never again. Two ways that showed: at 1440 with Methodology lit, narrowing to
   * 1100 left a 116px lozenge hanging 100px past the end of the nav, under
   * nothing; and any resize across xl moved every item's `offsetLeft`, because the
   * link padding steps there, so the pill sat 16px left of and 8px narrower than
   * the item it was marking.
   *
   * The section tracker below has its own resize listener and it cannot do this
   * job: it only calls `setActive`, which is a no-op when the section on screen has
   * not changed, so `lit` never changes and the effect never re-runs.
   */
  const [remeasure, setRemeasure] = useState(0);

  const navRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  /** True once the pill has been placed, so its first appearance does not
      animate in from x=0 at the left edge of the nav. */
  const placed = useRef(false);

  const reduced = useReducedMotion();

  /* ------------------------------------------------------------ liquid pill */

  const spring = { stiffness: 420, damping: 34, mass: 0.8 };
  const x = useSpring(useMotionValue(0), spring);
  const width = useSpring(useMotionValue(0), spring);
  const opacity = useMotionValue(0);

  const velocity = useVelocity(x);
  /*
    Stretch along travel, thin across it. The divisors are the only tuned
    numbers here: 2600 px/s is roughly the speed of a hop between two adjacent
    nav items, so a neighbour move lands near 1.06 and the full width of the nav
    tops out at the 0.2 clamp. Past that it stops reading as liquid and starts
    reading as a rubber band.
  */
  const scaleX = useTransform(velocity, (v) => 1 + Math.min(Math.abs(v) / 2600, 0.2));
  const scaleY = useTransform(velocity, (v) => 1 - Math.min(Math.abs(v) / 9000, 0.14));

  /** Whichever item the pill should currently be sitting under. Hover wins over
      the section being read, because hover is the more recent intent. */
  const lit = hovered ?? (active ? `#${active}` : null);

  useEffect(() => {
    const host = navRef.current;
    if (!host) return;

    if (!lit) {
      opacity.set(0);
      placed.current = false;
      return;
    }

    const el = host.querySelector<HTMLElement>(`[data-nav="${CSS.escape(lit)}"]`);
    /*
      `offsetParent` as well as existence, because one item is `hidden` below xl
      now. A `display: none` element is still in the DOM and still matches, and it
      reports offsetLeft 0 and offsetWidth 0, so reading Methodology's geometry at
      1024 would put a zero-width pill at the left edge of the nav and leave it
      there, visible, for as long as that section was on screen.
    */
    if (!el || el.offsetParent === null) {
      opacity.set(0);
      // `placed` has to reset with it. Left true, the next item that does resolve
      // springs in from wherever the pill was parked instead of jumping to itself.
      placed.current = false;
      return;
    }

    // First placement jumps; every move after it springs. Without this the pill
    // slides in from the nav's left edge the first time a section is read.
    if (!placed.current || reduced) {
      x.jump(el.offsetLeft);
      width.jump(el.offsetWidth);
      placed.current = true;
    } else {
      x.set(el.offsetLeft);
      width.set(el.offsetWidth);
    }
    opacity.set(1);
  }, [lit, reduced, remeasure, x, width, opacity]);

  /*
    A resize re-measures the pill. `remeasure` rather than reading geometry here,
    so there is one place that decides where the pill goes; see the note on that
    state above for the two artefacts this fixes. The placement is a jump on
    resize, not a spring, because `placed` is irrelevant to a layout change and a
    pill springing across a nav while somebody drags a window edge is noise.
  */
  useEffect(() => {
    let frame = 0;
    function onResize() {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        placed.current = false;
        setRemeasure((n) => n + 1);
      });
    }
    window.addEventListener("resize", onResize);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  /* --------------------------------------------------------- mobile menu a11y */

  const closeMenu = useCallback(() => {
    setOpen(false);
    toggleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;

    /*
      A menu that covers the page has to behave like one. Before this, opening
      it left focus on the toggle, seven tabs walked the panel and the eighth
      escaped into the hero underneath, which was still there and still
      focusable behind `body { overflow: hidden }`. Escape then dropped focus
      wherever it happened to be in that background content.

      So: focus moves in on open, Tab cycles inside the panel, and Escape and a
      link click both hand focus back to the button that opened it.
    */
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>("a, button");
    first?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeMenu();
        return;
      }
      if (e.key !== "Tab" || !panel) return;

      const stops = Array.from(
        panel.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
      ).filter((el) => el.offsetParent !== null);
      if (stops.length === 0) return;

      const edge = e.shiftKey ? stops[0] : stops[stops.length - 1];
      const wrap = e.shiftKey ? stops[stops.length - 1] : stops[0];
      // The toggle stays reachable as the step before the first stop, so the
      // cycle is panel plus the control that owns it.
      if (document.activeElement === edge) {
        e.preventDefault();
        wrap.focus();
      } else if (document.activeElement === toggleRef.current && !e.shiftKey) {
        e.preventDefault();
        stops[0].focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeMenu]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /*
    Current-section tracking, computed from scroll position rather than from an
    IntersectionObserver.

    The observer version was wrong twice over. It fires only when an
    intersection changes, so a jump straight to the top of the page produced no
    entry for sections that were outside the band both before and after, and the
    rule kept marking whatever had been read last. Reading the geometry on
    scroll is deterministic: the same scroll position always resolves to the
    same section.

    The line that counts as "being read" sits just under the sticky chrome.
    Above the first section the rule clears, which is correct, since the hero
    belongs to no nav item.
  */
  useEffect(() => {
    const ids = nav
      .map((n) => n.href.replace("#", ""))
      .filter((id) => document.getElementById(id));
    if (ids.length === 0) return;

    let frame = 0;

    function measure() {
      const line = window.scrollY + 88 + 24;
      let current = "";
      // Sections are read in document order, so the last one whose top has
      // passed the line is the one being read.
      ids
        .map((id) => ({ id, top: document.getElementById(id)!.offsetTop }))
        .sort((a, b) => a.top - b.top)
        .forEach(({ id, top }) => {
          if (top <= line) current = id;
        });
      setActive(current);
    }

    function onScroll() {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        measure();
      });
    }

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80">
      {/*
        The frosted layer. Sibling to the content, never an ancestor of it: see
        the backdrop-root note at the head of this file. `-z-10` resolves inside
        the header because a sticky element with a z-index forms a stacking
        context.
      */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 -z-10 transition-colors duration-200 supports-[backdrop-filter]:[-webkit-backdrop-filter:blur(16px)_saturate(180%)] supports-[backdrop-filter]:[backdrop-filter:blur(16px)_saturate(180%)] ${
          open || scrolled
            ? "bg-surface supports-[backdrop-filter]:bg-surface/78"
            : "bg-surface supports-[backdrop-filter]:bg-surface/62"
        }`}
      />

      {/* `lg:gap-3` rather than `lg:gap-6`. Twelve of the ninety-five pixels the
          sixth nav item needs at 1024; content.ts has the rest of the accounting.
          `ml-auto` on the controls means only the first of these gaps is ever
          spent, so this is a straight 12px. */}
      <Container className="flex h-[72px] items-center gap-3 sm:gap-4 lg:gap-3 xl:gap-6">
        {/*
          The lockup carries its descriptor line here. It fits because the
          search field released roughly 300px of the row, and the two stacked
          lines measure 41px inside a 72px bar. Below sm the wordmark drops to
          the short brand; logo.tsx has the note on why it is no longer dropped
          altogether.
        */}
        <Logo size={36} descriptor compact />

        {/*
          All five links, at every width from lg up.

          Two of them used to wait for xl, because the row once carried a search
          field and the full set measured 1050px against a 1024px viewport. The
          field went several passes ago, so hiding Course and Methodology below
          xl was a rule outliving its reason, and it hid them at exactly the
          width where a reader is most likely to be using the nav to move
          around.
        */}
        <nav
          ref={navRef}
          aria-label="Primary"
          className="relative hidden items-center gap-0 lg:flex xl:gap-0.5"
          onMouseLeave={() => setHovered(null)}
        >
          {/* The travelling pill. `aria-hidden` because the item it is under
              already carries `aria-current`, and a screen reader has no use for
              a decoration that moves. */}
          <motion.span
            aria-hidden="true"
            style={{ x, width, scaleX, scaleY, opacity }}
            className="pointer-events-none absolute left-0 top-0 -z-10 h-full rounded-full bg-accent-tint ring-1 ring-inset ring-accent/10"
          />

          {nav.map((item) => {
            const current = active === item.href.replace("#", "");
            const isLit = lit === item.href;
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                data-nav={item.href}
                aria-current={current ? "true" : undefined}
                onMouseEnter={() => setHovered(item.href)}
                onFocus={() => setHovered(item.href)}
                onBlur={() => setHovered(null)}
                /* `px-2` below xl, down from `px-3`. Six labels at lg need 24px
                   back from somewhere and this is the cheapest of the four places
                   it came from; content.ts has the whole measurement. The pill
                   still clears the type, because it takes its width from the item
                   rather than from a number. */
                className={`t-nav relative rounded-full px-2 py-2 no-underline transition-colors duration-200 xl:px-3.5 ${
                  isLit ? "text-accent" : "text-ink-secondary"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/*
          `ml-auto` at every width, and nothing after it. This read `ml-auto
          ... md:ml-5` once, and `ml-5` at md simply replaced `ml-auto`: same
          property, later breakpoint, so from 768px the controls stopped being
          pushed right and sat 20px after the nav, leaving roughly 230px of
          empty bar on a 1440 viewport.
        */}
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
          {/* Sign in is a control, not a text link floating beside a button. It
              was the only affordance in the chrome with no shape, which read as
              an afterthought next to a filled pill.

              Wrapped rather than given `hidden` directly: `ButtonLink` sets
              `inline-flex` in its own base class, and which of two competing
              display utilities wins is decided by the order Tailwind emits
              them, not by the attribute. `inline-flex` won once and this
              control rendered at 390px next to the hamburger. */}
          {/* `max-xl:px-4`, 8px a side, on both controls. Sixteen of the
              ninety-five the sixth nav item needs at 1024, and the last place they
              could come from that is not a route to something: hiding Sign in
              between lg and xl would leave it unreachable, because the mobile panel
              that also carries it stops at lg. content.ts has the accounting. */}
          <div className="hidden lg:block">
            <ButtonLink href="/sign-in" tone="secondary" size="md" className="max-xl:px-4">
              Sign in
            </ButtonLink>
          </div>

          {/* The primary CTA stays visible at every width, and carries the label
              alone: the dated second line is for the body of the page, where a
              reader is deciding. `EnrollButton` owns that split.

              It runs a size down below sm: at 320px the lockup, this control and
              the menu button measured 320 inside a 288px content box, and the
              document grew a horizontal scrollbar. `h-11` rather than `h-10`,
              because 40px is under the 44px target the rest of the page holds and
              height was never what overflowed at 320 — the padding was. */}
          <EnrollButton
            size="md"
            className="max-xl:px-4 max-sm:h-11 max-sm:px-3.5 max-sm:text-[13px]"
          />

          <button
            ref={toggleRef}
            type="button"
            onClick={() => (open ? closeMenu() : setOpen(true))}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface/70 text-ink ring-1 ring-inset ring-ink/10 sm:h-10 sm:w-10 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <XIcon size={20} /> : <ListIcon size={20} />}
          </button>
        </div>
      </Container>

      {open ? (
        <div
          id="mobile-nav"
          ref={panelRef}
          className="border-t border-line bg-surface lg:hidden"
        >
          <Container className="py-4">
            <nav aria-label="Primary, mobile" className="flex flex-col">
              {nav.map((item) => (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  onClick={closeMenu}
                  className="t-card-title border-b border-line py-3.5 text-ink no-underline"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            {/* The label alone, like the bar it belongs to. This panel is the main
                menu at the widths that have one, and Roan's split puts the date on
                the controls in the body of the page rather than on the chrome.

                It is also the reason `EnrollButton` has a branch that never touches
                the clock. This is the one call site inside a client component, and
                a `new Date()` rendered here would be evaluated once on the server
                and again during hydration. */}
            <div className="mt-4 flex flex-col gap-2.5 pb-1">
              <EnrollButton onClick={closeMenu} />
              <ButtonLink href="/sign-in" tone="secondary" onClick={closeMenu}>
                Sign in
              </ButtonLink>
            </div>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
