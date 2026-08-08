import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  About,
  CourseClosing,
  MoreCourses,
  WhatYouLearn,
} from "@/components/course/blocks";
import { Curriculum } from "@/components/course/curriculum";
import { EnrollRail } from "@/components/course/enroll-rail";
import { CourseHero, StatBar } from "@/components/course/hero";
import { Questions } from "@/components/course/questions";
import { CourseTabs } from "@/components/course/tabs";
import { Container } from "@/components/ui";
import { courses, totalLessons } from "@/lib/content";

/**
 * One course, in full.
 *
 * This is the page every card in the catalog has linked to since the catalog
 * existed. Five of those links were dead, which is what this route fixes, and the
 * layout is modelled on the Udemy course page Roan captured on 7 Aug.
 *
 * -------------------------------------------- WHAT WAS COPIED AND WHAT WAS NOT
 *
 * Copied: the dark hero, the stat bar straddling its edge, the bordered "What you
 * will learn" box, the includes list, the sticky enrol rail in a 352px right
 * column, the deep curriculum accordion, requirements, description, the instructor
 * block, and a cross-sell row.
 *
 * Not copied, and each for the same reason: the star rating, the ratings count, the
 * learner count, the price, the struck-through price, the discount percentage, the
 * countdown, the coupon field, and the student review grid. None of those facts
 * exists for this program. DESIGN-SPEC.md already forbade two of them in writing
 * ("No rating stars (no ratings exist - do not fake them). No price (nothing is for
 * sale)"), and inventing the rest to fill a layout is how a page that is trying to
 * establish credibility loses it.
 *
 * Every one of those slots is still occupied, which is the part worth understanding
 * about this page: the geometry is the reference's and the content is true. The
 * rating row is four facts about the course, the price block is the access model,
 * and the review grid is absent rather than substituted because a fabricated
 * testimonial has no honest equivalent. The individual notes are in
 * course/hero.tsx and course/enroll-rail.tsx.
 *
 * ------------------------------------------------------------------- THE BANDS
 *
 * ink, white, white, tint, white, tint, white. No two tints adjacent, which is the
 * rule in DESIGN-SPEC.md, and exactly one dark ground, which is Amendment 2.
 *
 * The hero and the stat bar are two elements of one visual band and have to stay
 * adjacent in that order: the straddle is built from document order and a negative
 * margin rather than from positioning, so anything inserted between them breaks it.
 * course/hero.tsx has the geometry.
 */
export const revalidate = 3600;

/**
 * All five, prerendered, and nothing else.
 *
 * `dynamicParams = false` makes any other id a 404 at the routing layer rather than
 * letting it reach the component and call `notFound()` at request time. The set of
 * courses is a five-item array in content.ts, so there is no case where a valid id
 * is unknown at build.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return courses.map((c) => ({ id: c.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const course = courses.find((c) => c.id === id);
  if (!course) return {};

  return {
    /* A plain string, because the root layout's template appends the brand. */
    title: course.title,
    description: course.tagline,
    alternates: { canonical: `/courses/${course.id}` },
    openGraph: {
      title: course.title,
      description: course.tagline,
      url: `/courses/${course.id}`,
      /* The course's own cover, so a shared link shows the course rather than the
         site. `alt` is the frame's description from content.ts. */
      images: course.cover
        ? [{ url: course.cover.src, width: 1600, height: 900, alt: course.cover.alt }]
        : undefined,
    },
  };
}

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = courses.find((c) => c.id === id);
  if (!course) notFound();

  return (
    <>
      <CourseHero course={course} />

      {/*
        The body, and the two negative margins here are the whole structure of the
        fold. Both are measured from the dark band's bottom edge, which is what makes
        them independent of how tall any given course's title runs.

        The band's bottom padding steps with the breakpoint and so does the pull, so
        there are two sets of numbers, not one. Measured, not derived:

          md   pb-16      pull 44   bar 44 of 93 over the ink (47%)   20px clear ink
          lg   pb-[88px]  pull 56   bar 56 of 92 over the ink (61%)   32px clear ink

          - "clear ink" is the gap between the byline above and the card's top edge,
            which is the padding minus the pull.
          - the rail is pulled up a further 208 on top of the 56, so its top lands
            264px above the band edge, about a third of the way down the dark. That
            is the reference's arrangement: the card starts inside the dark and
            finishes well below it, so the fold reads as one object rather than two
            stacked bands.

        The two straddle ratios differ by 14 points and nobody has decided that is
        wrong; 47% at md is a card sitting on the edge and 61% at lg is a card lying
        over it. If they should agree, `md:-mt-[57px]` is the change.

        Nothing is positioned and nothing sets z-index. This container comes after the
        dark section in document order, so it paints on top by ordinary paint order.
        That matters: the sticky header and the glass buttons rely on `-z-10` layers
        inside their own stacking contexts, and a new stacking context here would have
        worked and quietly broken a control elsewhere.

        THE RAIL IS FIRST IN THE SOURCE and placed into column 2 explicitly. That is
        the only arrangement correct at both widths at once. Below lg it is the first
        thing after the stat bar, which is where a reader wants the enrol control and
        what the reference does on a phone. At lg it is second in the tab order, ahead
        of a 900px accordion, rather than last. `col-start` / `row-start` rather than
        `order-*`, so visual order and DOM order agree by construction.

        DO NOT ADD `items-start` to this grid. The aside keeps its default stretch so
        its area spans all four rows, and that tall area is the containing block the
        rail sticks within. Without it the rail stops sticking, with no error
        anywhere. Nor may any of this be wrapped in a `Panel`, which is
        `overflow-hidden`, for the same reason.

        352px for the rail leaves the left column 824px inside the 1216 container,
        enough for an accordion row to hold its number, an eight-word module title, a
        lesson count and two chips without truncating.
      */}
      {/*
        `flow-root`, and without it none of the arithmetic above happened.

        This div has padding on the bottom only, so the container's negative
        top margin had nothing to collapse against and collapsed *through* the
        parent: the white ground came up with it (44 at md, 56 at lg), the band's
        painted edge moved to meet the card's top, and the overlap measured zero at
        every width. It looked like a card butted against a band, which is what
        Roan photographed.

        `display: flow-root` gives this div its own block formatting context, so
        the margin stays on the child. The white ground now ends where the band
        ends and the container hangs 56px above it, over the ink.

        Not `overflow-hidden`, which also stops the collapse and would clip the
        overhang it exists to allow, and would kill the sticky rail as well.
      */}
      <div className="flow-root bg-surface pb-8 md:pb-14 lg:pb-16">
        <Container className="md:-mt-[44px] lg:-mt-[56px]">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_352px] lg:gap-10">
            <div className="lg:col-start-1 lg:row-start-1">
              <StatBar course={course} />
            </div>

            <aside
              aria-label="Enrol in this course"
              className="lg:col-start-2 lg:row-start-1 lg:row-span-4 lg:-mt-[208px]"
            >
              <EnrollRail course={course} />
            </aside>

            {/* The section row sits directly under the bar, which is where Coursera
                puts it and why the bar is the last thing before it: the two read as
                one masthead for the page rather than as a card and a nav. */}
            <div className="lg:col-start-1 lg:row-start-2">
              <CourseTabs />
            </div>

            <div className="lg:col-start-1 lg:row-start-3">
              <WhatYouLearn course={course} />
            </div>

            {/*
              "Every module includes" used to sit here as well as in the rail, on the
              argument that one is read while deciding and one while scanning. On
              screen they were the identical five rows, both visible at once, 700px
              apart. The reference has a list in each of these places too, but they
              carry different facts; ours did not, so this one is gone.
            */}
            <div id="curriculum" className="scroll-mt-[84px] lg:col-start-1 lg:row-start-4">
              <Curriculum modules={course.curriculum} totalLessons={totalLessons(course)} />
            </div>
          </div>
        </Container>
      </div>

      <About course={course} />
      <Questions />
      <MoreCourses currentId={course.id} />
      <CourseClosing course={course} />
    </>
  );
}
