import { InstructorCard } from "@/components/instructor-card";
import type { Person } from "@/lib/content";

/**
 * Who teaches this course, above the curriculum.
 *
 * ----------------------------------------------------------------- the same card
 *
 * `InstructorCard` from the homepage band, unchanged and not restyled. A reader
 * who met these people on the homepage or on /instructors should recognise them
 * here without having to look twice, and every number that card is built on —
 * 292px wide, a 2:3 frame so `object-cover` crops nothing, a 272px head, a 149px
 * reserved text block — is a property of the card rather than of the band it sits
 * in. sections/instructors.tsx has the arithmetic and why it is what it is.
 *
 * The lead gets the SAME tile as everyone else here, which is the one thing this
 * band does differently from the two roster surfaces. Those two are about the
 * roster, where "the lead instructor writes the curriculum" is the fact being
 * shown and a wider card says it. This band answers a narrower question — who
 * will be teaching me this course — and on that question the people on it are
 * peers. A 292px card beside a full-width feature would rank them.
 *
 * -------------------------------------------------------------------- the layout
 *
 * A wrap of fixed 292px cards rather than a grid of fractions, for the reason
 * /instructors settled: a card that takes its width from a column count renders a
 * different-sized face at every breakpoint, because `object-cover` scales the head
 * to 0.93x the card's WIDTH. Fixing the card and letting the row count fall out of
 * the container is what keeps the framing constant.
 *
 * In this column that is two across from sm and two across at lg — the left column
 * is 824px inside the 1216 container, which holds two cards and their gap with
 * room to spare and cannot hold three. A course with four instructors is therefore
 * two rows of two, which is the arrangement the four specialists already take on a
 * 960px screen.
 *
 * BELOW sm IT IS A RAIL, which is the one place this band parts company with
 * /instructors. That page stacks its cards full width and is right to: it is the
 * destination, and nothing on it should ask to be swiped past. This band is an
 * interstitial between what a reader will learn and how the course is taught, and
 * measured on a 390px screen four stacked cards are 2,236px of portrait between
 * those two things. The rail is the homepage band's own answer to the same
 * arithmetic, on the same card, and it keeps "Course content" within reach of the
 * thumb that just read who teaches it.
 *
 * The negative margin lets a card reach the screen edge and the matching padding
 * keeps a snapped card on the content column. Both switch off at sm together with
 * the scrolling, where the wrap takes over.
 */
export function CourseInstructors({ people }: { people: Person[] }) {
  /* No instructors assigned renders nothing rather than a heading over an empty
     row. It is reachable: a course created in the console has none until somebody
     ticks them, and a roster card can be unpublished out from under a link. */
  if (!people.length) return null;

  return (
    <section aria-labelledby="instructors-heading">
      <h2 id="instructors-heading" className="t-h3 text-ink">
        {people.length === 1 ? "Your instructor" : "Your instructors"}
      </h2>

      <ul
        aria-label="Instructors on this course"
        className="rail -mx-4 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
      >
        {people.map((person) => (
          <li
            key={person.id}
            /*
              Two per row from sm, and `calc(50% - 8px)` rather than a flat 292
              because of one window: at exactly lg the left column is 568px and
              two 292s plus their gap are 600, so a fixed card stacked four
              portraits single-file on an iPad in landscape. Half the row minus
              half the gap always fits two, and the cap keeps the card at its
              designed 292 everywhere the column is wide enough to give it —
              which is every width from about 1060 up. Between lg and there the
              card renders 276 and the head 257 rather than 272, which is the
              small end of a range the card already spans on a phone.
            */
            className="flex w-[70vw] max-w-[292px] shrink-0 snap-start sm:w-[calc(50%-8px)]"
          >
            <InstructorCard person={person} />
          </li>
        ))}
      </ul>
    </section>
  );
}
