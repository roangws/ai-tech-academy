import type { Metadata } from "next";
import Link from "next/link";
import { BoardCard } from "@/components/board-card";
import { Container, FactsLine, Section } from "@/components/ui";
import { board, brand } from "@/lib/content";

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
 * instruction, and now moot: the photographs are real.
 *
 * ---------------------------------------------------------------- what it is
 *
 * ONE FLAT LIST, which is the correction Roan made and not a simplification of
 * the same idea. The cards were grouped under "One seat per course" and "Across
 * every course", which asserted that this board is organised by course and that
 * one member is the exception to it. It is not organised that way: they are
 * judges, they judge the curriculum and they judge the events.
 *
 * THE VACANCIES ARE GONE, removed 9 Aug at Roan's instruction, and with them the
 * stand-in portrait that was repeated on six of the ten cards and the footnote
 * that had to disclose it. Every card here is now a person.
 *
 * The cards link, which they did not before. That objection was specific and it
 * no longer holds: a card titled with a discipline and stretched into a link
 * announced "Revenue operations, link" and landed on a course page, which is a
 * mismatch between the accessible name and the destination. A card titled with a
 * person's name, linking to that person's profile, is the opposite.
 *
 * `detailAlwaysVisible` is the one thing the card does differently from the
 * homepage carousel, which hides the employer and location behind a hover. This
 * page exists to list these judges, and a touch screen never fires that hover.
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
            {/* "N seats open" is gone, 9 Aug. There are no open seats left to
                count, and Roan read the line as stray copy even before that:
                a page introducing five practitioners does not lead with how
                many people are missing from it. The two facts that remain name
                the two jobs, which is what the page is about. */}
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

        {/*
          TALLER CARDS THAN THE HOMEPAGE RAIL, and this is the page Roan meant
          when he asked for the portraits to look good.

          The rail's card is 240 x 340, which is roughly 3:4 and frames a head
          and shoulders properly. This grid draws the same component about 400
          wide, and it was drawing it at the rail's fixed 340 tall — so at three
          columns the frame was landscape, and a portrait photograph in a
          landscape frame gets cropped to a face with the top of the head and the
          shoulders cut off. `aspect-[3/4]` gives the picture back its shape at
          every column count.

          `sizes` matches this layout rather than the rail's. It said `240px`
          here too, so the browser was picking a candidate for a box 40% narrower
          than the one it drew into and scaling it up. That is the softness, and
          it is invisible in code review because a wrong `sizes` never errors.
        */}
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {board.members.map((m) => (
            <li key={m.id} className="aspect-[3/4]">
              {/* `id` is passed here and nowhere else: this page is the one the
                  homepage teaser deep-links into, so this is the only render
                  where the judges are anchor targets. board-card.tsx has the
                  note on why it stopped deriving the id itself. */}
              <BoardCard
                member={m}
                id={m.id}
                sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 400px"
                detailAlwaysVisible
              />
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
