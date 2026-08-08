/**
 * The in-page section row, under the stat bar.
 *
 * Coursera runs About / Outcomes / Courses / Testimonials here and it is the one
 * piece of structure this page was missing: it is roughly 4,000px long, and until
 * now the only way to find the curriculum was to scroll past it. Four anchors turn
 * the page into something a reader can navigate rather than only consume.
 *
 * ------------------------------------------------------------------ NOT REAL TABS
 *
 * These are anchors, not a tablist, and the distinction is not pedantry. A tablist
 * promises that exactly one panel is visible at a time and that arrow keys move
 * between them; this shows all four sections at once and a click scrolls. Marking
 * it `role="tablist"` would tell a screen reader to expect behaviour that is not
 * there, which is worse than the plain nav it actually is.
 *
 * So: a `<nav>` of ordinary links, which also means it works with no JavaScript and
 * needs no active-section tracking. The header already owns that machinery for the
 * homepage and duplicating it here would be a second scroll listener for a row of
 * four items.
 *
 * `scroll-padding-top: 84px` in globals.css is what stops each target landing under
 * the sticky header, and it is already set for the homepage nav.
 *
 * Below sm this scrolls horizontally rather than wrapping to two lines. Four items
 * wrapping puts a 44px row under a 44px row directly beneath a card that just
 * straddled a band edge, and the fold stops being legible.
 */
const sections = [
  { id: "about", label: "About" },
  { id: "curriculum", label: "Curriculum" },
  { id: "faq", label: "Questions" },
  { id: "courses", label: "Other courses" },
] as const;

export function CourseTabs() {
  return (
    <nav aria-label="Sections of this course" className="border-b border-line">
      <ul className="rail flex gap-1 overflow-x-auto">
        {sections.map((s) => (
          <li key={s.id} className="flex-none">
            <a
              href={`#${s.id}`}
              /*
                The underline is `-mb-px` onto the container's own border, so the
                active-looking hover state replaces that hairline rather than
                sitting under it and drawing two lines 1px apart.
              */
              className="t-button -mb-px inline-flex min-h-[44px] items-center border-b-2 border-transparent px-3 text-ink-secondary no-underline transition-colors hover:border-accent hover:text-accent"
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
