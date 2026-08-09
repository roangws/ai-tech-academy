"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";

/**
 * An infinite, self-advancing scroll-snap rail.
 *
 * It steps to the next card every three seconds and never reaches an end. It
 * is also a native scroll container, so a finger can throw it, a trackpad can
 * scrub it and the arrows can page it, and all four gestures resolve through
 * the same number.
 *
 * ------------------------------------------------------------ how infinite
 *
 * The children are rendered twice, into two identical lists side by side. When
 * the scroll position passes the width of the first list, the same content is
 * already under the reader, so subtracting that width from `scrollLeft` puts
 * them back at the start with nothing visibly changing. Going backwards past
 * zero does the same in reverse.
 *
 * Two rules keep the seam invisible:
 *
 *   1. The jump is instant and the step is smooth. They must never overlap, or
 *      the jump cancels the animation and leaves a card half-scrolled. So the
 *      wrap is checked *before* a programmatic step, never during one.
 *   2. A hand-driven scroll wraps on settle, not on every frame. `scrollLeft`
 *      is written 150ms after the last scroll event, when momentum has stopped
 *      and there is no animation to interrupt.
 *
 * The second list is `inert`. The loop needs two copies of the cards; a screen
 * reader needs one, and it already has all six in the first list — and since
 * every card is a stretched link, the clone also has to stay out of the tab
 * ring. One attribute does both; the note at the element has the detail.
 *
 * ------------------------------------------------------------ why it stops
 *
 * The pointer stops it, focus stops it, a hidden tab stops it, and under
 * `prefers-reduced-motion` it never starts: a carousel that advances itself is
 * the canonical example of the motion that setting exists to stop, so it does
 * not get a gentler version, it gets none.
 *
 * THE PAUSE BUTTON IS GONE, removed 9 Aug at Roan's instruction, and pointer
 * pause is what replaces it rather than nothing. That is not a workaround for
 * the removal; it is the fix for the bug Roan reported in the same breath.
 *
 * The bug: hover on a card would stop working after the first interaction. The
 * cause is that a browser fires `mouseenter` on a pointer that moves, not on an
 * element that moves under a stationary pointer. A rail that steps every three
 * seconds slides one card out from under the cursor and the next card in, and
 * the new one never receives a hover event — so the reader sits with the pointer
 * on a card and nothing happens until they jiggle the mouse. Intermittent by
 * nature, which is exactly how it was described.
 *
 * Stopping on pointer-in fixes it at the source: the card under the cursor stays
 * under the cursor. It also restores what WCAG 2.2.2 requires, a mechanism for a
 * mouse user to stop moving content, which is the whole reason the button
 * existed.
 *
 * Hover-pause was itself removed on 7 Aug, on the argument that a pointer
 * crosses a rail on the way to somewhere else and a row that halts every time
 * reads as broken. That argument was about a rail whose cards revealed their
 * content on hover, where stopping and revealing fired together and fought. The
 * cards now show everything without being hovered, so a stop is just a stop, and
 * a row that holds still while you are pointing at it is the behaviour a reader
 * expects rather than a surprise.
 *
 * ------------------------------------------------------------ the edges
 *
 * There are no fade masks. A gradient over a card that is 82% of a phone screen
 * is a wash across somebody's face, not a hint that the row continues. Below lg
 * the rail escapes the page gutter so a card is cut by the window edge, which
 * reads as "there is more over there". From lg it stays inside the content
 * column, because bleeding by the gutter alone cut the last card 80px short of
 * the window with white beyond it: an edge belonging to nothing.
 *
 * `scroll-padding-inline-start` is what keeps a snapped card on the content
 * column rather than flush to the screen. Without it every card after the first
 * lands 16px off the grid the rest of the page is drawn on.
 */
const STEP_MS = 3000;

export function CarouselRail({
  children,
  count,
  label,
  className = "",
}: {
  children: React.ReactNode;
  /** Number of items in one copy of the list, for the dots. */
  count: number;
  label: string;
  className?: string;
}) {
  const rail = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  /**
   * Held still, by a pointer or by focus.
   *
   * A ref rather than state because it is transient and nothing renders from it.
   * It used to have a sibling, `stopped`, which was state because the Pause
   * button rendered from it; that button is gone and so is the distinction.
   *
   * One flag for both gestures is correct here even though they can overlap: a
   * click inside the rail is a pointer that is also focus, and both clear on the
   * way out. The pair only needed keeping apart when one of them was a
   * deliberate, sticky choice that a passing gesture must not undo.
   */
  const paused = useRef(false);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [index, setIndex] = useState(0);

  /**
   * Whether the position readout is allowed to announce.
   *
   * It carried `aria-live="polite"` unconditionally, and autoplay steps the
   * index every three seconds forever, so a screen reader on this page read out
   * "2 / 6", "3 / 6", "4 / 6" for as long as the page stayed open — a fresh
   * interruption every three seconds, none of it asked for. The readout is
   * genuinely useful, but only when the reader is the one who moved.
   *
   * So the live region is armed by `step()` from an arrow press and disarmed by
   * autoplay. Same element, same text; it just stops narrating a change nobody
   * made.
   */
  const [announce, setAnnounce] = useState(false);

  /** Card pitch and the width of one full copy of the list. Measured from the
      DOM rather than assumed, so the same component works at any card width. */
  const metrics = useCallback(() => {
    const list = listRef.current;
    if (!list) return null;
    const cards = list.children;
    const first = cards[0] as HTMLElement | undefined;
    const second = cards[1] as HTMLElement | undefined;
    if (!first) return null;
    const pitch = second ? second.offsetLeft - first.offsetLeft : first.offsetWidth;
    return { pitch, half: list.offsetWidth };
  }, []);

  /** Pull the scroll position back into the first copy. Instant, always. */
  const normalize = useCallback(() => {
    const el = rail.current;
    const m = metrics();
    if (!el || !m || m.half <= 0) return;
    if (el.scrollLeft >= m.half) el.scrollLeft -= m.half;
    else if (el.scrollLeft < 0) el.scrollLeft += m.half;
  }, [metrics]);

  const reduced = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const step = useCallback(
    (dir: -1 | 1) => {
      const el = rail.current;
      const m = metrics();
      if (!el || !m) return;

      /*
        Forward needs no pre-emptive wrap, and adding one skipped a card.

        The second copy is real scrollable width, so stepping off the end of the
        first copy simply lands on the first card *of the second copy* and looks
        right. `normalize` then subtracts a copy's width once the scroll settles,
        which is invisible because both positions show the same thing.

        Wrapping before the step instead meant that from the last card, the
        position jumped to zero and then advanced one pitch, so the loop went
        card 6 to card 2 and card 1 was never the leftmost card again.

        Backwards is the exception and does need the pre-jump, because there is
        nothing before zero for the browser to scroll into: from the first card
        we hop forward a whole copy, which shows the identical view, and then
        step back into the last card of the first copy.
      */
      if (dir === -1 && el.scrollLeft - m.pitch < 0) el.scrollLeft += m.half;

      el.scrollBy({ left: dir * m.pitch, behavior: reduced() ? "auto" : "smooth" });
    },
    [metrics],
  );

  /* Position readout, derived from scroll rather than from whatever last moved
     it, so a swipe and an arrow press agree. Modulo `count` because the second
     copy of the list holds the same six people. */
  useEffect(() => {
    const el = rail.current;
    if (!el) return;

    let frame = 0;
    function onScroll() {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const m = metrics();
        if (!el || !m || m.pitch <= 0) return;
        setIndex(((Math.round(el.scrollLeft / m.pitch) % count) + count) % count);
      });
      if (settle.current) clearTimeout(settle.current);
      settle.current = setTimeout(normalize, 150);
    }

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      if (settle.current) clearTimeout(settle.current);
      el.removeEventListener("scroll", onScroll);
    };
  }, [count, metrics, normalize]);

  /* Autoplay. The tick reads `paused` rather than the effect depending on it,
     because a pointer entering and leaving must not tear down and rebuild the
     interval on every pass. */
  useEffect(() => {
    if (reduced()) return;

    const id = setInterval(() => {
      if (paused.current || document.hidden) return;
      setAnnounce(false);
      step(1);
    }, STEP_MS);

    return () => clearInterval(id);
  }, [step]);

  /* A resize changes the pitch while the browser keeps `scrollLeft` in pixels,
     so the reader ends up between two cards on a card they did not ask for.
     Re-snapping to the top of the first copy is the only stable answer. */
  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      el.scrollLeft = 0;
      setIndex(0);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /*
    Pointer and focus both hold it. See the note at the top for why the pointer
    is back and why the Pause button is not.

    POINTER EVENTS, NOT MOUSE EVENTS. `pointerenter` fires for a pen and for a
    touch as well as for a mouse, and `mouseenter` on a touch screen fires a
    synthetic one on tap that never pairs with a leave — so a phone reader who
    tapped a card once would have stopped the rail for the rest of the session
    with no way to start it again. `pointerleave` fires on lifting off, so the
    touch case resolves itself.
  */
  const hold = () => {
    paused.current = true;
  };
  const resume = () => {
    paused.current = false;
  };

  const bleed =
    "-mx-4 px-4 [scroll-padding-inline-start:1rem] sm:-mx-5 sm:px-5 sm:[scroll-padding-inline-start:1.25rem] " +
    "md:-mx-6 md:px-6 md:[scroll-padding-inline-start:1.5rem] lg:mx-0 lg:px-0 lg:[scroll-padding-inline-start:0px]";

  return (
    <div className={className}>
      <div
        ref={rail}
        tabIndex={0}
        role="group"
        aria-roledescription="carousel"
        aria-label={label}
        onFocus={hold}
        onBlur={resume}
        onPointerEnter={hold}
        onPointerLeave={resume}
        className={`rail flex snap-x snap-mandatory overflow-x-auto pb-1 ${bleed}`}
      >
        <ul ref={listRef} className="flex shrink-0 gap-4 pr-4">
          {children}
        </ul>
        {/*
          The loop needs a second copy; a screen reader does not, and neither
          does the tab ring.

          `aria-hidden` alone was not enough and was actively worse than
          nothing. Every card in here is a stretched link, so the clone put six
          focusable anchors inside a hidden subtree: a keyboard reader tabbing
          through the rail hit six stops that announce nothing, land on nothing
          nameable, and navigate to pages they were never told about. That is
          the specific pattern `aria-hidden` on interactive content is called
          out for.

          `inert` fixes both halves in one attribute — it removes the subtree
          from the tab order and from the accessibility tree — so `aria-hidden`
          comes off with it rather than being stacked on top. It also sets
          `pointer-events: none` on the clone, which does not affect the rail:
          scrolling is handled by the overflow container above, and a touch or
          trackpad gesture over an inert child still scrolls its nearest
          scrollable ancestor.
        */}
        <ul inert className="flex shrink-0 gap-4 pr-4">
          {children}
        </ul>
      </div>

      <div className="mt-4 flex items-center gap-4">
        {/* A count, not a control. Tapping a dot to jump five cards is a 6px
            target on a rail that is already swipeable. */}
        <ul aria-hidden="true" className="flex flex-1 items-center gap-1.5">
          {Array.from({ length: count }).map((_, i) => (
            <li
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-5 bg-ink" : "w-1.5 bg-line-strong"
              }`}
            />
          ))}
        </ul>

        {/*
          Announced, not hidden. The dots and the arrows are decoration for a
          list that is entirely present in the DOM, but a position readout is
          the one thing an assistive-technology user cannot get by other means,
          and `aria-live` on it costs a phrase per step rather than a re-read.
        */}
        <p
          aria-live={announce ? "polite" : "off"}
          aria-atomic="true"
          className="t-meta tabular-nums text-ink-muted"
        >
          {index + 1} / {count}
        </p>

        {/*
          `tabIndex={-1}` on the arrows rather than `aria-hidden`. Keeping them
          out of the tab ring is right, since every card is already reachable in
          the list itself, but erasing their names breaks voice control, which
          drives by accessible name and needs "click next" to match something.

          There were three controls here. The Pause button came out on 9 Aug at
          Roan's instruction; the note at the top of this file has what took over
          its job, which is pointer pause rather than nothing.
        */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Previous"
            onClick={() => {
              setAnnounce(true);
              step(-1);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-ink transition-colors hover:border-line-strong"
          >
            <CaretLeftIcon size={16} weight="bold" />
          </button>
          <button
            type="button"
            tabIndex={-1}
            aria-label="Next"
            onClick={() => {
              setAnnounce(true);
              step(1);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-ink transition-colors hover:border-line-strong"
          >
            <CaretRightIcon size={16} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
}
