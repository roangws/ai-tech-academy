"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { CoursesMenu } from "@/components/lms/courses-menu";
import { ButtonLink, Container, EnrollButton } from "@/components/ui";
import { Avatar } from "@/components/lms/avatar";
import { nav } from "@/lib/content";
import type { Course } from "@/lib/catalog";

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
 * carrying the lockup, six nav links and the primary control.
 */
/**
 * Who is signed in, if anyone.
 *
 * Passed down from the `(site)` layout, which is a server component and can read
 * the session. This header is a client component — scroll-spy, the motion pill,
 * the drawer — so it cannot read cookies itself, and the alternative (a client
 * Supabase call on mount) would flash "Sign in" at every signed-in reader on
 * every page load before correcting itself.
 */
export type HeaderViewer = {
  name: string;
  email: string | null;
  avatarUrl: string | null;
};

export function SiteHeader({
  viewer = null,
  /* The catalogue, resolved by the (site) layout. See the note on CoursesMenu:
     this is a client component and can no longer import the course list. */
  courses = [],
}: {
  viewer?: HeaderViewer | null;
  courses?: readonly Pick<Course, "id" | "slug" | "title" | "badge" | "level" | "duration">[];
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");
  const [hovered, setHovered] = useState<string | null>(null);

  const pathname = usePathname();

  /*
    Off the homepage there is no section being read, so `active` is ignored
    rather than cleared.

    Clearing it meant a `setActive("")` on the first line of the effect, which is
    a set-state directly inside an effect: one guaranteed extra render on every
    client navigation, and the lint rule that names it was failing the build.
    Deriving it here reaches the same place with no render and no write, and the
    stale value simply never surfaces: `onHome` gates both readers of it, so a
    section left underlined on the way out of the homepage cannot carry
    `aria-current` onto a course page.
  */
  const onHome = pathname === "/";


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

  /**
   * Whichever item the pill should currently be sitting under. Hover wins over
   * the section being read, because hover is the more recent intent.
   *
   * Both of the resting cases resolve to a real `href` from `nav`, because that
   * is what `data-nav` carries and what the placement effect queries on. This
   * read `#${active}` and the hrefs became root-absolute (`/#outcomes`), so the
   * two stopped matching and the pill only ever appeared under the cursor: on
   * scroll the querySelector found nothing and the pill was held at opacity 0.
   * `aria-current` never broke with it, which is why the regression was silent.
   *
   * The route case is the new one. `/review-judge-board` has no fragment for the
   * scroll tracker to find, so it is lit from the path instead.
   */
  const activeHref = onHome && active
    ? (nav.find((n) => n.href.split("#")[1] === active)?.href ?? null)
    : null;
  const routeHref = onHome ? null : (nav.find((n) => n.href === pathname)?.href ?? null);
  const lit = hovered ?? activeHref ?? routeHref;

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
  /*
    `split("#")[1]`, not `replace("#", "")`.

    The nav hrefs became root-absolute when the site got a second real route, so
    they read `/#outcomes` rather than `#outcomes`. Stripping the hash off that
    yields "/outcomes", which matches no element, so every id was filtered out
    here and the tracker silently stopped running on the one page it works on.
    Taking the fragment is correct for both spellings.

    THE PATHNAME GATE IS WHAT MAKES THIS SAFE OFF THE HOMEPAGE, and the
    `length === 0` bail was not.

    That bail assumed a course page carries none of these six ids. It carries
    two: `MoreCourses` renders `<Section id="courses">` and `Questions` renders
    `<Section id="faq">`, both named after homepage sections because that is what
    they are the course-page equivalent of. So `ids` came back with two entries,
    the listener installed, and scrolling /courses/gtm to the cross-sell put
    `aria-current="true"` on a nav link whose href is `/#courses` — the header
    announcing a current location on a different page, which is worse than no
    tracking at all.

    Every id in `nav` names a homepage section, so the homepage is the only route
    where any of this means anything. Gating on the route says that directly
    instead of inferring it from a collision that already happened once.
  */
  useEffect(() => {
    if (!onHome) return;

    const ids = nav
      .map((n) => n.href.split("#")[1])
      .filter((id): id is string => Boolean(id) && Boolean(document.getElementById(id)));
    if (ids.length === 0) return;

    let frame = 0;

    function measure() {
      const line = window.scrollY + 88 + 24;
      let current = "";
      // Sections are read in document order, so the last one whose top has
      // passed the line is the one being read.
      /*
        Null-checked rather than asserted. `ids` is filtered for existence once,
        at effect time, but this runs on every scroll frame: a section that
        unmounts between the two is a null here, and the non-null assertion this
        replaces turned that into an uncaught TypeError on every frame.
      */
      ids
        .map((id) => ({ id, el: document.getElementById(id) }))
        .filter((s): s is { id: string; el: HTMLElement } => s.el !== null)
        .map(({ id, el }) => ({ id, top: el.offsetTop }))
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
    /* `onHome` rather than `pathname`: it is what the effect actually branches
       on, and it only changes when the route crosses in or out of the homepage,
       so navigating between two course pages no longer tears the listener down
       and builds it again for the same answer. */
  }, [onHome]);

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
          All six links, at every width from lg up.

          Two of them used to wait for xl, because the row once carried a search
          field and the full set measured 1050px against a 1024px viewport. The
          field went several passes ago, so hiding the last two below xl was a
          rule outliving its reason, and it hid them at exactly the width where a
          reader is most likely to be using the nav to move around.

          The two were labelled "Course" and "Methodology" at the time and
          neither label exists now: "Course" was renamed and then merged away,
          and "Methodology" is "Method". content.ts has that history. They are
          named here as they were, so this reads as a record of what happened
          rather than as a description of the current row.
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
            /* A section item is current when its section is on screen and we
               are on the homepage; a route item is current when it is the page
               you are on. Both spellings live in `nav` now. */
            const fragment = item.href.split("#")[1];
            const current = fragment
              ? onHome && active === fragment
              : pathname === item.href;
            const isLit = lit === item.href;

            /* The one item with the five courses under it. Rebuilt after the
               first version turned out to be unclickable on a pointer device —
               the note in courses-menu.tsx has the whole of why. */
            if (item.href === "/courses") {
              return (
                <CoursesMenu
                  key={item.href + item.label}
                  href={item.href}
                  label={item.label}
                  current={current || isLit}
                  courses={courses}
                />
              );
            }

            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                data-nav={item.href}
                aria-current={current ? "true" : undefined}
                onMouseEnter={() => setHovered(item.href)}
                onFocus={() => setHovered(item.href)}
                onBlur={() => setHovered(null)}
                /* `px-2` below xl, down from `px-3`, which is where content.ts
                   says the 24px came from and why.

                   `whitespace-nowrap` is new and it is the cheap insurance. When
                   the row briefly carried seven items, the widest label wrapped
                   to two lines inside a 36px pill, which is not a narrower nav
                   item: it is a 56px one in a 72px bar, and it reads as a broken
                   header rather than as a full one. A nav item should overflow
                   visibly and be fixed, never wrap quietly. */
                className={`t-nav relative whitespace-nowrap rounded-full px-2 py-2 no-underline transition-colors duration-200 xl:px-3.5 ${
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
          {/*
            SIGNED IN, THE CHROME CHANGES.

            "Sign in" and "Enroll for free" are both offers to someone who has
            not accepted one. Showing them to a reader who is signed in is the
            site failing to notice its own user — and worse, "Enroll for free"
            sent them to /sign-up, which the proxy bounces straight back to
            /dashboard, so the most prominent control in the chrome was a loop.

            So the pair is replaced by the two things a signed-in reader wants:
            their courses, and their account.
          */}
          {viewer ? (
            <>
              <div className="hidden lg:block">
                <ButtonLink href="/dashboard" tone="secondary" size="md" className="max-xl:px-4">
                  My courses
                </ButtonLink>
              </div>
              <Link
                href="/account"
                aria-label="Your account"
                title={viewer.email ?? "Your account"}
                className="rounded-full outline-none ring-offset-2 transition-shadow hover:ring-2 hover:ring-line-strong focus-visible:ring-2 focus-visible:ring-[color:var(--focus)]"
              >
                <Avatar
                  name={viewer.name}
                  email={viewer.email}
                  url={viewer.avatarUrl}
                  size={36}
                />
              </Link>
            </>
          ) : (
            <>
              <div className="hidden lg:block">
                <ButtonLink href="/sign-in" tone="secondary" size="md" className="max-xl:px-4">
                  Sign in
                </ButtonLink>
              </div>

              {/* The primary CTA stays visible at every width, and carries the
                  label alone: the dated second line is for the body of the page,
                  where a reader is deciding. `EnrollButton` owns that split.

                  It runs a size down below sm: at 320px the lockup, this control
                  and the menu button measured 320 inside a 288px content box, and
                  the document grew a horizontal scrollbar. `h-11` rather than
                  `h-10`, because 40px is under the 44px target the rest of the
                  page holds and height was never what overflowed at 320 — the
                  padding was. */}
              <EnrollButton
                size="md"
                className="max-xl:px-4 max-sm:h-11 max-sm:px-3.5 max-sm:text-[13px]"
              />
            </>
          )}

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

      {/*
        MOUNTED ALWAYS, HIDDEN WHEN CLOSED, and it was `{open ? … : null}`.

        The toggle above carries `aria-controls="mobile-nav"`, which is a promise
        that an element with that id exists — and while the menu was closed, which
        is every state a reader meets it in first, nothing did. A dangling
        `aria-controls` is not inert: assistive technology resolves the id at the
        moment the button is announced, finds nothing, and the relationship the
        attribute exists to state is simply absent.

        `hidden` gives the same result the conditional did — out of the layout,
        out of the tab order, out of the accessibility tree — while keeping the
        node in the document for the id to point at. This is already the pattern
        the courses dropdown uses; the two panels just disagreed.

        The class list stays free of a `display` utility on purpose. `[hidden]`
        is a UA rule of `display: none`, and any `block`/`flex` class here would
        outrank it and leave the panel permanently open. `lg:hidden` is a
        `@media` variant of the same property and only ever hides, so it is safe.
      */}
      <div
        id="mobile-nav"
        ref={panelRef}
        hidden={!open}
        className="border-t border-line bg-surface lg:hidden"
      >
          <Container className="py-4">
            <nav aria-label="Primary, mobile" className="flex flex-col">
              {nav.map((item) => (
                <div key={item.href + item.label} className="border-b border-line">
                  <Link
                    href={item.href}
                    onClick={closeMenu}
                    className="t-card-title block py-3.5 text-ink no-underline"
                  >
                    {item.label}
                  </Link>

                                  </div>
              ))}
            </nav>
            {/* The label alone, like the bar it belongs to. This panel is the main
                menu at the widths that have one, and Roan's split puts the date on
                the controls in the body of the page rather than on the chrome.

                It is also the reason `EnrollButton` has a branch that never touches
                the clock. This is the one call site inside a client component, and
                a `new Date()` rendered here would be evaluated once on the server
                and again during hydration. */}
            {/* Same substitution as the bar above. The drawer is the only place
                Sign in exists below lg, so it has to make the swap too or a
                signed-in reader on a phone is offered an account they have. */}
            <div className="mt-4 flex flex-col gap-2.5 pb-1">
              {viewer ? (
                <>
                  <ButtonLink href="/dashboard" onClick={closeMenu}>
                    My courses
                  </ButtonLink>
                  <ButtonLink href="/account" tone="secondary" onClick={closeMenu}>
                    Your account
                  </ButtonLink>
                </>
              ) : (
                <>
                  <EnrollButton onClick={closeMenu} />
                  <ButtonLink href="/sign-in" tone="secondary" onClick={closeMenu}>
                    Sign in
                  </ButtonLink>
                </>
              )}
            </div>
          </Container>
      </div>
    </header>
  );
}

/*
  THE COURSES DROPDOWN IS GONE, removed 9 Aug.

  Two reasons, and the second is the one that mattered.

  It was unusable. The panel was `absolute top-full mt-2`, so its 8px gap sat
  OUTSIDE the wrapper that owned `onMouseLeave` — moving the pointer from the
  caret down toward the panel left the wrapper, which closed the menu before it
  could be reached. On a pointer device the items could not be clicked at all.
  Every keyboard and touch path worked, which is why it survived review.

  And Roan did not want it: a nav dropdown listing five courses with their level
  and duration is the catalog page rendered into a 300px panel, and /courses is
  one click away carrying the same five with room to actually read them.

  So "Courses" is an ordinary nav link now, like every other item in the bar.
*/
