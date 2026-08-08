import type { Metadata } from "next";
import Link from "next/link";
import { InstructorCard, InstructorLeadCard } from "@/components/instructor-card";
import { Container, FactsLine, Section } from "@/components/ui";
import { instructors } from "@/lib/content";
import { instructorsJsonLd } from "@/lib/seo";

/**
 * SEO, and every field here is either derived from the roster or written for
 * this page rather than borrowed from the homepage.
 *
 * `title` is the bare noun. The root layout's template appends the brand, so
 * the tab and the result line read "Instructors | AI Tech Education Academy" —
 * writing the brand in here again would print it twice.
 *
 * `openGraph.images` is the lesson-recording frame, and the first version of
 * this file got it wrong for a defensible reason: a shared link to a roster
 * should preview a person, so it used Roan's studio portrait. That file is
 * 805x1200. Social cards render at about 1.91:1, so a portrait is centre-cropped
 * to a band across the middle of it — on a head-and-shoulders frame, a crop that
 * lands on the chin. The frame here is 1600x886, which is 1.81 and the closest
 * thing in the library to the target, and it shows Roan recording a lesson, so
 * it still previews a person.
 *
 * Dimensions are declared rather than left to the crawler: a card renderer that
 * has to fetch and measure the file often gives up and falls back to the small
 * layout.
 *
 * `keywords` names the four disciplines and the two roles, which is what this
 * page can actually answer a query about. No individual's name is in the list:
 * the people are in the markup as `Person` records with `sameAs` links, which is
 * the machine-readable way to say "this is that person" and does not require
 * guessing at how somebody searches for themselves.
 */
export const metadata: Metadata = {
  title: "Instructors",
  description: instructors.seoDescription,
  keywords: [
    "AI course instructors",
    "developer experience engineer",
    "developer advocate",
    "AI in higher education",
    "AI for film and media",
    "who teaches applied AI",
  ],
  alternates: { canonical: "/instructors" },
  openGraph: {
    /* `website`, not `profile`. The Open Graph `profile` type describes one
       person and carries first name, last name and username; this page is five
       people, and typing it as a profile makes every consumer of the tag ask
       which one. The five are declared as `Person` records in the JSON-LD
       instead, which is the vocabulary that can hold five. */
    type: "website",
    title: instructors.headline,
    description: instructors.seoDescription,
    url: "/instructors",
    images: [
      {
        url: "/images/scenes/lesson-recording.jpg",
        width: 1600,
        height: 886,
        alt: "Roan Weigert recording a lesson at the studio microphone",
      },
    ],
  },
};

/**
 * The full roster.
 *
 * ---------------------------------------------------------------- the shape
 *
 * The same two objects as the homepage band, in the same order, from the same
 * component module: the lead as a full-width feature, then the four specialists
 * as portrait cards. Nothing is restyled for the page. A roster page that
 * invented a second treatment of the same five people would be asking a reader
 * who arrived from the homepage to recognise them twice.
 *
 * What differs is the fold and the layout of the four, and both differences are
 * the ones /review-judge-board makes for the same reasons.
 *
 * THE FOLD. `SectionHeader` renders an `<h2>`, so a route built out of sections
 * alone ships with no `<h1>` and no way back to the site. The breadcrumb and the
 * display heading below are the same block that page uses.
 *
 * THE FOUR ARE A WRAP, NOT A RAIL. The band puts them on a snap rail below xl
 * because it is a teaser in a column of nine other sections and a rail says
 * "there are more of these, keep going". This page is the destination, so
 * nothing here should ask to be swiped past.
 *
 * The cards are a fixed 292px instead of a grid fraction, which is the whole
 * lesson of the rebuild note in sections/instructors.tsx applied to a different
 * container: these portraits are 805x1200 head-and-shoulders frames and
 * `object-cover` fixes the rendered head at 0.93x the card's *width*, so a card
 * that takes its width from a column count renders a different-sized face at
 * every breakpoint. Fixing the card and letting the row count fall out of the
 * container inverts that. Four fit at 1216, three at 960, two at 720, and every
 * one of them is the 292px card the arithmetic was done for.
 *
 * `scroll-mt-24` on each card, because the homepage cards will want to link to
 * an individual here the way the board's do, and a bare fragment lands the
 * target under the 72px sticky header.
 */
export default function InstructorsPage() {
  const [lead, ...specialists] = instructors.people;

  return (
    <>
      {/*
        The roster as `Person` records. On the page rather than in the root
        layout, because this is the only route that shows these five and a
        graph is only worth emitting where the page corroborates it. lib/seo.ts
        has the note on what each record carries and what it refuses to.
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: instructorsJsonLd().replace(/</g, "\\u003c") }}
      />

      {/* A bare section rather than `Section`: the h1 block wants tighter air
          under it than `Section`'s symmetric padding gives. */}
      <section className="border-b border-line bg-surface pt-6 pb-8 md:pt-8 md:pb-10">
        <Container>
          <nav aria-label="Breadcrumb" className="t-meta text-ink-muted">
            <Link href="/" className="text-ink-muted no-underline hover:text-accent hover:underline">
              Home
            </Link>
            <span className="px-1.5 text-line-strong">/</span>
            <span className="text-ink-secondary">Instructors</span>
          </nav>

          <div className="mt-3 max-w-[720px]">
            <h1 className="t-display text-ink [text-wrap:balance]">{instructors.headline}</h1>
            <p className="t-body mt-3 max-w-[640px] text-ink-secondary">{instructors.pageIntro}</p>
            {/* Derived, and the third item is the one fact about this roster a
                reader cannot get from the cards: every person here has a public
                profile to check them against, which is the standard the whole
                page is built to. */}
            <FactsLine
              className="mt-4"
              items={[
                `${instructors.people.length} instructors`,
                "One lead, four specialists",
                "Every profile links out",
              ]}
            />
          </div>
        </Container>
      </section>

      {/*
        An `<h2>` that only a screen reader gets, and it is a fix rather than a
        flourish.

        The cards carry `<h3>` on each name, which is right in the homepage band
        where `SectionHeader` prints an `<h2>` above them. On a route there is no
        such heading, so the document ran h1 to h3 with the level in between
        missing, and a reader navigating by headings — which is how a screen
        reader user finds anything on a page this long — got a list of five names
        with no parent to tell them what the list is.

        It is not printed because the fold above it already says so twice, in the
        h1 and in the first line under it, and /review-judge-board settled the
        question of visible group headings on a roster: two headings for six
        cards were cut for being two more than a list of six needs.
      */}
      <Section ariaLabelledBy="roster-heading">
        <h2 id="roster-heading" className="sr-only">
          The instructors
        </h2>

        <div className="flex flex-col gap-4">
          <div id={lead.id} className="scroll-mt-24">
            <InstructorLeadCard person={lead} />
          </div>

          {/*
            The cards are `w-full` on a phone and 292 from sm. The first build
            carried the band's `w-[70vw] max-w-[292px]` across, which is rail
            sizing: on a rail the 85px it leaves at the right edge of a 390px
            screen is the next card peeking out, and on a page that scrolls
            vertically it is 85px of nothing beside a card that is flush with the
            fold and the lead card above it.

            Full width costs nothing the arithmetic cares about. The card is
            `aspect-[2/3]` at every size and `object-cover` scales the head to
            0.93x the width, so a 358px card renders a 333px head on a 537px
            card — the same 62% of the frame the 292px card gives. What the
            rebuild was fighting was a card forced wide by a bento while its row
            stayed short, which is a different thing entirely.
          */}
          <ul className="flex flex-wrap gap-4">
            {specialists.map((person) => (
              <li
                key={person.id}
                id={person.id}
                className="flex w-full scroll-mt-24 sm:w-[292px]"
              >
                <InstructorCard person={person} />
              </li>
            ))}
          </ul>
        </div>
      </Section>
    </>
  );
}
