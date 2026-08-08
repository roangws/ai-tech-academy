import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { legal } from "@/lib/content";

/**
 * `robots: noindex, follow`, and it is the one interesting line on this page.
 *
 * Terms and Privacy are required, linked from the sign-up screen and the footer,
 * and read by almost nobody through a search result. Left indexable they are two
 * of the site's nine routes competing for brand queries with two pages that
 * explain nothing about the program — the same argument robots.ts already makes
 * about `/sign-in` and `/sign-up`.
 *
 * `follow` rather than `none`, so the links out of them still pass. And they stay
 * out of the sitemap for the same reason, not because they are hidden: a reader
 * or a regulator reaches them from the footer on every page.
 */
export const metadata: Metadata = {
  title: legal.terms.title,
  description: legal.terms.intro,
  alternates: { canonical: "/terms" },
  robots: { index: false, follow: true },
  /* Declared rather than inherited, so a pasted link unfurls as this document
     instead of as the homepage. privacy/page.tsx has the note on why noindex is
     not an argument against it. */
  openGraph: {
    title: legal.terms.title,
    description: legal.terms.intro,
    url: "/terms",
  },
};

export default function TermsPage() {
  return <LegalPage doc={legal.terms} />;
}
