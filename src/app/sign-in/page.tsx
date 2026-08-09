import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth/auth-screen";
import { auth } from "@/lib/content";

export const metadata: Metadata = {
  title: "Sign in",
  description: auth.signIn.intro,
  alternates: { canonical: "/sign-in" },
  robots: { index: false, follow: false },
  /* Declared rather than inherited. `noindex` keeps this out of a search
     result, which is not the same as keeping it out of a chat window — the
     root `openGraph` carries `url: site.url`, so a pasted sign-in link
     unfurled as the homepage, with a title and a description belonging to a
     different page than the canonical directly above. */
  openGraph: {
    title: auth.signIn.title,
    description: auth.signIn.intro,
    url: "/sign-in",
  },
};

/** Server-read query params, so the form is in the HTML. See sign-up/page.tsx. */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; confirm?: string }>;
}) {
  const { next, confirm } = await searchParams;
  return <AuthScreen variant="signIn" next={next} confirmFailed={confirm === "failed"} />;
}
