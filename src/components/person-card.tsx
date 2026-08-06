import { AvatarSlot, LogoSlot } from "@/components/media-slots";
import { StatusChip } from "@/components/ui";
import type { Person } from "@/lib/content";

/**
 * One roster card: portrait, organization mark, then the type.
 *
 * The portrait frame was removed once, because ten of the eleven people on the
 * page had no photograph and the build was filling the gap with a monogram
 * tile: two grey letters in a circle, framed identically to Roan's real
 * photograph, which read as ten broken images rather than ten pending ones.
 *
 * Removing the frame fixed the symptom and lost the structure. The frame is
 * back, and an empty one is drawn as an empty one, in a dashed rule with a
 * neutral glyph. Roan's is filled. The three specialists' fill the day their
 * employers clear the photograph, and the footnote under the grid says so.
 *
 * The mark sits opposite the portrait rather than beside the role line, so a
 * row of four cards has one alignment for portraits and one for marks, and the
 * eye can read either column down the row.
 */
export function PersonCard({ person }: { person: Person }) {
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface p-5 pt-[21px]">
      {/* The hue of the path this person records, matching its catalog cover.
          Roan records all five, so his card takes the accent. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: person.ground }}
      />

      <div className="flex items-start justify-between gap-3">
        <AvatarSlot image={person.photo} ring={person.ground} size={56} />
        <LogoSlot logo={person.logo} />
      </div>

      <div className="mt-3.5 flex items-start justify-between gap-3">
        <h3 className="t-card-title text-ink">{person.name}</h3>
        {person.lead ? <StatusChip>Lead</StatusChip> : null}
      </div>
      <p className="t-meta mt-1 text-ink-muted">{person.role}</p>
      <p className="t-body-sm mt-3 text-ink-secondary">{person.detail}</p>

      <p className="t-label mt-auto flex items-center gap-2 border-t border-line pt-3 text-ink-muted">
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 flex-none rounded-full"
          style={{ background: person.ground }}
        />
        {person.scope}
      </p>
    </article>
  );
}
