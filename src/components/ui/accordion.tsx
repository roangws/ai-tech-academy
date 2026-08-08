"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

/**
 * The disclosure machinery, and deliberately none of the drawing.
 *
 * There are two accordions on this site and they look nothing alike. The FAQ is
 * an oversized dimmed question with the index hung out in the gutter, no chevron,
 * and the colour change from 55% ink to full ink as its entire affordance. The
 * curriculum is a 64px card-title row with a lesson count on the right, an access
 * chip and a caret. Neither is a variant of the other, and a `variant` prop that
 * forked every line of markup would be worse than two components.
 *
 * What they genuinely share is the part that rots when it is copied: the
 * `aria-expanded` / `aria-controls` / matching-id triple, the heading wrapping the
 * button, the `hidden` panel, and the single-versus-multiple open policy. Those
 * live here once. The rows stay where they are.
 *
 * `role="region"` is left off the panels on purpose. Eight of them would dominate
 * the landmark map of a page that has seven honestly named sections, and the ARIA
 * authoring practices advise against it past roughly six panels. The heading and
 * the button already name each panel.
 */
export function useDisclosureSet({
  ids,
  mode = "single",
  initial = [],
}: {
  ids: readonly string[];
  /** "single" closes the others on open. The FAQ is single, the curriculum is not. */
  mode?: "single" | "multiple";
  /**
   * Open on first paint.
   *
   * This is real server-rendered state rather than an effect, which matters for
   * the curriculum: module 1 is the one a visitor can actually watch, so its
   * lessons are in the HTML for a crawler and for a reader whose JavaScript has
   * not arrived.
   */
  initial?: readonly string[];
}) {
  const [open, setOpen] = useState<readonly string[]>(initial);

  const isOpen = useCallback((id: string) => open.includes(id), [open]);

  const toggle = useCallback(
    (id: string) => {
      setOpen((prev) => {
        if (prev.includes(id)) return prev.filter((x) => x !== id);
        return mode === "single" ? [id] : [...prev, id];
      });
    },
    [mode],
  );

  const openAll = useCallback(() => setOpen(ids), [ids]);
  const closeAll = useCallback(() => setOpen([]), []);

  const allOpen = useMemo(
    () => ids.length > 0 && ids.every((id) => open.includes(id)),
    [ids, open],
  );

  return { isOpen, toggle, openAll, closeAll, allOpen };
}

/**
 * One row: a heading, the button that controls the panel, and the panel.
 *
 * The caller owns everything visual through `header`, which receives `open` so it
 * can rotate its own caret or change its own colour. This component contributes
 * `w-full text-left` and the wiring.
 *
 * `idPrefix` namespaces the generated ids, because the FAQ and the curriculum can
 * both be on one document and `faq-panel-0` colliding with `module-panel-0` is
 * the exact bug this file exists to prevent.
 */
export function AccordionItem({
  id,
  idPrefix,
  open,
  onToggle,
  headingLevel = 3,
  header,
  className = "",
  panelClassName = "",
  children,
}: {
  id: string;
  idPrefix: string;
  open: boolean;
  onToggle: () => void;
  headingLevel?: 2 | 3 | 4;
  header: (open: boolean) => ReactNode;
  className?: string;
  panelClassName?: string;
  children: ReactNode;
}) {
  const buttonId = `${idPrefix}-button-${id}`;
  const panelId = `${idPrefix}-panel-${id}`;
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";

  return (
    <div className={className}>
      <Heading className="m-0">
        <button
          type="button"
          id={buttonId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="w-full cursor-pointer text-left"
        >
          {header(open)}
        </button>
      </Heading>

      {/*
        `hidden` rather than unmounting, and rather than a height transition.

        Unmounting loses the panel's ids between renders, which breaks the
        `aria-controls` relationship a screen reader has already announced. A
        height transition on eight panels of variable content needs a measured
        height per panel, and the global reduced-motion rule would have to be
        respected by hand. `hidden` is one attribute and it is what the pattern
        asks for.
      */}
      <div id={panelId} role="group" aria-labelledby={buttonId} hidden={!open} className={panelClassName}>
        {children}
      </div>
    </div>
  );
}
