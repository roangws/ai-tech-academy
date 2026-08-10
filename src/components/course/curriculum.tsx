"use client";

import {
  CaretDownIcon,
  ClipboardTextIcon,
  FlaskIcon,
  PlayCircleIcon,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { AccordionItem, useDisclosureSet } from "@/components/ui/accordion";
import { StatusChip, TextButton } from "@/components/ui";
import { lessonCount, method, type CourseModule } from "@/lib/content";

/**
 * The curriculum, which is what somebody came to this page to read.
 *
 * ------------------------------------------------------- WHY NOT THE FAQ ROW
 *
 * The FAQ is the site's other accordion and it shares this one's wiring and none
 * of its appearance. That pattern is a 26px dimmed question with the index in the
 * gutter, no chevron, and colour as the whole affordance. A curriculum row is a
 * card-title, a lesson count on the right, an access chip and a caret. Making one
 * component serve both would mean a `variant` prop that branches every line.
 *
 * So `ui/accordion.tsx` holds the aria wiring and the open/closed policy, and both
 * rows are written where they are read.
 *
 * ---------------------------------------------------------------- THE NUMBERS
 *
 * Rows are 64px against the FAQ's 84. That 84 is sized for 26px type; a
 * `t-card-title` row with a caret needs 64, and eight rows at 84 would be 672px of
 * closed accordion before anybody has opened anything.
 *
 * `multiple` rather than `single`, because a reader comparing module 3 against
 * module 6 should not have module 3 close when they open module 6. The FAQ is
 * single for the opposite reason: eleven open answers is a wall of prose.
 *
 * Module 1 is open on first paint, and that state is server-rendered rather than
 * set in an effect. It is the one module a visitor can watch without an account,
 * so its lessons are in the HTML for a crawler and for a reader whose JavaScript
 * has not arrived.
 *
 * ------------------------------------------------- WHAT IS NOT ON THESE ROWS
 *
 * The reference prints "11 lectures - 1hr 22min" on every row and "41h 41m total
 * length" above them. Every lesson on this site is unrecorded except module 1
 * lesson 1, so there are no durations to print and none are invented: rows state a
 * lesson count, `Lesson.minutes` is optional, and nothing anywhere sums it into a
 * total. If a duration appears on a row that is because somebody recorded that
 * lesson.
 *
 * The access chip is on module 01 only. Seven "Free account" pills down the right
 * edge is one constant repeated seven times, and they would compete with the one
 * green chip that is the actual offer. The note under the outline in
 * sections/modules.tsx records the same decision.
 */
export function Curriculum({
  modules,
  totalLessons: total,
  preview,
}: {
  modules: readonly CourseModule[];
  totalLessons: number;
  /**
   * The free module's video and the control that starts the course, rendered
   * inside that module's own panel.
   *
   * ---------------------------------------------------------------- why a prop
   *
   * It used to be a sibling section titled "Watch the first lesson", sitting
   * under the whole accordion. That put the strongest thing on the page — the
   * one lesson anybody can watch without an account — below eight collapsed
   * rows, describing a module the reader had to scroll back up to find. The
   * offer and the thing being offered were 600px apart and neither mentioned
   * the other.
   *
   * Inside module 01's panel they are one object: the module is open on first
   * paint, so a reader arriving at `#curriculum` sees the module, its lessons,
   * its video and its start button without opening anything.
   *
   * As a `ReactNode` prop rather than built here, because this is a client
   * component — it owns the disclosure state — and the preview is an async
   * server component that queries `lesson_blocks`. Passing the rendered element
   * down is what lets a server component live inside a client one; importing it
   * would drag a database query into the browser bundle and fail.
   */
  preview?: ReactNode;
}) {
  const ids = modules.map((m) => m.n);
  const { isOpen, toggle, openAll, closeAll, allOpen } = useDisclosureSet({
    ids,
    mode: "multiple",
    initial: [modules[0]?.n ?? ""],
  });

  return (
    <section aria-labelledby="curriculum-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
        <div>
          <h2 id="curriculum-heading" className="t-h3 text-ink">
            Course content
          </h2>
          {/* "one guided lab in each" was false on this very page for the AI
              literacy course, whose module 05 is four lessons and no lab, and
              the accordion under this line proves it to anyone who opens it.
              No module in any of the five is one lesson and one lab either —
              they run three to six items in a mix that moves with the subject.
              "guided labs throughout" is the claim the data supports. */}
          <p className="t-meta mt-1.5 text-ink-muted">
            {modules.length} modules · {total} lessons · guided labs throughout
          </p>
        </div>

        {/* A button, not a link. ui/index.tsx has the note on why TextAction
            could not be reused and why an `<a href="#">` is the wrong fix. */}
        <TextButton aria-expanded={allOpen} onClick={allOpen ? closeAll : openAll}>
          {allOpen ? "Collapse all" : `Expand all ${modules.length} modules`}
        </TextButton>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
        {modules.map((m, i) => {
          const open = isOpen(m.n);
          const step = method.steps[m.step - 1];

          return (
            <AccordionItem
              key={m.n}
              id={m.n}
              idPrefix="module"
              open={open}
              onToggle={() => toggle(m.n)}
              headingLevel={3}
              className={i > 0 ? "border-t border-line" : ""}
              header={() => (
                <span
                  className={`flex min-h-[64px] items-center gap-3 px-4 py-3 transition-colors duration-150 sm:h-[64px] sm:py-0 ${
                    open ? "bg-surface-subtle" : "hover:bg-surface-subtle"
                  }`}
                >
                  <span className="t-meta w-5 flex-none tabular-nums text-ink-muted">{m.n}</span>

                  <span className="t-card-title min-w-0 flex-1 text-ink">{m.name}</span>

                  <span className="t-meta hidden flex-none text-ink-muted sm:block">
                    {lessonCount(m)}
                  </span>

                  {m.access === "open" ? <StatusChip open>Open</StatusChip> : null}

                  {/* The caret rotates, and the transition is zeroed under the
                      global reduced-motion rule in globals.css because it is a
                      CSS transition rather than a JS-driven one. */}
                  <CaretDownIcon
                    size={16}
                    aria-hidden="true"
                    className={`flex-none text-ink-muted transition-transform duration-150 ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                </span>
              )}
              panelClassName="border-t border-line bg-surface-subtle px-4 py-4"
            >
              {/* The method step, printed rather than implied. Eight modules
                  against a five-step method needs the mapping stated somewhere,
                  and this is the only place a reader is looking at one module
                  closely enough for it to mean anything. */}
              {step ? (
                <p className="t-field text-ink-muted">
                  Method step {m.step}, {step.name}
                </p>
              ) : null}

              <p className="t-body-sm mt-1.5 max-w-[640px] text-ink-secondary">{m.summary}</p>

              <ul className="mt-3 border-t border-line">
                {m.lessons.map((l) => {
                  const Glyph = kindGlyph[l.kind];
                  return (
                    <li
                      key={l.name}
                      className="flex min-h-[40px] items-center gap-2.5 border-b border-line py-2 last:border-b-0"
                    >
                      <Glyph size={14} aria-hidden="true" className="flex-none text-ink-muted" />
                      <span className="t-body-sm min-w-0 flex-1 text-ink-secondary">{l.name}</span>
                      {/* Only where a real figure exists. See the head of this file. */}
                      {l.minutes ? (
                        <span className="t-meta flex-none tabular-nums text-ink-muted">
                          {l.minutes} min
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>

              <p className="t-meta mt-3 border-t border-line pt-3 text-ink-muted">
                You finish with <span className="text-ink">{m.artifact}</span>
              </p>

              {/* The free module carries the video and the start control. `i === 0`
                  rather than `m.access === "open"`: a course with two open modules
                  would otherwise print the same first-lesson player twice. */}
              {i === 0 && preview ? (
                <div className="mt-4 border-t border-line pt-4">{preview}</div>
              ) : null}
            </AccordionItem>
          );
        })}
      </div>
    </section>
  );
}

/** Monochrome, one size, per the icon rule in DESIGN-SPEC.md. */
const kindGlyph: Record<CourseModule["lessons"][number]["kind"], Icon> = {
  lesson: PlayCircleIcon,
  lab: FlaskIcon,
  template: ClipboardTextIcon,
};
