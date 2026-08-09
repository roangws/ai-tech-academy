import type { Metadata } from "next";
import Link from "next/link";
import { CourseGlyph } from "@/components/course/icons";
import { CourseCard } from "@/components/sections/courses";
import { EnrollButton, Panel, Section, SectionHeader } from "@/components/ui";
import { brand, catalog, courseHref, courses } from "@/lib/content";
import { catalogJsonLd } from "@/lib/seo";

/**
 * The catalog, as a page.
 *
 * Until 8 Aug the five course pages had no parent. The catalog was a band two
 * thirds of the way down the homepage, so `/#courses` was the closest thing to
 * an index, and content.ts has the three reasons that was wrong. The shortest of
 * them: every course page's breadcrumb says "Courses / <this course>", and its
 * first item pointed at a scroll position rather than a page.
 *
 * ------------------------------------------------------------------ THE SHAPE
 *
 * A jump list, the five cards, then prose. That order is deliberate and it is
 * the reverse of how an SEO index page is usually built.
 *
 * The cards are what a reader came for and they go as close to the top as a
 * heading allows. The prose is underneath because it is written for the two
 * readers the cards do not serve: somebody who cannot tell which of five to
 * pick, and a crawler that needs more than five titles to understand what the
 * page is about. Putting it above the grid would make everybody read an essay to
 * reach a list.
 *
 * The jump list is between them and is the one piece of this that is not
 * obvious. Five cards is a short grid on a desktop and a 3,000px column on a
 * phone, so the row of course names with their glyphs is what makes the page
 * usable at the bottom of that column. It is also the only place on the site
 * where the five glyphs from course/icons.tsx are laid out together, which is
 * what teaches them before they turn up in the header menu.
 *
 * ----------------------------------------------------------- REUSING CourseCard
 *
 * Not reimplemented, for the reason blocks.tsx already records: the card carries
 * about eighty lines of argued-over anatomy including the reserved heights that
 * keep a row sharing one internal grid, and a second copy drifts within a week.
 * This is its third call site.
 *
 * The featured/lead treatment from the homepage is deliberately NOT used here.
 * On the homepage the wide lead card is a worked example of what any course
 * looks like inside, which is what a first-time visitor needs. On an index the
 * reader has already decided to compare, and promoting one of five on a page
 * whose whole job is to lay them side by side would be an emphasis the program
 * cannot justify — the note in sections/courses.tsx makes the same argument
 * about why a lead card is not a claim that Course A is better.
 */
export const metadata: Metadata = {
  title: catalog.seoTitle,
  description: catalog.seoDescription,
  keywords: [...catalog.keywords],
  alternates: { canonical: "/courses" },
  openGraph: {
    type: "website",
    siteName: brand.name,
    title: catalog.seoTitle,
    description: catalog.seoDescription,
    url: "/courses",
    /* The lead course's cover. A grid of five has no image of its own, and the
       alternative is the site-wide poster frame, which is what every other
       shared link already previews.

       The dimensions come off the image now. They were `1600x900` against a
       file that is 1127x1400, so this page declared a portrait as a landscape
       card. content.ts carries the real numbers beside each `src`. */
    images: courses[0]?.cover
      ? [
          {
            url: courses[0].cover.src,
            width: courses[0].cover.width,
            height: courses[0].cover.height,
            alt: courses[0].cover.alt,
          },
        ]
      : undefined,
  },
  twitter: {
    card: "summary_large_image",
    title: catalog.seoTitle,
    description: catalog.seoDescription,
    images: courses[0]?.cover ? [courses[0].cover.src] : undefined,
  },
};

export default function CoursesPage() {
  return (
    <>
      {/*
        An `ItemList` of the five courses, plus the breadcrumb.

        The list is what tells a crawler this page is the index for the five
        `Course` records rather than a sixth page that happens to mention them,
        and it is the piece that makes each course page's "Courses" breadcrumb
        resolve to something. lib/seo.ts has what is deliberately absent.
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: catalogJsonLd().replace(/</g, "\\u003c") }}
      />

      {/*
        The masthead is a plain white band rather than the course pages' ink one.
        Amendment 2 grants one dark ground per page and this page spends it at
        the bottom, on the closing panel, which is where the decision happens.
        A dark fold here would also make the index look like a sixth course.
      */}
      <Section>
        {/* A one-item trail. The course pages' trail is "Courses / <course>",
            so this page is the thing their first item points at, and a reader
            who arrives here from one of them needs the same route home. */}
        <nav aria-label="Breadcrumb" className="t-meta">
          <ol className="flex flex-wrap items-center gap-x-2">
            <li>
              <Link
                href="/"
                className="text-ink-muted no-underline transition-colors hover:text-accent hover:underline"
              >
                Home
              </Link>
            </li>
            <li aria-hidden="true" className="text-line-strong">
              /
            </li>
            <li>
              <span aria-current="page" className="text-ink-muted">
                Courses
              </span>
            </li>
          </ol>
        </nav>

        <div className="mt-4">
          {/* `as="h1"`. This is the page's title, not a band inside a page
              whose title is elsewhere, and without it the document outline
              started at h2 and the page had no heading at all for a screen
              reader jumping by level. */}
          <SectionHeader
            as="h1"
            label={catalog.label}
            heading={catalog.heading}
            intro={catalog.intro}
          />
        </div>

        {/* A heading for the grid, and it is `sr-only` because the page does not
            want a visible one: the h1 and its intro directly above already say
            what the grid is, and a second visible title 20px under them would
            announce a section where there is only a list.

            It is here because `CourseCard` titles are h3, so the document went
            h1 -> h3 with nothing between it. Skipping a level breaks
            heading-by-heading navigation, which is the way this page is most
            useful to a screen reader: five h3s under one h2 is the outline the
            grid actually has. */}
        <h2 className="sr-only">The five courses</h2>

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {courses.map((course) => (
            <li key={course.id} className="flex">
              <CourseCard course={course} />
            </li>
          ))}
        </ul>
      </Section>

      {/*
        The jump list. Tinted, so it separates the grid above from the prose
        below without either needing a heading it does not want.

        `aria-label` rather than a visible heading: it is a list of five links to
        the five things directly above it, and a heading would announce a new
        section where there is only a shortcut.
      */}
      <Section tint compressed ariaLabel="Jump to a course">
        <ul className="flex flex-wrap gap-2">
          {courses.map((course) => (
            <li key={course.id}>
              <Link
                href={courseHref(course.id)}
                className="t-button inline-flex min-h-[44px] items-center gap-2.5 rounded-full border border-line bg-surface px-4 text-ink-secondary no-underline transition-colors hover:border-accent hover:text-accent"
              >
                <CourseGlyph id={course.id} size={18} className="flex-none text-accent" />
                {course.title}
                {/* The duration, not the module count. The comment here used to
                    justify `moduleCount` as "the one fact that differs between
                    these five", and every course has eight modules — so the row
                    printed "8 modules" five times and the justification was the
                    exact opposite of true. Duration is 6/6/4/6/2 weeks, which
                    does differ, and is the fact somebody scanning a jump list is
                    choosing on. */}
                <span className="t-meta text-ink-muted">{course.duration}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/*
        The prose, in a 720px measure and a two-column grid at lg.

        Three questions, each about the *set* rather than about any one course,
        which is the test for whether a paragraph belongs on an index page at
        all: if a course page could answer it, it belongs there instead.
      */}
      {/* No `Container` in here. `Section` already wraps its children in one,
          so the version this replaces nested a 1280px container inside a
          1216px content box — dead markup that happened to be invisible
          because the inner one could never be the narrower of the two. */}
      <Section>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
          {catalog.body.map((block) => (
            <div key={block.heading}>
              <h2 className="t-h3 text-ink">{block.heading}</h2>
              <p className="t-body-sm mt-3 max-w-[46ch] text-ink-secondary">{block.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* The page's one dark ground and its one filled control, at the point a
          reader has finished comparing.

          `Panel tone="dark"`, and this hand-rolled the panel's own five classes
          for one pass — the rounded ink block with stepped padding is exactly
          what that primitive is, and a second spelling of it drifts the first
          time either changes. Same component the course pages close on. */}
      <Section compressed>
        <Panel tone="dark">
          <div className="flex flex-wrap items-center justify-between gap-x-12 gap-y-6">
            <div className="max-w-[560px]">
              <h2 className="t-h2 text-white">Start with module 1</h2>
              <p className="t-body mt-2.5 text-[#c3d2dc]">
                Module 1 of every course is open with no account. Pick a course above,
                watch the first lesson, and finish it holding a written baseline for one
                process you own.
              </p>
            </div>
            <div>
              <EnrollButton withDate tone="onDark" href="/sign-up" />
              {/* "Pick a course above" was the whole instruction, and the cards
                  above link to the marketing page rather than to module 1 — so
                  a panel headed "Start with module 1" offered no way to start
                  module 1. The course pages each carry the direct link now; this
                  says where to find it rather than repeating the access model a
                  fourth time. */}
              <p className="t-meta mt-2.5 text-white/60">
                A free account opens the rest. Module 1 starts from any course page.
              </p>
            </div>
          </div>
        </Panel>
      </Section>
    </>
  );
}
