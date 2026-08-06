import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Actions } from "@/components/sections/actions";
import { Board } from "@/components/sections/board";
import { Categories } from "@/components/sections/categories";
import { Course } from "@/components/sections/course";
import { Faq } from "@/components/sections/faq";
import { FinalCta } from "@/components/sections/final-cta";
import { Goals } from "@/components/sections/goals";
import { Hero } from "@/components/sections/hero";
import { Instructors } from "@/components/sections/instructors";
import { Method } from "@/components/sections/method";
import { Outcomes } from "@/components/sections/outcomes";
import { Paths } from "@/components/sections/paths";
import { ProofBand } from "@/components/sections/proof-band";
import { Studio } from "@/components/sections/studio";
import { Teams } from "@/components/sections/teams";

/*
  Section order follows the 6 Aug review, plus three blocks ported from
  mockups/learning-marketplace-blocks.html.

  WHAT CAME ACROSS, and where each one sits:

    Goals       marketplace `goals`       role router, ahead of the catalog
    Categories  marketplace `categories`  skill cloud, straight after it
    Studio      marketplace `careers`     the photograph band
    Actions     marketplace `actions`     last routing chance before the CTA

  The fifth, `topbar`, shipped as an audience strip and has since been removed.
  It spent 32px above a 72px header offering a choice between "For individuals"
  and "For teams" when there is one enrolment here and the teams section
  describes several people each taking their own path. content.ts has the note.

  WHAT DID NOT, and why. Five blocks in that file need a fact this program does
  not have, and inventing one is the failure mode the brief guards against:

    logostrip   needs partner logos. There are no partners.
    quotes      needs named learners. One deployment exists and its learner is
                not named, which is why the standalone learner story is already
                held out of this page.
    plusband    needs a subscription. Nothing is for sale.
    statband    needs a second oversized figure. The 56px before-and-after in
                Outcomes is the one element on the page allowed above 44px.
    careers     the block shape came across for Studio. Its salary and
                open-roles fields did not, since both would be invented.

  A sixth, `rail`, was left out as duplication rather than fabrication: a
  three-column rail of the same five paths, sitting two sections from the
  catalog that already lists them, adds a row and no information.

  Ground rhythm, in order: white, tint, white, white, tint, white, white, tint,
  white, tint, dark, tint, white, white, tint. The lock is that no two tinted
  bands sit next to each other, and that holds. The four new sections do create
  white runs, so each one takes `hairlineTop` and the rule carries the join.
*/
export default function HomePage() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-[var(--radius-control)] focus:bg-accent focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        <Hero />
        <ProofBand />
        <Goals />
        <Method />
        <Paths />
        <Categories />
        <Course />
        <Outcomes />
        <Instructors />
        <Studio />
        <Teams />
        <Board />
        <Faq />
        <Actions />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
