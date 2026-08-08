import Link from "next/link";
import { Logo } from "@/components/logo";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
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
export function AuthScreen({ variant }: { variant: "signIn" | "signUp" }) {
  const copy = variant === "signUp" ? auth.signUp : auth.signIn;

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
      <div className="mx-auto grid w-full max-w-[920px] flex-1 items-center justify-center gap-8 px-4 py-10 sm:px-6 md:px-8 lg:grid-cols-[minmax(0,440px)_minmax(0,380px)] lg:gap-14 lg:py-14">
        {/* ------------------------------------------------------------ form */}
        <div className="min-w-0">
          <div className="max-w-[440px]">
            <h1 className="t-h2 text-ink">{copy.title}</h1>
            <p className="t-body mt-2.5 text-ink-secondary">{copy.intro}</p>

            <form className="mt-7" noValidate>
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

              {variant === "signIn" ? (
                <div className="mt-2.5 flex justify-end">
                  <Link
                    href="/sign-in"
                    className="t-meta text-accent no-underline transition-colors hover:text-accent-hover hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
              ) : null}

              {/*
                The one filled accent control on the screen, which is the lock.
                `type="submit"` and no handler: there is no backend, and a button
                that silently does nothing is worse than one that says so, which
                is what the note under it is for.
              */}
              <LiquidButton
                type="submit"
                variant="accent"
                size="lg"
                className="t-button mt-6 w-full"
              >
                {copy.submit}
              </LiquidButton>

              {variant === "signUp" ? (
                <p className="t-micro mt-3 text-ink-muted">
                  {auth.terms.lead}{" "}
                  {auth.terms.links.map((l, i) => (
                    <span key={l.href}>
                      {i > 0 ? " and " : ""}
                      <Link href={l.href} className="text-ink-secondary underline underline-offset-2">
                        {l.label}
                      </Link>
                    </span>
                  ))}
                  .
                </p>
              ) : null}

              <p className="t-micro mt-3 text-ink-muted">{auth.shellNote}</p>
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
      </div>
    </div>
  );
}
