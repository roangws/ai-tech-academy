import { Board } from "@/components/sections/board";
import { Closing } from "@/components/sections/closing";
import { HowModulesWork } from "@/components/sections/modules";
import { Faq } from "@/components/sections/faq";
import { Hero } from "@/components/sections/hero";
import { Instructors } from "@/components/sections/instructors";
import { Outcomes } from "@/components/sections/outcomes";
import { Courses } from "@/components/sections/courses";
import { Partners } from "@/components/sections/partners";
import { Teams } from "@/components/sections/teams";

/*
  Ten sections, from fourteen.

  ORDER. The catalog is the first thing under the fold, and the method is the
  section directly under it.

  That inverts what this page used to do. It opened with a credibility band and
  then a five-step diagram, so a visitor met a serial number and an abstraction
  before a single thing they could enrol in. Both were the site talking about
  itself. The catalog is the page's most concrete object and the one a reader
  came for, so it goes first, and the sections after it are people: who teaches,
  who learns together, who reviews.

  THE METHOD MOVED BACK UP, 7 Aug, because it stopped being a section of its
  own. It ran at the foot of the page, above the FAQ, on the argument that a
  reader who has already seen five paths saying "Profile, baseline, deploy,
  measure" meets the five steps as an answer rather than as a diagram. That was
  right about the order and wrong about the count: the module section up here
  was already showing those same five steps beside the course video, with the
  access state against each one, so the page stated the method twice and neither
  copy was complete. They are one section now, third on the page, and
  sections/modules.tsx has the note on what each half brought.

  WHAT WENT, and what it was repeating.

    ProofBand   "On the record", four chips: review board, book, keynote, patent
                number. The board has a whole section of its own further down
                that says what each seat reads, and a conference name and a
                USPTO serial persuade the fewest readers per pixel on the page.
                They ask to be believed 200px after a headline that promised to
                show. content.ts has the note and the place they would go back
                to, which is an about page rather than the second screen.

    Studio      A band titled "Every lesson is recorded, one lesson and one lab
                per module", 700px below a section titled "One lesson and one
                lab, every module", over an intro that was the instructor
                roster's intro reworded, over three photographs every one of
                which appears higher up the page: the room is the hero collage's
                second frame, the lesson recording is the hero lesson card's
                poster, and the interview session is the course video's poster.
                Nothing photographic was lost, because it held nothing the page
                did not already show.

    Categories  A skill cloud in five columns, each headed by a path badge and
                that path's audience line, both printed on that path's cover one
                section above in the same order. The skills were the only new
                thing in it, so they moved onto the catalog cards and the
                section went. content.ts has the full note.

    Actions     Three tiles whose first read "Watch the open module / 14
                minutes, open to everyone", directly above a call to action
                reading "Module 1 is open. It takes 14 minutes." Merged into the
                closing band, which is now one section instead of two.

  WHAT CHANGED SHAPE. Every section here was the same object: full-bleed band,
  1216px container, left eyebrow, 28px heading, intro, grid. Fourteen of those
  is one idea repeated, and a 6% swing between white and #EEF3F7 is not enough
  to break it. Teams and Closing are now inset dark panels rather than bands,
  which is the pattern the Coursera and Udemy captures use, and two of them is
  what makes it a shape the page owns rather than a one-off. `Panel` in ui.tsx
  has the note.

  The catalog cards changed with the Categories removal: modules 02 and 03 came
  off the four small cards and each card gained its own skills. The rows that
  went were the five-step spine's third appearance in a row, after the method
  section states it in full and before the course outline states it again with
  the access model attached.

  EARLIER REMOVALS, kept here because they answer the same question. `topbar`
  shipped as an audience strip and spent 32px above a 72px header offering a
  choice between "For individuals" and "For teams" when there is one enrolment
  here. `goals` shipped as a role router, five tiles asking the reader to choose
  a path before the catalog had told them what they were choosing between.
  `rail` was a three-column list of the same five paths two sections from the
  catalog that lists them.

  WHAT CAME BACK, 9 Aug: a partner band, under the board. It is the tenth
  section and the first addition since the cut.

  Four blocks in mockups/learning-marketplace-blocks.html still need a fact this
  program does not have, which is the failure mode the brief guards against:
  `quotes` needs named learners, `plusband` needs a subscription, `statband`
  needs a second oversized figure, and `careers` needs salary and open-role
  counts. `logostrip` was the fifth until Roan named two community partners, and
  the band that answers it is not a logo strip — sections/partners.tsx has the
  note on why two marks alone were not enough to build one from, and on why it
  sits under the board rather than under the fold where every capture puts one.

  Ground rhythm, in order: white, tint, white, tint, white, white, tint, white,
  white, white. The lock is that no two tinted bands sit next to each other, and
  that holds — but only after the FAQ went white in the same pass that merged the
  method, since removing a white band from between the board and the FAQ left
  two tints touching. faq.tsx has that note. Teams and Closing are white grounds
  carrying a dark panel. Three sections take `hairlineTop`, each because it
  follows a section that draws no bottom border of its own: Teams after
  Instructors, the FAQ after the new white partner band, and Closing after the
  FAQ. A tinted band already draws its own, so asking for a hairline under one
  stacks two rules into a 2px line — which is why Partners takes none, sitting
  as it does directly under the tinted board.
*/
/**
 * One hour, and the enrol button is the only reason for it.
 *
 * The page is otherwise entirely static and should be: nothing on it is
 * per-request. But the enrol control now prints today's date, and a fully
 * prerendered page bakes in whatever the date was at build time, so a site
 * deployed on Monday would still be telling Friday's reader that it starts on
 * Monday for the one frame before hydration.
 *
 * `StartDate` corrects it on the client, which is where the reader's own
 * timezone lives, so this is belt and braces rather than the mechanism: it caps
 * how stale the prerendered string can be at an hour instead of at a deploy.
 * That matters for a reader whose JavaScript has not arrived yet, and for
 * anything that reads the HTML without running it.
 */
export const revalidate = 3600;

export default function HomePage() {
  return (
    <>
      <Hero />
      <Courses />
      <HowModulesWork />
      <Outcomes />
      <Instructors />
      <Teams />
      <Board />
      <Partners />
      <Faq />
      <Closing />
    </>
  );
}
