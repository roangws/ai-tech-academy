import type { Metadata } from "next";
import Link from "next/link";
import { BoardCard } from "@/components/board-card";
import { Container, FactsLine, Section } from "@/components/ui";
import { board, courses } from "@/lib/content";

export const metadata: Metadata = {
  title: "Review Judge Board",
  description: board.intro,
  alternates: { canonical: "/review-judge-board" },
  openGraph: {
    title: "Practitioner Review Judge Board",
    description: board.intro,
    url: "/review-judge-board",
  },
};

/* Badge to course, so the card's subtitle can name the course a judge reads
   rather than printing the badge at them. */
const byBadge = new Map(courses.map((c) => [c.badge, c]));

/**
 * The full list of judges.
 *
 * ---------------------------------------------------------------- what it was
 *
 * A `SectionHeader` and a grid. `SectionHeader` renders an `<h2>`, so the route
 * shipped with no `<h1>` at all and no way back to the site. Both are fixed by
 * the fold below, which is the one /courses/[id] uses.
 *
 * Then, for one pass, a text roster on the DESIGN-SPEC line that keeps this
 * board text-only until real photographs exist. Rolled back at Roan's
 * instruction: the faces stay while the portraits are stand-ins. The note in
 * content.ts on the removed footnote is where that disclosure has to come back
 * in words.
 *
 * ---------------------------------------------------------------- what it is
 *
 * ONE FLAT LIST, which is the correction Roan made and not a simplification of
 * the same idea. The cards were grouped under "One seat per course" and "Across
 * every course", which asserted that this board is organised by course and that
 * one member is the exception to it. It is not organised that way: they are
 * judges, they judge the curriculum and they judge the events, and which course
 * a judge happens to read is a fact about them rather than the structure they
 * sit in. Two headings for six cards was also two headings more than a list of
 * six needs.
 *
 * The cards do not link. Each one is titled with a discipline and subtitled with
 * a course, so a stretched link over the whole card announces "Revenue
 * operations, link" and lands on a course page. That is a mismatch between the
 * accessible name and the destination, and this page is a list rather than a
 * router.
 *
 * `checksAlwaysVisible` is the one thing the card does differently from the
 * homepage carousel, which hides `checks` behind a hover. This page exists to
 * list these judges, and a touch screen never fires that hover.
 */
export default function ReviewJudgeBoardPage() {
  return (
    <>
      {/* A bare section rather than `Section`: the h1 block wants tighter air
          under it than `Section`'s symmetric padding gives. */}
      <section className="border-b border-line bg-surface pt-6 pb-8 md:pt-8 md:pb-10">
        <Container>
          <nav aria-label="Breadcrumb" className="t-meta text-ink-muted">
            <Link href="/" className="text-ink-muted no-underline hover:text-accent hover:underline">
              Home
            </Link>
            <span className="px-1.5 text-line-strong">/</span>
            <span className="text-ink-secondary">Review Judge Board</span>
          </nav>

          <div className="mt-3 max-w-[720px]">
            <h1 className="t-display text-ink [text-wrap:balance]">{board.headline}</h1>
            <p className="t-body mt-3 max-w-[640px] text-ink-secondary">{board.intro}</p>
            {/* The count is derived. The headline deliberately carries no numeral
                because the board is still taking judges, and a number written
                into prose is a number that goes stale; a number read off the
                array cannot. The other two items name the two jobs, which is
                what the page is now about. */}
            <FactsLine
              className="mt-4"
              items={[
                `${board.members.length} judges`,
                "Curriculum read each term",
                "Event panels",
              ]}
            />
          </div>
        </Container>
      </section>

      <Section ariaLabel="The judges">
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {board.members.map((m) => (
            <li key={m.id}>
              <BoardCard
                member={m}
                courseTitle={byBadge.get(m.reviews)?.title ?? m.reviews}
                checksAlwaysVisible
              />
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
