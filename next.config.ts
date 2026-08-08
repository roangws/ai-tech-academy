import type { NextConfig } from "next";
import { courses } from "./src/lib/content";

const nextConfig: NextConfig = {
  /**
   * The old course URLs, permanently.
   *
   * `/courses/gtm` through `/courses/starter` were the routes until 8 Aug, when
   * the segment became the course title. Those five URLs are in the wild: the
   * homepage hero linked `/courses/gtm#curriculum`, the footer listed all five,
   * and anything already shared or crawled points at them.
   *
   * This is not optional cleanup. `dynamicParams = false` on the route means an
   * unrecognised segment is a 404 at the routing layer, so without these five
   * lines every existing link to a course page breaks outright.
   *
   * `permanent: true` — a 308, which is the correct code for a URL that has
   * moved for good and is the one that transfers the old address's accumulated
   * signals to the new one. A 307 would leave the old URL as the one a crawler
   * keeps and re-checks.
   *
   * Generated from `courses` rather than written out, so a course whose slug is
   * ever rewritten again does not silently leave a dead address behind. The
   * hash on the hero's link is preserved by the browser without being named
   * here; fragments are never sent to the server.
   */
  async redirects() {
    return courses.map((course) => ({
      source: `/courses/${course.id}`,
      destination: `/courses/${course.slug}`,
      permanent: true,
    }));
  },

  // The dev overlay badge sits on top of the closing CTA in review captures.
  devIndicators: false,
  experimental: {
    /*
      The client components import icons from the `@phosphor-icons/react`
      barrel, which re-exports roughly 1,200 components. Server components use
      the `/dist/ssr` entry and are unaffected, but a barrel import in a client
      bundle pulls the whole index in before tree-shaking gets a look at it.
      This rewrites those to per-icon paths at build time.
    */
    optimizePackageImports: ["@phosphor-icons/react"],
  },
  images: {
    // Placeholder photography only. Remove once real assets land in /public
    // or a media host. See IMAGE_MANIFEST in src/lib/content.ts.
    remotePatterns: [{ protocol: "https", hostname: "picsum.photos" }],
  },
};

export default nextConfig;
