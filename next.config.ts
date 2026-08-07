import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
