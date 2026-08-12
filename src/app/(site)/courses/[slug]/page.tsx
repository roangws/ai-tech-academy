import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  About,
  CourseCertificate,
  CourseClosing,
  MoreCourses,
  WhatYouLearn,
} from "@/components/course/blocks";
import { Curriculum } from "@/components/course/curriculum";
import { CourseInstructors } from "@/components/course/instructors";
import { CoursePreview } from "@/components/course/preview";
import { EnrollRail } from "@/components/course/enroll-rail";
import { CourseHero, StatBar } from "@/components/course/hero";
import { Questions } from "@/components/course/questions";
import { CourseTabs } from "@/components/course/tabs";
import { Container } from "@/components/ui";
import { brand } from "@/lib/content";
import { getCatalog, getCourseBySlug, totalLessons } from "@/lib/catalog";
import { getCourseInstructors, getInstructors } from "@/lib/roster";
import { courseJsonLd } from "@/lib/seo";

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
 * The tint moved one band later on 9 Aug, when the completion record landed here
 * from the homepage and Roan asked for it on the tinted ground. `About` was the
 * tinted band and is now white with a hairline; the record has the tint. Same
 * sequence, different occupant — and it has to stay a swap rather than an addition,
 * because a tint on both would put two of them side by side.
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
 * `dynamicParams = false` makes any other slug a 404 at the routing layer rather
 * than letting it reach the component and call `notFound()` at request time. The
 * set of courses is a five-item array in content.ts, so there is no case where a
 * valid slug is unknown at build.
 *
 * That is also what makes the redirects in next.config.ts load-bearing rather
 * than a courtesy: with dynamic params off, `/courses/gtm` cannot fall through
 * to a lookup that knows about ids. It is a hard 404 unless the config rewrites
 * it first.
 */
export const dynamicParams = true;

/**
 * Prerender what exists at build; serve anything newer on demand.
 *
 * This was `dynamicParams = false`, which made an unrecognised slug a 404 at the
 * routing layer. That was correct while the catalogue was a five-item array in
 * content.ts — there was no case where a valid slug was unknown at build.
 *
 * There is now. A course created in the admin console has a slug that did not
 * exist when this deployment was built, and with dynamic params off its page
 * would 404 until somebody redeployed the site. That is the same "you have to be
 * a programmer to run this" failure the catalogue move exists to end, wearing a
 * different hat.
 *
 * So unknown slugs render on demand and are cached from then on. `notFound()` in
 * the component is what answers a slug that genuinely does not exist, which is
 * the check that was being done twice.
 */
export async function generateStaticParams() {
  return (await getCatalog()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) return {};

  const path = `/courses/${course.slug}`;

  return {
    /*
      `seoTitle`, not `title`, and the two differ on every course.

      The h1 is "Applied AI for GTM teams", which is right on the page — the
      reader is already inside the catalog and the surrounding chrome supplies
      everything else. In a result listing there is no chrome: the same six
      words compete against titles that state the format, the price and the
      outcome. The layout template appends " | AI Tech Education Academy" to
      whatever this returns, so the string here is written to survive that and
      still land under the ~60 character mark search results truncate at.
    */
    title: course.seoTitle,
    /*
      `seoDescription`, not `tagline`, for the same reason and one more: the
      taglines run 150 to 190 characters and a description is cut around 155.
      Two of the five were losing their last clause, which is the clause that
      says what the reader ends up with.
    */
    description: course.seoDescription,
    keywords: [...course.keywords],
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: brand.name,
      title: course.seoTitle,
      description: course.seoDescription,
      url: path,
      /* The course's own cover, so a shared link shows the course rather than the
         site. `alt` is the frame's description from content.ts, and so are the
         dimensions — these were hardcoded `1600x900`, which none of the five
         covers is. Four are 1400x781 and the GTM cover is a 1127x1400 portrait,
         so the one course whose card is shared most was declaring the opposite
         orientation to the file behind it. */
      images: course.cover
        ? [
            {
              url: course.cover.src,
              width: course.cover.width,
              height: course.cover.height,
              alt: course.cover.alt,
            },
          ]
        : undefined,
    },
    /*
      Declared per course rather than inherited. The root layout's Twitter card
      names the site's own poster frame, so without this every one of the five
      shared as the same image with a course-specific title under it.
    */
    twitter: {
      card: "summary_large_image",
      title: course.seoTitle,
      description: course.seoDescription,
      images: course.cover ? [course.cover.src] : undefined,
    },
  };
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  /* The lead instructor, for the structured data below. A query rather than
     `instructors.people[0]`: the roster moved into Postgres, so the person this
     page names as the course's instructor has to come from the same place the
     roster page names them from, or the two can disagree. */
  const [lead] = await getInstructors();

  /* The people credited on THIS course, which is a different list from the
     roster and is why `course_instructors` exists: the lead teaches all five
     today, Patrick teaches the film course, and three specialists teach the
     literacy course. Assigned in the console, ordered there too. */
  const teaching = await getCourseInstructors(course.id);

  return (
    <>
      {/*
        schema.org `Course`, and it is the reason this page can win a listing it
        would otherwise only appear in.

        A course page without structured data is a document with a title. With
        it, the page is eligible for the course result treatment, and the fields
        that treatment reads are exactly the ones this program can back:
        provider, instructor, mode of delivery, module count, and a price of
        zero, which is a real offer rather than a claim.

        WHAT IS NOT IN HERE, and the omissions are the same list the visible page
        keeps: no `aggregateRating`, no `review`, no `ratingCount`, no enrolment
        figure, no `timeRequired` beyond the stated course length. Those are the
        fields that lift a listing hardest, which is precisely why inventing them
        is the thing a program establishing credibility cannot do — and Google
        drops structured data it can find no on-page evidence for, so a fake
        rating buys a manual action rather than a star.

        `hasCourseInstance` with `courseWorkload` is required for the course
        treatment to render at all. Self-paced, so `courseSchedule` is absent and
        the mode is online.

        Injected with `<script type="application/ld+json">` rather than through a
        metadata field, because Next's Metadata API has no slot for JSON-LD. This
        is a server component, so the string is serialized at build.
      */}
      <script
        type="application/ld+json"
        /* The content is five literals from content.ts run through
           JSON.stringify, so there is no user input anywhere in it. The `<`
           escape is the standard guard against a `</script>` sequence inside a
           string field closing the tag early. */
        dangerouslySetInnerHTML={{ __html: (lead ? courseJsonLd(course, lead) : "{}").replace(/</g, "\\u003c") }}
      />

      <CourseHero course={course} lead={lead} />

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
              className="lg:col-start-2 lg:row-start-1 lg:row-span-5 lg:-mt-[208px]"
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
            {/*
              The teaching roster, directly above "Course content" and inside the
              left column rather than as a band of its own.

              It answers the question a reader has at exactly this point — they
              have just read what they will learn and are about to read how it is
              taught — and it has to be answered before the curriculum rather than
              after it, which is where a full-width band under the fold would have
              put it. Roan asked for it here.

              Row 4, so the curriculum is row 5 and the aside spans five. Those two
              numbers move together: the rail sticks inside the aside's grid area,
              and an area that stops short of the last row stops the stick early.
            */}
            <div id="instructors" className="scroll-mt-[84px] lg:col-start-1 lg:row-start-4">
              <CourseInstructors people={teaching} />
            </div>

            <div id="curriculum" className="scroll-mt-[84px] lg:col-start-1 lg:row-start-5">
              {/* The preview goes INSIDE module 01's panel rather than under the
                  whole accordion — curriculum.tsx has the note on why, and on
                  why it has to arrive as a rendered element rather than as an
                  import. It renders nothing when the course has no video yet, in
                  which case the panel is unchanged. */}
              <Curriculum
                modules={course.curriculum}
                totalLessons={totalLessons(course)}
                preview={<CoursePreview course={course} />}
              />
            </div>
          </div>
        </Container>
      </div>

      <About course={course} />
      {/* The completion record, moved off the homepage on 9 Aug and given the tinted
          ground Roan asked for. It sits between the prose and the questions because
          that is the order the two answer in: what this course is, what you are left
          holding, then whatever is still unclear. `About` gave up its tint for it —
          both bands cannot have one, and blocks.tsx has the note on both sides. */}
      <CourseCertificate course={course} />
      <Questions lead={lead} />
      <MoreCourses currentId={course.id} />
      <CourseClosing course={course} />
    </>
  );
}
