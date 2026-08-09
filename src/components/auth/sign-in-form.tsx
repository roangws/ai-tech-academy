"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { CheckInbox } from "@/components/auth/check-inbox";
import { signIn, type AuthState } from "@/app/actions/auth";
import { auth } from "@/lib/content";

/**
 * The sign-in form, and it is a client component for one reason.
 *
 * ------------------------------------------------------- WHAT WAS WRONG BEFORE
 *
 * This markup lived inside `AuthScreen`, which is a server component, so the
 * `<form>` had no `onSubmit` and the note above the button explained that as a
 * deliberate choice: "there is no backend, and a button that silently does
 * nothing is worse than one that says so".
 *
 * The button did not silently do nothing. A `<form>` with no `method` and no
 * `action` and a `type="submit"` control performs a native GET to its own URL
 * with every named field serialised into the query string, so pressing Sign in
 * navigated to
 *
 *     /sign-in?email=someone@example.com&password=hunter2
 *
 * and put the reader's password in the address bar, in their history, in the
 * `Referer` header of the next request, and in the server log of anything that
 * records request lines. That is the one bug on this screen that is worth a
 * client boundary, and it cannot be fixed from a server component: cancelling
 * the browser's default submission requires a handler.
 *
 * `type="button"` on the control would also have stopped it, and was rejected.
 * It removes the form's only submit control, which takes Enter-to-submit with it
 * and leaves a form that behaves differently from the sign-up form next door for
 * a reason no reader can see.
 *
 * -------------------------------------------------------------- WHY IT IS HERE
 *
 * `AuthScreen`'s header note explains why that file is not a client component:
 * `"use client"` at its top would drag the lockup, the facts panel and the
 * sign-up route's shell across the boundary for a stepper only one of the two
 * routes renders. The same argument applies to this form, so it follows the same
 * pattern `SignUpSteps` already established — the interactive column is its own
 * file, and the shell stays on the server.
 *
 * --------------------------------------------------------------- IT IS LIVE NOW
 *
 * The handler that cancelled the submit is gone, replaced by `useActionState`
 * pointed at the `signIn` Server Action. The client boundary this file argues
 * for above is still needed and now earns it twice: `useActionState` is a hook,
 * and the pending state it returns is what disables the button between the press
 * and the redirect.
 *
 * The acknowledgement that said nothing had been sent is gone with it. What
 * replaced it is an error slot — `role="alert"`, because by the time it renders
 * something HAS gone wrong, which is the opposite of the case the old note was
 * written for.
 */
export function SignInForm({ next = "", confirmFailed = false }: { next?: string; confirmFailed?: boolean }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signIn, null);
  const copy = auth.signIn;

  /*
    `next` and `confirmFailed` arrive as props, read from the query string on the
    server by the route. They used to be read here with `useSearchParams`, which
    forced this whole form behind a Suspense boundary and kept it out of the
    server-rendered HTML entirely — see the note in auth-screen.tsx.

    `next` still travels to the action as a hidden field rather than being read
    from a URL inside it: a Server Action is a POST to an opaque endpoint and has
    no request URL of its own. The action re-validates it regardless; see
    safeNext.
  */

  /* An account that exists but has never had its confirmation link clicked
     fails here, not at sign-up. Same screen either way. */
  if (state?.checkInbox) {
    return <CheckInbox email={state.checkInbox} />;
  }

  return (
    <div className="max-w-[440px]">
      <h1 className="t-h2 text-ink">{copy.title}</h1>
      <p className="t-body mt-2.5 text-ink-secondary">{copy.intro}</p>

      {confirmFailed ? (
        <p
          role="alert"
          className="t-body-sm mt-5 rounded-[var(--radius-card)] border border-line bg-surface-subtle p-4 text-ink-secondary"
        >
          That confirmation link did not work — it may have expired, been used already, or been
          opened in a different browser from the one you signed up in. Sign in below and we will
          send a fresh one.
        </p>
      ) : null}

      <form className="mt-7" noValidate action={formAction}>
        <input type="hidden" name="next" value={next} />
        <div className="grid gap-4 sm:grid-cols-2">
          {copy.fields.map((f) => (
            <div key={f.name} className={f.half ? "" : "sm:col-span-2"}>
              <label htmlFor={f.name} className="t-field block text-ink-secondary">
                {f.label}
              </label>
              {/*
                `h-11`, matching the `md` control height, so the fields and
                the button below them are one system rather than two.

                The focus ring is the accent at 2px inset rather than the
                browser default: the default outline sits outside an 8px
                radius and reads as a square around a rounded box.
              */}
              {/*
                `aria-invalid` and `aria-describedby` are driven by which field
                the action blamed, so a screen reader hears the message as part
                of the field rather than as a loose paragraph somewhere below the
                button. Matches what the sign-up form already does per-field.
              */}
              <input
                id={f.name}
                name={f.name}
                type={f.type}
                autoComplete={f.autoComplete}
                aria-invalid={state?.field === f.name || undefined}
                aria-describedby={state?.field === f.name ? "sign-in-error" : undefined}
                className="t-body mt-1.5 h-11 w-full rounded-[var(--radius-control)] border border-line-control bg-surface px-3 text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/25 aria-[invalid]:border-danger"
              />
            </div>
          ))}
        </div>

        {/*
          Still a sentence rather than a link. Accounts are live now, but
          password recovery is not: it needs an email that actually sends, and
          Supabase's built-in sender is rate-limited to a handful of messages an
          hour. [FILL: email delivery.]

          A self-link is worse than no link — it reads as a working escape hatch
          until a locked-out reader uses it — which is why the original
          "Forgot your password?" pointing at /sign-in was removed, and why this
          does not quietly become a link before there is somewhere for it to go.
        */}
        <p className="t-meta mt-2.5 text-right text-ink-muted">
          Password recovery opens shortly.
        </p>

        {/*
          The one filled accent control on the screen, which is the lock.

          Disabled while the action is in flight, which is not decoration: this
          submits a credential pair, and a second press before the redirect lands
          sends the whole form again.
        */}
        <LiquidButton
          type="submit"
          variant="accent"
          size="lg"
          disabled={pending}
          className="t-button mt-6 w-full disabled:opacity-60"
        >
          {pending ? "Signing in…" : copy.submit}
        </LiquidButton>

        {state?.error ? (
          <p
            id="sign-in-error"
            role="alert"
            className="t-body-sm mt-4 rounded-[var(--radius-card)] border border-danger/30 bg-danger/5 p-4 text-danger"
          >
            {state.error}
          </p>
        ) : (
          <p className="t-micro mt-3 text-ink-muted">
            Module 1 of every course is open with no account, so{" "}
            <Link href="/courses" className="text-accent no-underline hover:underline">
              pick a course
            </Link>
            .
          </p>
        )}
      </form>

      <p className="t-body-sm mt-7 border-t border-line pt-5 text-ink-secondary">
        {copy.altPrompt}{" "}
        <Link
          href={copy.altHref}
          className="t-button text-accent no-underline transition-colors hover:text-accent-hover hover:underline"
        >
          {copy.altLabel}
        </Link>
      </p>
    </div>
  );
}
