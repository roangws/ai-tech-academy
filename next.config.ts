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

  /**
   * Security headers.
   *
   * There were none until lessons could embed things. Now that a lesson can
   * carry a YouTube player and a third-party interactive tool, `frame-src` is
   * the difference between "an author picked from a reviewed list" and "any
   * origin that ends up in a jsonb column can execute script in our page".
   *
   * ---------------------------------------------- this list exists twice, deliberately
   *
   * The same origins are written into the CHECK constraint on
   * `lesson_blocks.payload` for `kind = 'embed'`. That is not duplication to
   * remove — it is defence at both ends: the constraint means a bad origin
   * cannot be *stored*, and this means a bad origin cannot be *loaded* even if
   * one somehow were. They must be edited in the same commit, and the migration
   * says so too.
   *
   * ------------------------------------------------------------- no script-src
   *
   * On purpose. A real `script-src` fights Next's inline bootstrap unless nonces
   * are threaded through the whole render, and a CSP that has to be loosened
   * every time something breaks teaches everyone to loosen it. A small correct
   * policy beats a large one nobody trusts. `script-src` lands with nonces, as
   * its own change.
   */
  async headers() {
    const csp = [
      "frame-src 'self' https://www.youtube-nocookie.com https://www.figma.com https://colab.research.google.com https://codesandbox.io https://www.desmos.com https://www.loom.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          /* The site asks for none of these anywhere, and saying so stops an
             embedded third party asking on our behalf. */
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
