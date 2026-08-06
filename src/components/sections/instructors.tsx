import { PersonCard } from "@/components/person-card";
import { Section, SectionHeader } from "@/components/ui";
import { instructors } from "@/lib/content";

/**
 * Four people, one row, one card shape.
 *
 * The three specialists have an identity: "GTM specialist" told a reader
 * nothing, so each one is described by the role and the organisation they work
 * in, with a fact about the scale they operate at. Names go in the day they
 * agree to be named.
 *
 * Portraits and organization marks are back, after a release without them. The
 * thing that had to go was the monogram tile pretending to be a photograph, not
 * the frame it sat in; person-card.tsx has the full note. Roan's portrait is
 * real, the other three slots are drawn as empty, and the footnote says what
 * they are waiting for.
 *
 * The credential strip that used to sit at the foot of this section moved up to
 * the band under the hero, where credentials do their work.
 */
export function Instructors() {
  return (
    <Section id="instructors" hairlineTop>
      <SectionHeader
        label="Instructors"
        heading={instructors.headline}
        intro={instructors.intro}
      />

      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {instructors.people.map((person) => (
          <li key={person.id} className="flex">
            <PersonCard person={person} />
          </li>
        ))}
      </ul>

      {/* States why three of the four are described by role, and what the empty
          slots are waiting for. Unexplained anonymity reads as evasion and an
          unexplained placeholder reads as an oversight; one sentence turns both
          into a policy. */}
      <p className="t-meta mt-5 max-w-[76ch] text-ink-muted">{instructors.footnote}</p>
    </Section>
  );
}
