import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth/auth-screen";
import { auth } from "@/lib/content";

export const metadata: Metadata = {
  title: "Sign in",
  description: auth.signIn.intro,
  alternates: { canonical: "/sign-in" },
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return <AuthScreen variant="signIn" />;
}
