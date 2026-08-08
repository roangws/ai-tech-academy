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
 *
 * ------------------------------------------------- THE ROW THAT ATE THE SCROLL
 *
 * Fixed 8 Aug. Rolling the wheel with the pointer over this row moved the row
 * instead of the page, by a pixel, in both directions — Roan's "it goes up and
 * down once I scroll the mouse". It is worth writing down because nothing in the
 * markup looks like it asks for a scroll container.
 *
 * `overflow-x: auto` is the request. But CSS does not let one axis be `visible`
 * while the other is not: an `overflow-y` of `visible` computes to `auto`
 * whenever `overflow-x` is not `visible`. So the row was a scroll container on
 * *both* axes, and it only needed a pixel of vertical overflow to become a
 * scrollable one.
 *
 * It had exactly a pixel. `-mb-px` sat on each `<a>` to pull its 2px underline
 * onto the nav's own hairline. A negative bottom margin shortens the parent's
 * content box, and it does not shrink the child's border box, so the anchors
 * ended 1px past the bottom of a box that was now 1px shorter. Measured at every
 * breakpoint from 430 to 1440: `clientHeight` 43, `scrollHeight` 44.
 *
 * The wheel finds that. The pointer is over a scrollable element, so the browser
 * scrolls it — one pixel, the whole range — and the page does not move until
 * scroll chaining takes over a beat later. Scroll back and the pixel returns.
 *
 * The fix is to move the negative margin from the anchors to the `<ul>`. An
 * element's own margin is not part of its scrollable overflow, so the children
 * now fit their container exactly (44 and 44, measured) while the row still
 * hangs its last pixel over the nav's hairline. Rendered geometry is unchanged
 * at every width: the nav is 44px tall before and after.
 *
 * `overflow-y: hidden` is the other obvious fix and it is the wrong one. It
 * clips painted outlines, and the focus ring on these links is 3px at a 2px
 * offset, so keyboard focus would have been trimmed top and bottom to buy back
 * a pixel that should not have existed.
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
      {/* `-mb-px` lives here, not on the anchors. The header note has the whole
          of why; the short version is that a negative margin on a child of a
          scroll container is a pixel of scrollable overflow, and a negative
          margin on the container itself is not. */}
      <ul className="rail -mb-px flex gap-1 overflow-x-auto">
        {sections.map((s) => (
          <li key={s.id} className="flex-none">
            <a
              href={`#${s.id}`}
              /*
                The underline lands on the container's own border, so the
                active-looking hover state replaces that hairline rather than
                sitting under it and drawing two lines 1px apart. The pixel of
                overlap that does it is the `-mb-px` on the `<ul>`, and it was
                on this element until it turned out to be a scroll trap.
              */
              className="t-button inline-flex min-h-[44px] items-center border-b-2 border-transparent px-3 text-ink-secondary no-underline transition-colors hover:border-accent hover:text-accent"
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
