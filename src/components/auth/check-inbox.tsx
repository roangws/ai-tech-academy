import Link from "next/link";
import { EnvelopeSimpleIcon } from "@phosphor-icons/react/dist/ssr";

/**
 * "We have sent you a link."
 *
 * ------------------------------------------------------------- why it exists
 *
 * This project has email confirmation switched ON, and the first version of the
 * sign-up action assumed the opposite. `signUp` returns a live session only when
 * confirmations are off; with them on it returns a user and `session: null`, and
 * the action redirected to `/dashboard` regardless. The proxy saw no session,
 * bounced the reader to `/sign-in`, and nothing anywhere said why. Trying to
 * sign in then failed with GoTrue's raw "Email not confirmed" attached to the
 * password field, which is the one message guaranteed to send somebody to a
 * password-recovery flow that cannot help them.
 *
 * Every account ever created on this site was in that state, which is why
 * `auth.users` had no rows.
 *
 * Shared by both screens, because sign-in reaches it too: an account created
 * before the link was clicked hits exactly the same wall from the other side.
 *
 * The address is echoed back deliberately. A typo in an email address is the
 * most common reason a confirmation never arrives, and it is invisible unless
 * the screen that is waiting for it says which address it is waiting on.
 */
export function CheckInbox({ email }: { email: string }) {
  return (
    <div className="max-w-[440px]">
      <span className="grid size-11 place-items-center rounded-full bg-accent-tint text-accent">
        <EnvelopeSimpleIcon size={22} aria-hidden="true" />
      </span>

      <h1 className="t-h2 mt-5 text-ink">Confirm your email</h1>
      <p className="t-body mt-2.5 text-ink-secondary">
        We sent a link to <span className="text-ink">{email}</span>. Open it and your account is
        ready — it takes one click and you will not need to fill anything in again.
      </p>

      <ul className="mt-7 grid gap-3 border-t border-line pt-6">
        <li className="t-body-sm text-ink-secondary">
          Nothing after a few minutes? Check the spam folder — the first message from a new
          sender often lands there.
        </li>
        <li className="t-body-sm text-ink-secondary">
          Wrong address?{" "}
          <Link href="/sign-up" className="text-accent no-underline hover:underline">
            Start again
          </Link>{" "}
          with the right one.
        </li>
      </ul>

      {/* The offer that does not need an account, restated at the one moment a
          reader is stuck waiting on something. It is also true: module 1 of
          every course runs with no account at all. */}
      <p className="t-body-sm mt-7 rounded-[var(--radius-card)] border border-line bg-surface-subtle p-4 text-ink-secondary">
        You can start while you wait. Module 1 of every course is open with no account, so{" "}
        <Link href="/courses" className="text-accent no-underline hover:underline">
          pick a course
        </Link>{" "}
        and begin now.
      </p>
    </div>
  );
}
