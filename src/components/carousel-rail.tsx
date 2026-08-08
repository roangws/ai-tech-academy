"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CaretLeftIcon, CaretRightIcon, PauseIcon, PlayIcon } from "@phosphor-icons/react";

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
 * Four ways, and they cover different people.
 *
 * Focus inside the rail pauses it, and a hidden tab pauses it. Under
 * `prefers-reduced-motion` there is no autoplay at all and the arrows jump
 * rather than glide: a carousel that advances itself is the canonical example
 * of the motion that setting exists to stop, so it does not get a gentler
 * version, it gets none.
 *
 * The fourth is the Pause button, and it is the one that makes this rail
 * conform rather than nearly conform. Hover-pause was removed on 7 Aug at
 * Roan's instruction — the right call, since a pointer crosses a rail on the
 * way to somewhere else and a row that stops every time reads as broken — but
 * removing it left a mouse user with no way at all to stop moving content, which
 * is what WCAG 2.2.2 requires. A control answers it without bringing back a
 * behaviour that fires by accident.
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

  /**
   * Stopped by the reader, as distinct from `paused`.
   *
   * `paused` is a ref because it is transient — focus enters, focus leaves — and
   * nothing renders from it. This is state because a control renders from it,
   * and it is separate because the two must not overwrite each other: tabbing
   * out of a rail somebody deliberately stopped must not start it moving again.
   */
  const [stopped, setStopped] = useState(false);

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

  /* Autoplay. `stopped` is in the dependency list rather than checked inside the
     tick, so pressing Pause tears the interval down instead of leaving a timer
     firing into a guard. */
  useEffect(() => {
    if (reduced() || stopped) return;

    const id = setInterval(() => {
      if (paused.current || document.hidden) return;
      setAnnounce(false);
      step(1);
    }, STEP_MS);

    return () => clearInterval(id);
  }, [step, stopped]);

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

          THE PAUSE CONTROL IS THE EXCEPTION and it is a real tab stop.

          Focus-pause and `prefers-reduced-motion` between them covered the two
          readers this rail was designed around, and missed the one WCAG 2.2.2
          is actually written for: somebody who reads slowly, or is distracted by
          movement, and is using a mouse. Nothing they can do with a pointer stops
          the row — hover was deliberately taken out on 7 Aug — so the content
          moved for as long as the page was open with no mechanism to stop it.
          That is the failure condition verbatim, and it needs a control rather
          than a smarter default.

          It sits before the arrows because it governs them, and it is the only
          one of the three that is reachable by Tab: the arrows duplicate the
          rail's own scrolling, and this does something nothing else can.
        */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={stopped ? "Play carousel" : "Pause carousel"}
            onClick={() => setStopped((s) => !s)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-ink transition-colors hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {stopped ? (
              <PlayIcon size={14} weight="fill" />
            ) : (
              <PauseIcon size={14} weight="fill" />
            )}
          </button>
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
