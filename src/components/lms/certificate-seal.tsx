import { CrestMini } from "@/components/logo";

/**
 * The seal on the completion record.
 *
 * ------------------------------------------------------------------ why it exists
 *
 * Roan sent three reference certificates — UX Design Institute, Skillshare and a
 * Cuvida membership card — and a round stamp overlapping the header band is the
 * one device all three of the good ones share. It is what makes a page of type
 * read as a document that was ISSUED rather than as a page of type.
 *
 * ------------------------------------------------------- what it is allowed to say
 *
 * This is the part of the reference that could most easily become a lie, so it is
 * worth being explicit. The UX Design Institute seal reads "UX DESIGN INSTITUTE /
 * CERTIFICATION", which is a claim that an institute certifies the holder. This
 * program is not accredited by anybody and the FAQ says so in as many words, so
 * the seal here carries only facts that already appear elsewhere on the document:
 * who issued it, that it is a completion record, and which course.
 *
 * Specifically ABSENT: the words "certified", "accredited", "verified", "official",
 * any year of establishment, and any latin. Each of those is standard on a seal and
 * each would be this site awarding itself a status.
 *
 * ----------------------------------------------------------------- the geometry
 *
 * Two arcs and a centre, on a 200-unit square viewBox so the whole thing scales
 * from one `size` prop.
 *
 * The bottom arc runs LEFT TO RIGHT THROUGH THE BOTTOM, which in SVG's y-down
 * space means sweep-flag 1 — the mirror of the top arc's 1 through the top. Get it
 * wrong and the text renders upside down along the correct path, which is the one
 * failure here that no type check catches; it was checked by rendering the sheet to
 * PDF and looking at it.
 *
 * ------------------------------------------------------ THE TEXT HAS TO FIT THE ARC
 *
 * These sizes are measured, not chosen, and getting them wrong is the failure mode
 * of every hand-built seal. Text on a `textPath` does not wrap or shrink — it just
 * keeps going along the path — so a string that is 85% of a semicircle's length
 * puts its own first and last letters down at 3 and 9 o'clock, sliding down the
 * sides of the disc. The first cut did exactly that and it read as a mistake.
 *
 * The arithmetic, per arc: length is `π × r`, and the string costs roughly
 * `chars × (fontSize × 0.62 + letterSpacing)` at this weight. Keep the string under
 * about two thirds of the arc and its ends land near ±55° of the crown, which is
 * where a stamp's text stops. Both arcs below are at 62–68%.
 *
 * `letterSpacing` is still open rather than tight, because curved capitals close up
 * at the ends of an arc where the baseline turns fastest — but it is now spent
 * inside a budget rather than as much as looked nice at the crown.
 */
export function CertificateSeal({
  courseBadge,
  hue,
  size = 112,
}: {
  /** "Course A". The one course-specific fact on the seal. */
  courseBadge: string;
  /** The course's own hue, so the seal matches the band it overlaps. */
  hue: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      /* Decorative. Every word on it is printed as real text elsewhere on the
         document, so an accessible name here would be the same four facts read out
         a second time. */
      aria-hidden="true"
      className="block flex-none"
    >
      <defs>
        <path id="seal-arc-top" d="M 26 100 A 74 74 0 0 1 174 100" />
        <path id="seal-arc-bottom" d="M 38 100 A 62 62 0 0 0 162 100" />
      </defs>

      {/* The disc. White rather than transparent, because it overlaps a saturated
          gradient band and a knockout seal on a gradient is unreadable at 24mm. */}
      <circle cx="100" cy="100" r="97" fill="#ffffff" />
      <circle cx="100" cy="100" r="95" fill="none" stroke={hue} strokeWidth="3" />
      <circle cx="100" cy="100" r="86" fill="none" stroke={hue} strokeWidth="1" opacity="0.45" />

      {/* 17 characters at 12/0.8 is about 140 units on a 232-unit arc — 60%, so the
          ends land near ±54° of the crown. See the arithmetic above. */}
      <text
        fill={hue}
        fontSize="12"
        fontWeight="700"
        letterSpacing="0.8"
        style={{ fontFamily: "inherit" }}
      >
        <textPath href="#seal-arc-top" startOffset="50%" textAnchor="middle">
          AI TECH EDUCATION
        </textPath>
      </text>

      {/* 17 characters at 10.5/1.1 is about 137 units on a 195-unit arc — 70%. The
          bottom arc is the tighter of the two, so its string has to be the smaller
          of the two to finish in the same place. */}
      <text
        fill={hue}
        fontSize="10.5"
        fontWeight="600"
        letterSpacing="1.1"
        opacity="0.7"
        style={{ fontFamily: "inherit" }}
      >
        <textPath href="#seal-arc-bottom" startOffset="50%" textAnchor="middle">
          COMPLETION RECORD
        </textPath>
      </text>

      {/* Two dots at 3 and 9 o'clock. Every real stamp has them, and they are doing
          a job rather than decorating: the two arcs stop short of the horizontal and
          the gap between their ends is the one place the ring looks unfinished. */}
      <circle cx="21" cy="100" r="3.5" fill={hue} opacity="0.55" />
      <circle cx="179" cy="100" r="3.5" fill={hue} opacity="0.55" />

      {/* The centre: the mark, then the course. `CrestMini` rather than `Crest` —
          the full crest carries a 5px inner rule that fills in solid at this size,
          which is the exact reason the mini cut exists. */}
      <g transform="translate(88 62)">
        <CrestMini size={24} />
      </g>

      <text
        x="100"
        y="122"
        textAnchor="middle"
        fill={hue}
        fontSize="15"
        fontWeight="700"
        letterSpacing="0.2"
        style={{ fontFamily: "inherit" }}
      >
        {courseBadge}
      </text>
    </svg>
  );
}
