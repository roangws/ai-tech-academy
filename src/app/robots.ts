import type { MetadataRoute } from "next";
import { site } from "@/lib/content";

/**
 * Open, except for the funnel.
 *
 * There was no robots policy, which is not the same as an open one: without a
 * `Sitemap:` line a crawler has to discover the five course pages by following
 * links out of a scrolled rail, and without a disallow the auth pages compete
 * for the brand query against the pages that actually explain the program.
 *
 * `/sign-in` and `/sign-up` are disallowed for the same reason they are out of
 * the sitemap: they are two of the seven routes on this site and they carry no
 * content, so left indexable they are a quarter of the site's surface saying
 * nothing. They stay linked and crawlable from the page's own controls — this
 * asks that they not be listed, which is all it can ask.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/sign-in", "/sign-up"],
    },
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
