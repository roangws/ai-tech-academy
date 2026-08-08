import {
  ChartLineUpIcon,
  FilmSlateIcon,
  ScalesIcon,
  StorefrontIcon,
  StackIcon,
  GraduationCapIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";

/**
 * One glyph per course, for the places a course is named without its cover.
 *
 * Two of those exist: the Courses dropdown in the header, where a photograph
 * would make a menu row 60px tall, and the catalog page's own index. Both need
 * the five to be told apart at 20px, which is the constraint that picked these.
 *
 * ---------------------------------------------------------- KEYED, NOT POSITIONAL
 *
 * The stat bar and the enrol rail both use positional glyph arrays, on the
 * argument that the copy in a slot should be editable without coming here to
 * rekey a lookup. That argument does not apply to this one and the difference is
 * worth stating, because the pattern looks inconsistent otherwise: those arrays
 * index into fixed slots of a fixed-length record, where slot 2 is always the
 * duration whatever it says. This maps a course *identity* to a picture of the
 * work it is about, so an id is exactly the right key and a positional array
 * would silently give the media course the compliance scales the day somebody
 * reorders `courses`.
 *
 * ------------------------------------------------------------- WHY THESE SIX
 *
 * Each names the work rather than the technology. A robot or a sparkle on all
 * five would say "AI" five times, which the reader already knows from the page
 * they are on, and would leave the five indistinguishable — the one job a menu
 * glyph has.
 *
 *   gtm       a rising line, for pipeline and revenue
 *   media     a clapperboard, for footage and post
 *   literacy  scales, for policy and the judgement it asks for
 *   infra     stacked layers, for a serving layer
 *   starter   a shopfront, for an owner behind their own counter
 *
 * `GraduationCapIcon` is the fallback and also the mark for "all courses", so an
 * id with no entry renders the generic course glyph rather than nothing. Regular
 * weight throughout, per the icon rule in DESIGN-SPEC.md: no duotone, no fills,
 * no coloured tiles.
 *
 * `/dist/ssr` rather than the barrel, which is the one import decision in this
 * file. These components are used from a server component (the catalog page) and
 * a client one (the header), and the `/dist/ssr` entry is a plain SVG function
 * with no hooks and no client directive, so it is legal in both. The barrel
 * carries "use client" and would have made this module unusable on the server.
 */
export const courseGlyphs: Readonly<Record<string, Icon>> = {
  gtm: ChartLineUpIcon,
  media: FilmSlateIcon,
  literacy: ScalesIcon,
  infra: StackIcon,
  starter: StorefrontIcon,
};

export const allCoursesGlyph: Icon = GraduationCapIcon;

export function CourseGlyph({
  id,
  size = 20,
  className = "",
}: {
  id: string;
  size?: number;
  className?: string;
}) {
  const Glyph = courseGlyphs[id] ?? allCoursesGlyph;
  /* Always decorative. Every call site prints the course title as text beside
     it, so an accessible name here would be the title announced twice. */
  return <Glyph size={size} aria-hidden="true" className={className} />;
}
