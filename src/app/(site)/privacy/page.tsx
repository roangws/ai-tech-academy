import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { legal } from "@/lib/content";

/**
 * `noindex, follow`, for the reason the terms page records.
 *
 * `openGraph` is declared even so, and noindex is not an argument against it.
 * Robots directives govern crawlers; an unfurl is what a person sees when this
 * link is pasted into Slack or a mail client, which is precisely how a privacy
 * policy circulates. Without it the page inherited the root block wholesale and
 * unfurled as the homepage — its title, its description and `og:url` pointing at
 * `/`, contradicting this page's own canonical.
 */
export const metadata: Metadata = {
  title: legal.privacy.title,
  description: legal.privacy.intro,
  alternates: { canonical: "/privacy" },
  robots: { index: false, follow: true },
  openGraph: {
    title: legal.privacy.title,
    description: legal.privacy.intro,
    url: "/privacy",
  },
};

export default function PrivacyPage() {
  return <LegalPage doc={legal.privacy} />;
}
