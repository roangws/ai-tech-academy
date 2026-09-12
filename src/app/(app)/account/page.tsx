import type { Metadata } from "next";
import { ButtonLink, Container } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { AccountForm } from "@/components/lms/account-form";
import { IntakeCards } from "@/components/course/intake-cards";

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
 * asked for would be inventing features. Email is shown and not editable.
 * Changing it means confirming on both the old address and the new one, and
 * while the mail path exists now, the second confirmation template and the
 * screen that explains a half-finished change do not. Editable is a feature,
 * not a field.
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
      <div className="mt-5">
        <ButtonLink href="/dashboard">My learning</ButtonLink>
        <p className="t-body-sm mt-3 text-ink-secondary">Open your courses and continue your lessons in My learning.</p>
      </div>

      <IntakeCards />
      <h2 className="t-h3 mt-12 text-ink">Your profile</h2>
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
