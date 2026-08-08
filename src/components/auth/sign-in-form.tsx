"use client";

import Link from "next/link";
import { useState } from "react";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
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
 * The acknowledgement is `SignUpSteps`'s, deliberately: the two screens make the
 * same promise, so they answer a press the same way. `role="status"` rather than
 * `alert`, because nothing has gone wrong.
 */
export function SignInForm() {
  const [submitted, setSubmitted] = useState(false);
  const copy = auth.signIn;

  return (
    <div className="max-w-[440px]">
      <h1 className="t-h2 text-ink">{copy.title}</h1>
      <p className="t-body mt-2.5 text-ink-secondary">{copy.intro}</p>

      <form
        className="mt-7"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
      >
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
              <input
                id={f.name}
                name={f.name}
                type={f.type}
                autoComplete={f.autoComplete}
                className="t-body mt-1.5 h-11 w-full rounded-[var(--radius-control)] border border-line bg-surface px-3 text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/25"
              />
            </div>
          ))}
        </div>

        {/*
          The recovery link went with the recovery route, which does not exist.

          It read "Forgot your password?" and pointed at `/sign-in` — the page it
          was already on — so the one control a locked-out reader would reach for
          reloaded the screen that had just failed them. A self-link is worse
          than no link: it reads as a working escape hatch until it is used.

          This says the same thing the rest of the screen says about its own
          state, in the same voice as `auth.shellNote` below, and it goes back to
          being a link the day there is somewhere for it to go.
        */}
        <p className="t-meta mt-2.5 text-right text-ink-muted">
          Password recovery opens with accounts.
        </p>

        {/*
          The one filled accent control on the screen, which is the lock.
          `type="submit"`, and the handler on the form cancels the browser's
          default so nothing leaves the page. The note under it says so before
          the press; the status line below says so after it.
        */}
        <LiquidButton
          type="submit"
          variant="accent"
          size="lg"
          className="t-button mt-6 w-full"
        >
          {copy.submit}
        </LiquidButton>

        <p className="t-micro mt-3 text-ink-muted">{auth.shellNote}</p>

        {submitted ? (
          <p
            role="status"
            className="t-body-sm mt-4 rounded-[var(--radius-card)] border border-line bg-surface-subtle p-4 text-ink-secondary"
          >
            Nothing was sent, because there is nowhere to send it yet. Module 1 of
            every course is open right now with no account —{" "}
            <Link href="/courses" className="text-accent no-underline hover:underline">
              pick a course
            </Link>{" "}
            and start.
          </p>
        ) : null}
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
