import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev overlay badge sits on top of the closing CTA in review captures.
  devIndicators: false,
  images: {
    // Placeholder photography only. Remove once real assets land in /public
    // or a media host. See IMAGE_MANIFEST in src/lib/content.ts.
    remotePatterns: [{ protocol: "https", hostname: "picsum.photos" }],
  },
};

export default nextConfig;
