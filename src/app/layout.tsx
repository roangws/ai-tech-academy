import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import { GlassFilter } from "@/components/ui/liquid-glass-button";
import { brand, site } from "@/lib/content";
import { organizationJsonLd } from "@/lib/seo";
import "./globals.css";

/*
  One family across the whole page. Inter is the typeface the project's own
  LMS design system specifies, and every reference that reads as a product
  (Coursera, Udemy, DeepLearning.AI) uses a single neutral sans at 400/500/600.
*/
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

/*
  Inter Tight 700 is the wordmark face specified by the brand package
  (public/brand/README.txt). It is scoped to the logo lockup alone. Headings
  stay on Inter, which is what references/DESIGN-SPEC.md asks for.
*/
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Free applied AI course: deploy one workflow and measure it",
    template: `%s | ${brand.name}`,
  },
  /*
    Kept under 155 characters so the whole line survives in a result, with
    "free applied AI course" front-loaded and the access model at the end.
  */
  description: site.description,
  /*
    The site-level terms. Each course page overrides this with its own list;
    these are the ones that describe the program rather than any one course.
  */
  keywords: [
    "free AI course",
    "applied AI course",
    "AI training for teams",
    "project-based AI course",
    "self-paced AI course",
    "AI upskilling",
    "Roan Weigert",
  ],
  /*
    Explicit rather than left to the default, and the second half is why it is
    here. `index, follow` is what a crawler assumes anyway; `max-image-preview:
    large` is not, and without it a shared or listed page gets a thumbnail
    instead of the wide poster frame the openGraph block below is chosen for.
  */
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: site.url,
    siteName: brand.name,
    title: "Deploy one AI workflow and measure what it changed",
    description:
      "Five role-based courses for operators and technical teams. Module 1 is open to everyone, and every course completes with a live deployment.",
    images: [
      {
        url: "/images/scenes/lesson-recording.jpg",
        width: 1600,
        /* 886, not 900. The file is 1600x886 and /instructors was already
           declaring it correctly, so the site's own default card disagreed with
           one of its pages about the size of the same image. */
        height: 886,
        alt: "Roan Weigert recording a lesson at the studio microphone",
      },
    ],
  },
  /* summary_large_image needs an image declared, or the card renders blank. */
  twitter: { card: "summary_large_image", images: ["/images/scenes/lesson-recording.jpg"] },
  alternates: { canonical: "/" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${interTight.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/*
          The publisher, declared once for the whole document tree.

          Each course page emits its own `Course` record naming this
          organization as its provider. Without this, those five references
          resolve to five strings that happen to match; with it they resolve to
          one entity that has a URL, a logo and a verifiable person behind it,
          which is the difference between five orphan records and a provider a
          crawler can recognise across the site.

          In the root layout rather than on the homepage, so it is present on
          every route a result can land on. lib/seo.ts has the note on what is
          deliberately not in either graph.
        */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: organizationJsonLd().replace(/</g, "\\u003c"),
          }}
        />
        {children}
        {/* The refraction filter every glass control references, mounted once
            per document. It renders nothing; ui.tsx has the note. */}
        <GlassFilter />
      </body>
    </html>
  );
}
