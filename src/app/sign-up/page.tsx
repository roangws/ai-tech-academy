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

export default function SignUpPage() {
  return <AuthScreen variant="signUp" />;
}
