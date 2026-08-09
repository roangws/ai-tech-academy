import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { AccountForm } from "@/components/lms/account-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

/**
 * Name, company and portrait.
 *
 * Deliberately small. This is not a settings hub: an account on this site holds
 * a name, an optional employer, and a picture, and inventing preferences nobody
 * asked for would be inventing features. Email is shown and not editable —
 * changing it means re-verifying an address, which needs the mail path that is
 * still [FILL: email delivery].
 */
export default async function AccountPage() {
  const viewer = await requireUser("/account");

  return (
    <Container className="py-12 md:py-16">
      <h1 className="t-display text-ink">Your account</h1>
      <p className="t-body mt-3 max-w-[56ch] text-ink-secondary">
        Your name is what the site greets you with, and your photo is what an instructor sees
        beside work you submit.
      </p>

      <AccountForm
        firstName={viewer.profile?.first_name ?? ""}
        lastName={viewer.profile?.last_name ?? ""}
        company={viewer.profile?.company ?? ""}
        email={viewer.email ?? ""}
        avatarUrl={viewer.profile?.avatar_url ?? null}
      />
    </Container>
  );
}
