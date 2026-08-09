import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth/auth-screen";
import { auth } from "@/lib/content";

export const metadata: Metadata = {
  title: "Create your free account",
  description: auth.signUp.intro,
  alternates: { canonical: "/sign-up" },
  /* An auth screen has nothing a search engine should index or follow. */
  robots: { index: false, follow: false },
  /* Still declared: noindex governs crawlers, an unfurl is what a person sees
     when the link is pasted. sign-in/page.tsx has the note. */
  openGraph: {
    title: auth.signUp.title,
    description: auth.signUp.intro,
    url: "/sign-up",
  },
};

/**
 * `next` is read here, on the server, and passed down as a prop.
 *
 * It used to be read inside the form with `useSearchParams`, and that had a
 * consequence out of all proportion to the convenience: the hook opts its
 * subtree out of prerendering, so the form had to live behind a `<Suspense>`
 * boundary — and the prerendered HTML for this route contained NO FORM AT ALL.
 * Not the fields, not the labels, not the submit. Verified against production:
 * `id="first-name"` appeared zero times in the served HTML.
 *
 * Everything therefore depended on the client bundle arriving and hydrating. A
 * slow connection showed an empty column beside the panel; a stale or failed
 * bundle showed one forever, with no way for the reader to tell that the page
 * was broken rather than just sparse.
 *
 * Reading the query string here costs nothing — the page becomes dynamic, which
 * an auth screen should be anyway — and the whole form is server-rendered again.
 */
export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <AuthScreen variant="signUp" next={next} />;
}
