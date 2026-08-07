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
 * The second list is `aria-hidden`. The loop needs two copies of the cards; a
 * screen reader needs one, and it already has all six in the first list.
 *
 * ------------------------------------------------------------ why it stops
 *
 * Autoplay pauses on hover, on focus inside the rail, and when the tab is
 * hidden. The first is not politeness: the board cards have a hover state that
 * reveals what each seat checks, and a track that keeps moving under the cursor
 * makes that state unreadable. The marquee this replaced had exactly that bug.
 *
 * Under `prefers-reduced-motion` there is no autoplay at all and the arrows
 * jump rather than glide. A carousel that advances itself is the canonical
 * example of the motion that setting exists to stop, so it does not get a
 * gentler version, it gets none.
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
  const paused = useRef(false);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [index, setIndex] = useState(0);

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

  /* Autoplay. */
  useEffect(() => {
    if (reduced()) return;

    const id = setInterval(() => {
      if (paused.current || document.hidden) return;
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
    Focus pauses it. The mouse does not, at Roan's instruction on 7 Aug.

    Hover-pause was in here for a real reason: the board cards reveal what each
    seat checks on hover, and a track that keeps moving under the cursor makes
    that state hard to read. Roan looked at both and wants the row to keep
    moving, which is the call to make — a carousel that stops whenever the
    pointer crosses it reads as broken far more often than it reads as
    considerate, because a pointer crosses it on the way to somewhere else.

    Focus is a different gesture and it keeps the pause. Somebody who has tabbed
    into the rail is reading it deliberately and cannot chase a moving target,
    which is the accessibility failure this pattern is known for. Reduced motion
    still turns autoplay off entirely.
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
        className={`rail flex snap-x snap-mandatory overflow-x-auto pb-1 ${bleed}`}
      >
        <ul ref={listRef} className="flex shrink-0 gap-4 pr-4">
          {children}
        </ul>
        {/* The loop needs a second copy; a screen reader does not. */}
        <ul aria-hidden="true" className="flex shrink-0 gap-4 pr-4">
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
        <p aria-live="polite" aria-atomic="true" className="t-meta tabular-nums text-ink-muted">
          {index + 1} / {count}
        </p>

        {/*
          `tabIndex={-1}` rather than `aria-hidden`. Keeping them out of the tab
          ring is right, since every card is already reachable in the list
          itself, but erasing their names breaks voice control, which drives by
          accessible name and needs "click next" to match something.
        */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Previous"
            onClick={() => step(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-ink transition-colors hover:border-line-strong"
          >
            <CaretLeftIcon size={16} weight="bold" />
          </button>
          <button
            type="button"
            tabIndex={-1}
            aria-label="Next"
            onClick={() => step(1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-ink transition-colors hover:border-line-strong"
          >
            <CaretRightIcon size={16} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
}
