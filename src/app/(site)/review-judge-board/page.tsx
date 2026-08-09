import type { Metadata } from "next";
import Link from "next/link";
import { BoardCard } from "@/components/board-card";
import { Container, FactsLine, Section } from "@/components/ui";
import { board, brand, courses, namedJudges, openSeats } from "@/lib/content";

/**
 * `openGraph` REPLACES the root block, it does not merge into it.
 *
 * This declared three keys — title, description, url — and inherited nothing,
 * so the one page on the site whose subject is other people's credibility
 * shared with no image, no `og:site_name` and no `og:type`. Every other route
 * that overrides `openGraph` restates all six for exactly this reason; this one
 * was written as if it were a patch.
 *
 * The image is the site-wide poster rather than a judge's portrait, and it stays
 * that way now that four of the cards ARE named people with their own
 * photographs. The original reason was that a stand-in would be presented as a
 * named person. The reason now is the reverse and just as good: picking one of
 * the four for the social card would put that judge's face on every share of
 * this page, which is a use of their likeness well past "we listed you on the
 * board" and not one anybody agreed to.
 */
export const metadata: Metadata = {
  title: "Review Judge Board",
  description: board.seoDescription,
  alternates: { canonical: "/review-judge-board" },
  openGraph: {
    type: "website",
    siteName: brand.name,
    title: "Practitioner Review Judge Board",
    description: board.seoDescription,
    url: "/review-judge-board",
    images: [
      {
        url: "/images/scenes/lesson-recording.jpg",
        width: 1600,
        height: 886,
        alt: "Roan Weigert recording a lesson at the studio microphone",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Practitioner Review Judge Board",
    description: board.seoDescription,
    images: ["/images/scenes/lesson-recording.jpg"],
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
            {/* Named judges and open seats counted apart, 9 Aug. This printed
                `board.members.length` as "judges", which was honest while every
                card was a vacancy described as a seat and stopped being honest
                the moment four of them became people. */}
            <FactsLine
              className="mt-4"
              items={[
                `${namedJudges.length} judges`,
                `${openSeats.length} seats open`,
                "Curriculum read each term",
                "Event panels",
              ]}
            />
          </div>
        </Container>
      </section>

      {/*
        An `<h2>` for screen readers only, added 8 Aug. The cards print `<h3>` on
        each discipline, which is right in the homepage band where a
        `SectionHeader` `<h2>` sits above them and wrong here, where there is no
        such heading: the document ran h1 to h3 with the level between missing, so
        anyone navigating by headings got six disciplines and nothing naming the
        list they belong to.

        Not printed, for the reason recorded above: the two group headings this
        page used to carry were cut for being two more than a list of six needs,
        and the h1 already says what these are.
      */}
      <Section ariaLabelledBy="judges-heading">
        <h2 id="judges-heading" className="sr-only">
          The judges
        </h2>

        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {board.members.map((m) => (
            <li key={m.id}>
              {/* `id` is passed here and nowhere else: this page is the one the
                  homepage teaser deep-links into, so this is the only render
                  where the seats are anchor targets. board-card.tsx has the
                  note on why it stopped deriving the id from the seat. */}
              <BoardCard
                member={m}
                id={m.id}
                courseTitle={m.reviews ? (byBadge.get(m.reviews)?.title ?? m.reviews) : undefined}
                checksAlwaysVisible
              />
            </li>
          ))}
        </ul>

        {/* The disclosure, back in words on the page that lists every card.
            content.ts carries the argument; the short version is that four
            photographed people above six identical stand-ins is the exact state
            where the arrangement stops disclosing on its own. */}
        <p className="t-meta mt-6 max-w-[720px] text-ink-muted">{board.footnote}</p>
      </Section>
    </>
  );
}
