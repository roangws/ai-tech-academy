import type { MetadataRoute } from "next";
import { site } from "@/lib/content";
import { getCatalog } from "@/lib/catalog";

/**
 * Every indexable route, generated rather than listed.
 *
 * The site had no sitemap at all, which mattered more here than it does on most
 * small sites: the five course pages are reachable only from cards inside a
 * horizontally-scrolled catalog rail on one section of the homepage, so a
 * crawler that does not follow those links well has no other route to them. A
 * sitemap is the direct statement.
 *
 * The course entries come from `courses`, so a sixth course is in here the
 * moment it is in content.ts. That is the whole reason this is a `.ts` file and
 * not a `public/sitemap.xml` — a hand-kept list of five URLs is a list that is
 * wrong at six.
 *
 * -------------------------------------------------------- WHAT IS NOT IN HERE
 *
 * `/sign-in` and `/sign-up` are excluded. They are the funnel, not content: a
 * result that drops a stranger on a bare auth panel with no explanation of the
 * program is a worse first impression than no result, and neither page has
 * anything a query would match.
 *
 * `/terms` and `/privacy` are excluded too, and they carry `noindex, follow` in
 * their own metadata besides. They are required documents rather than content,
 * they are linked from the footer of every page and from the sign-up form, and
 * left indexable they compete for brand queries with the pages that explain the
 * program. Excluding them from a sitemap is not hiding them: a reader or a
 * regulator reaches them in one click from anywhere on the site.
 *
 * `lastModified` is one date for the whole site, and it is the honest one. Per
 * route it would have to come from git or from a hand-typed field, and a
 * per-page date that is really the deploy date is a claim about freshness that
 * the content does not back. Crawlers discount `lastModified` they cannot
 * corroborate anyway.
 */
const lastModified = new Date("2026-08-08");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    {
      url: site.url,
      lastModified,
      changeFrequency: "weekly",
      /*
        1.0 on the homepage and 0.9 on the courses. `priority` is relative
        within one sitemap and says nothing to a crawler about this site
        against any other, so the only useful thing it can express is that the
        five course pages sit just under the page that lists them.
      */
      priority: 1,
    },
    /*
      The catalog index, at 0.9 with the courses rather than above them.

      It is the parent of the five and the page a role-agnostic search should
      land on, which argues for higher; the five are what somebody actually
      wants, which argues for the same. Ranking it above them would tell a
      crawler to prefer a list of five titles over the five pages that answer
      the query, which is the opposite of useful.
    */
    {
      url: `${site.url}/courses`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    ...(await getCatalog()).map((course) => ({
      url: `${site.url}/courses/${course.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    /*
      The two roster pages, at 0.5. Both are supporting evidence rather than
      things a stranger searches for: they answer "who teaches this" and "who
      reviews it" once somebody is already weighing the program up. Ranking them
      with the course pages would be claiming they compete for the same queries.
    */
    {
      url: `${site.url}/instructors`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${site.url}/review-judge-board`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
  ];
}
