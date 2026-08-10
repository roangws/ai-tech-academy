import { Logo } from "@/components/logo";
import { TrustSeal } from "@/components/trust-seal";
import { SignInForm } from "@/components/auth/sign-in-form";
import { SignUpSteps } from "@/components/auth/sign-up-steps";
import { auth } from "@/lib/content";

/**
 * Both auth screens, from one shell.
 *
 * ------------------------------------------------------------------ why on-brand
 *
 * This replaced a pasted template that carried another product's design and
 * another product's copy: a black and orange shader panel, a dark theme the rest
 * of this site does not have, "Brainstrom in chat, build in cowork", an opt-out
 * about "solaceui feature updates", a Windows download, and inputs prefilled
 * with a stranger's name and Gmail address. It rendered, which is the only thing
 * that could be said for it. Sign-in and sign-up are the two screens where a
 * reader is deciding whether this is a real organisation, and a screen that
 * looks like a different company is the worst possible place to find out.
 *
 * So it is built from the same tokens as everything else: white ground, Inter,
 * `--accent` on the one filled control, 8px controls, the dense type scale. The
 * `@paper-design/shaders-react` dependency went with the template.
 *
 * ------------------------------------------------------------- labels stay put
 *
 * The template's field labels lived inside the box and were removed on first
 * focus, permanently, so a half-filled form was a column of unlabelled rectangles
 * and the reader's own typing rendered at 30% black, lighter than the
 * placeholder it replaced. Both were bugs a screenshot cannot show and typing
 * finds in a second.
 *
 * The label here is a real `<label htmlFor>` above the field and it never moves.
 * That is the boring answer and it is the correct one: it survives autofill, it
 * survives zoom, it gives the hit target the label's own width, and the field
 * still reads as labelled when it is full.
 *
 * ------------------------------------------------------------------ one dark ground
 *
 * Amendment 2 allows one dark ground per page. On this page it is the facts
 * panel, which is also the only element here that is not a control. A form on a
 * white page with nothing beside it is a checkpoint; the panel is what makes the
 * screen an offer.
 *
 * ------------------------------------------------------------------- no chrome
 *
 * Rendered outside the `(site)` route group, so there is no header and no
 * footer, per the note in that layout. The lockup at the top left is the way
 * back, and it is a link.
 */
export function AuthScreen({
  variant,
  next,
  confirmFailed = false,
}: {
  variant: "signIn" | "signUp";
  /** Where to go after authenticating. Read on the server; see sign-up/page.tsx. */
  next?: string;
  confirmFailed?: boolean;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      {/* The lockup is the only navigation on the screen, which is why it is
          the full lockup rather than the mark alone: a reader who arrived here
          by accident needs to be told whose sign-in this is before they need a
          way out of it. */}
      {/* `Logo` is already an anchor to `/` carrying its own aria-label, so it
          is mounted bare. Wrapping it in a second `<Link>` nested an `<a>`
          inside an `<a>`, which the parser unnests and React then hydrates
          against a tree that no longer matches: a hydration failure on both
          auth routes, from markup that looked correct in the source. */}
      <header className="px-4 pt-6 sm:px-6 md:px-8 lg:px-10">
        <Logo size={34} descriptor />
      </header>

      {/*
        Both columns are sized to their content and the pair is centred, rather
        than a `1fr` form column holding a 440px block. `1fr` stretched the
        column to half the viewport and left the form pinned to its left edge,
        so at 1440 there were 300px of white between the fields and the panel
        and the screen read as two unrelated objects that happened to share a
        page. `max-content`-ish fixed widths keep them one pair at every width.
      */}
      {/*
        `<main>`, not a `<div>`. These two routes sit outside the `(site)` group
        and so miss the landmark that layout gives every other page, which left
        sign-in and sign-up as the only two pages on the site with no main
        landmark at all — the two pages a screen reader user is most likely to
        arrive at cold. `id="main"` matches the id the site layout uses, so the
        two groups name the same thing the same way.

        No skip link above it, which the site layout does have and this
        deliberately does not: the header here holds exactly one focusable
        element, the lockup, so a "Skip to content" link would add a tab stop
        whose whole purpose is to bypass a single tab stop.
      */}
      <main
        id="main"
        className="mx-auto grid w-full max-w-[920px] flex-1 items-center justify-center gap-8 px-4 py-10 sm:px-6 md:px-8 lg:grid-cols-[minmax(0,440px)_minmax(0,380px)] lg:gap-14 lg:py-14"
      >
        {/* ------------------------------------------------------------ form */}
        {/*
          Sign-up is a three-step flow and sign-in is one screen, so only one of
          them is a wizard. The shell is shared because the two screens have to
          look like the same product; the form column is not, because they are
          not the same form.

          `SignUpSteps` is a client component and this shell is not. That split
          is the reason the wizard lives in its own file rather than behind a
          branch in here: putting `"use client"` at the top of this file would
          have made the sign-in screen, the panel and the lockup client
          components too, for a stepper that only one of the two routes renders.
        */}
        {/*
          No Suspense boundary any more, and losing it is the point.

          `next` used to be read inside the forms with `useSearchParams`, which
          opts a subtree out of prerendering — so the form had to be wrapped, and
          the prerendered HTML for both routes contained no form at all. The
          reader got the panel and an empty column until the client bundle
          arrived and hydrated.

          `next` is now read on the server in the route and handed down, so both
          forms render into the HTML like everything else on the site.
        */}
        <div className="min-w-0">
          {variant === "signUp" ? (
            <SignUpSteps next={next} />
          ) : (
            <SignInForm next={next} confirmFailed={confirmFailed} />
          )}

          {/*
            The trustmark, under the form, added 9 Aug on Roan's instruction.

            In the FORM column rather than in the panel beside it, because these are the
            two screens where somebody types a password into this site and the badge
            answers a question about the box they are typing into. In the panel it would
            be decorating the argument for making an account instead.

            On BOTH auth screens rather than only the one Roan named. He asked for
            /sign-in; sign-up is the same shell, reached by the same readers, and it is
            the screen where an email address actually changes hands. A badge on one and
            not the other would read as an oversight on whichever a given person saw
            second.

            It also suppresses the corner badge on these two routes, which is what
            `trustedsite-tm-float-disable` in the seal does everywhere it is mounted.
          */}
          <div className="mt-7 flex justify-center lg:justify-start">
            <TrustSeal />
          </div>
        </div>

        {/* ----------------------------------------------------------- panel */}
        {/*
          `order-first` below lg. On a phone the panel is the reason to make an
          account and the form is the cost of it, so the reason goes first; at lg
          they are side by side and reading order stops mattering.
        */}
        <aside className="order-first min-w-0 rounded-[var(--radius-feature)] bg-ink-band p-6 md:p-8 lg:order-last">
          <p className="t-label text-white/60">{auth.panel.label}</p>
          <p className="t-h3 mt-2 text-white">{auth.panel.title}</p>
          <ul className="mt-5 grid gap-3.5">
            {auth.panel.points.map((point) => (
              <li key={point} className="flex gap-2.5">
                {/* Decorative: the list already reads as a list, and three
                    identical announcements of a tick add nothing to it. */}
                <svg
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-white/70"
                  fill="none"
                >
                  <path
                    d="M3.5 8.4 6.6 11.4 12.5 4.9"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="t-body-sm text-white/85">{point}</span>
              </li>
            ))}
          </ul>
        </aside>
      </main>
    </div>
  );
}
