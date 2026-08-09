import { brand, catalog, instructors, site } from "@/lib/content";
import { getCatalog, type Course } from "@/lib/catalog";

/**
 * Structured data, and the rule it is written under is the same one that governs
 * the visible page: every field is a fact the program can back.
 *
 * ------------------------------------------------------------------ WHY AT ALL
 *
 * A course page with no structured data is, to a crawler, a document with a
 * title and some prose. With it, the page becomes eligible for the course result
 * treatment, which prints the provider, the delivery mode and the cost under the
 * link — three of the four things a reader of this site is trying to establish,
 * and all three are already the page's strongest claims.
 *
 * ------------------------------------------------------ WHAT IS DELIBERATELY ABSENT
 *
 * `aggregateRating`, `review`, `ratingCount`, and any enrolment figure. These
 * are the fields that lift a listing hardest and they are exactly the ones this
 * program has no numbers for. The course page already refuses to print a star
 * rating for that reason; printing one in a script tag where a reader cannot see
 * it would be the same fabrication with the audience swapped.
 *
 * It would also not work. Google requires rating markup to correspond to a
 * rating visible on the page, drops structured data it cannot corroborate, and
 * treats the uncorroborated kind as spam. So the honest version and the
 * effective version are the same file.
 *
 * `timeRequired` carries the stated course length and nothing sums lesson
 * durations, because only one lesson on this site has a recorded duration.
 * content.ts has that note at length.
 */
export function courseJsonLd(course: Course): string {
  const lead = instructors.people[0];

  const graph = {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": `${site.url}/courses/${course.slug}#course`,
    name: course.title,
    description: course.seoDescription,
    url: `${site.url}/courses/${course.slug}`,
    inLanguage: "en",
    /* The keyword list, which is the machine-readable statement of scope.

       `keywords`, not `about`. `about` takes a Thing — an entity the course is
       about — and it was being handed an array of bare strings, which is a type
       mismatch a validator drops on the floor, so the scope statement was being
       emitted and then discarded. `keywords` is the property defined for
       exactly this and accepts a text list. */
    keywords: course.keywords,
    teaches: course.whatLearn,
    coursePrerequisites: course.requirements,
    educationalLevel: course.level,
    image: course.cover ? `${site.url}${course.cover.src}` : undefined,
    provider: {
      "@type": "Organization",
      name: brand.name,
      url: site.url,
    },
    /*
      One instructor, named, with a URL a crawler can follow to a page that
      corroborates the claim. The specialists on the roster record individual
      courses and are not per-course data in content.ts, so listing them here
      would mean deciding which of them belongs to which course in this file —
      a fact invented at the point of markup, which is the thing this module
      exists not to do.
    */
    instructor: {
      "@type": "Person",
      name: lead.name,
      description: lead.role,
      url: lead.site?.href,
      sameAs: [lead.linkedin, lead.site?.href].filter(Boolean),
    },
    /*
      The calendar span. `duration` reads "6 weeks", and that is elapsed time a
      reader paces themselves through, which is what `timeRequired` is for.
    */
    timeRequired: durationToIso(course.duration),
    /*
      `hasCourseInstance` is required for the course treatment to render, and
      `courseWorkload` is required inside it. Self-paced, so there is no
      `courseSchedule` and no start date: `startDate` on a self-paced course
      would be a scheduling claim the page does not make.

      `courseWorkload` IS THE EFFORT, NOT THE SPAN, and it was the span: this
      passed `durationToIso(course.duration)`, so the GTM course emitted `P6W` —
      six weeks of work — for a course whose own requirements ask about four
      hours a week, and the starter course emitted `P2W` for four hours in
      total. Every one of the five overstated itself by about five times in the
      one field a listing uses to tell somebody what it will cost them.

      `workloadHours` in content.ts carries the real figure, beside the
      `requirements` line it is derived from.
    */
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: `PT${course.workloadHours}H`,
      instructor: { "@type": "Person", name: lead.name },
    },
    /*
      A real offer at a real price. `price: "0"` with a currency is what makes a
      listing print "Free" rather than omitting the cost line, and it is the one
      commerce field on this whole site that is true.
    */
    offers: {
      "@type": "Offer",
      category: "Free",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `${site.url}/courses/${course.slug}`,
    },
    /*
      The curriculum, as syllabus sections. This is the part of the page a
      reader scrolls to and the part no competitor listing shows, so it is worth
      the bytes. Lesson counts are real; durations are absent because they are
      not recorded.
    */
    syllabusSections: course.curriculum.map((m, i) => ({
      "@type": "Syllabus",
      position: i + 1,
      name: m.name,
      description: m.summary,
    })),
    /* `numberOfLessons` was here and is gone: it is not a schema.org property,
       on `Course` or anywhere else, so the count was serialised into the graph
       and then silently discarded by anything reading it. The lesson total is
       stated in text on the page, above the accordion, which is where it is
       worth having. Nothing replaces it — building `hasPart` entries per lesson
       would be forty nodes of markup for a fact already on the page, against
       this file's rule of emitting less rather than more. */
  };

  /* `JSON.stringify` drops undefined-valued keys, which is what carries the
     optional fields: a course with no cover emits no `image`, and a duration
     this file cannot parse emits no `courseWorkload`, rather than either
     emitting `null` and failing validation. */
  return JSON.stringify(graph);
}

/**
 * "6 weeks" to "P6W", which is the format `courseWorkload` is validated against.
 *
 * Every course states its length as "<n> weeks" in content.ts and this is
 * deliberately not a general parser: an unrecognised string returns `undefined`
 * so the field drops out of the graph entirely, rather than emitting an invalid
 * duration that fails validation and takes the whole `CourseInstance` with it.
 */
function durationToIso(duration: string): string | undefined {
  const weeks = /^(\d+)\s+weeks?$/.exec(duration.trim());
  if (weeks) return `P${weeks[1]}W`;
  const hours = /^(\d+)\s+hours?$/.exec(duration.trim());
  if (hours) return `PT${hours[1]}H`;
  return undefined;
}

/**
 * The roster at /instructors, as an `ItemList` of `Person` records.
 *
 * An `ItemList` rather than five loose `Person` graphs, because the page is a
 * list and the order on it is meaningful in exactly one way: the lead is first
 * and the specialists follow alphabetically. `position` states that and nothing
 * more.
 *
 * ------------------------------------------------------ WHAT EACH PERSON CARRIES
 *
 * `name`, `image`, `jobTitle`, `affiliation`, `sameAs`, and a `worksFor` back to
 * the organization declared in the root layout. Every one of those is on the
 * card a reader sees, which is the corroboration rule this whole module is
 * written under: markup that asserts something the page does not show is
 * markup a crawler is entitled to distrust, and it would be a claim about a
 * named human being besides.
 *
 * `jobTitle` is each person's own LinkedIn headline, verbatim, which is the same
 * string the card prints and the same rule content.ts states at length. Two of
 * the five have no `org`, only the lead has a `site`, and only the lead has no
 * employer mark; each absent field simply drops out — `JSON.stringify` omits
 * undefined keys, so a person with fewer facts emits a shorter record rather
 * than a padded one. Emitted today that means `sameAs` carries two links for the
 * lead and one for each of the other four.
 *
 * `sameAs` is the load-bearing field here and the reason this graph is worth
 * emitting at all: it is what lets a crawler resolve "Roan Weigert" on this page
 * to the same entity as the LinkedIn profile and roanweigert.com, rather than to
 * a string. Nothing else on the page can say that.
 *
 * Absent, deliberately: `alumniOf`, `knowsAbout`, `award`, and any teaching
 * credential. Nobody has supplied them. A `knowsAbout` list would be this site
 * inventing a person's expertise in a place they cannot see it, which is the
 * same failure as an invented job title with the audience swapped.
 */
export function instructorsJsonLd(): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${site.url}/instructors#roster`,
    name: `Instructors at ${brand.name}`,
    description: instructors.seoDescription,
    url: `${site.url}/instructors`,
    numberOfItems: instructors.people.length,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    itemListElement: instructors.people.map((person, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Person",
        "@id": `${site.url}/instructors#${person.id}`,
        name: person.name,
        jobTitle: person.role,
        description: person.detail,
        image: person.photo ? `${site.url}${person.photo.src}` : undefined,
        url: person.site?.href,
        /* The organisation this site can speak for is its own. The second
           affiliation is the company a person co-founded, which is theirs, so
           it goes in `affiliation` as a name rather than as a claim of
           employment.

           `person.org.name` is the organisation alone now. It used to be the
           card's whole string, so this emitted Organizations named "Co-founder,
           n-aible" — a job title published as a company name. `org.role` is a
           separate field for that reason and is deliberately not in the graph:
           it is the person's relationship to the org, and `jobTitle` here would
           assert it is their role at this academy. */
        worksFor: { "@id": `${site.url}#organization` },
        affiliation: person.org
          ? { "@type": "Organization", name: person.org.name, url: person.org.url }
          : undefined,
        sameAs: [person.linkedin, person.site?.href].filter(Boolean),
      },
    })),
  });
}

/**
 * The site-level `EducationalOrganization`, mounted once in the root layout.
 *
 * In the layout and not on the homepage, so it is present on every route a
 * result can land on rather than only on the one a crawler happens to enter by.
 *
 * The `Course` records above each name this organization as their provider by
 * name only. Declaring it once, with the URL and the logo, is what lets a
 * crawler resolve those five references to one entity rather than to five
 * strings that happen to match.
 */
export function organizationJsonLd(): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": `${site.url}#organization`,
    name: brand.name,
    alternateName: brand.short,
    url: site.url,
    description: site.description,
    logo: `${site.url}/icon.svg`,
    sameAs: [instructors.people[0].linkedin, instructors.people[0].site?.href].filter(Boolean),
  });
}

/**
 * The `/courses` index, as an `ItemList` of the five `Course` records.
 *
 * ------------------------------------------------------------------ WHY A LIST
 *
 * Without it, an index page and a page that merely links to five courses are the
 * same document to a crawler. The `ItemList` says these five are the members of
 * this collection and this page is where they live, which is what lets each
 * course page's "Courses" breadcrumb resolve to a parent rather than to a link.
 *
 * `@id` references rather than inlined `Course` objects. Each course page emits
 * its own full record at `<url>#course`, so repeating all of it here would put
 * two descriptions of the same entity on the site and give a crawler a choice
 * about which to believe. A reference says "the thing described over there",
 * which is both smaller and true.
 *
 * `BreadcrumbList` is separate rather than nested. It describes the position of
 * this page in the site, not the contents of the list, and Google reads the two
 * for different purposes.
 *
 * Absent, as everywhere else in this file: no rating, no enrolment count, no
 * `numberOfItems` inflated past five.
 */
export async function catalogJsonLd(): Promise<string> {
  const courses = await getCatalog();
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${site.url}/courses#page`,
        name: catalog.seoTitle,
        description: catalog.seoDescription,
        url: `${site.url}/courses`,
        isPartOf: { "@id": `${site.url}#organization` },
        about: catalog.keywords,
      },
      {
        "@type": "ItemList",
        "@id": `${site.url}/courses#list`,
        name: catalog.heading,
        numberOfItems: courses.length,
        /* The five are an ordered set in content.ts and the order is meaningful
           — A through E is the badge sequence the whole site uses — so this is
           an `ItemListOrderAscending` rather than an unordered bag. */
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        itemListElement: courses.map((course, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: course.title,
          url: `${site.url}/courses/${course.slug}`,
          item: { "@id": `${site.url}/courses/${course.slug}#course` },
        })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${site.url}/courses#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: site.url },
          { "@type": "ListItem", position: 2, name: "Courses", item: `${site.url}/courses` },
        ],
      },
    ],
  });
}
