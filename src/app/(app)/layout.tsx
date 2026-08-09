import { AppHeader } from "@/components/lms/app-header";
import { SiteFooter } from "@/components/site-footer";
import { getTheme } from "@/lib/theme";

/**
 * The chrome for every signed-in surface: dashboard, course player, instructor
 * and judge consoles.
 *
 * A third route group, alongside `(site)` and the bare auth routes, because
 * these pages need a header and it is not the marketing one. `(app)` adds no URL
 * segment, so `/dashboard` and `/learn/...` are unaffected by it existing.
 *
 * The footer is the site's, unchanged. It is a sitemap and a legal row, and a
 * signed-in reader has the same use for both.
 *
 * ---------------------------------------------------------- no auth in here
 *
 * This layout deliberately does not call `requireUser`. `/learn` lives under it
 * and module 1 of every course is open with no account — gating the whole group
 * would take that away, and it is the one promise the site makes on every
 * surface it has. Each route guards itself: `/dashboard`, `/instructor` and
 * `/judge` with `requireUser` / `requireRole`, and `/learn` per module through
 * lms/access.ts.
 *
 * The skip link and the `<main tabIndex={-1}>` target match `(site)`'s exactly,
 * including the id, so the two groups name the same thing the same way.
 *
 * ----------------------------------------------------------- the theme element
 *
 * `data-theme` goes on the wrapper below, never on `<html>`, and that placement
 * is the whole scoping mechanism. `(site)` never renders this element, so the
 * marketing pages cannot go dark even by accident, and the dark token block in
 * globals.css needed no `dark:` variant and no edit to any component to take
 * effect here — `@theme inline` maps each Tailwind colour to the *variable*, so
 * redefining the variable inside this subtree re-colours everything under it.
 *
 * Read from a cookie on the server so the first byte of HTML is already correct.
 * That is the entire reason it is a cookie: localStorage would need hydration to
 * read, and the gap before that is the flash.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const theme = await getTheme();

  return (
    <div data-theme={theme} className="flex min-h-dvh flex-col bg-surface text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-[var(--radius-control)] focus:bg-accent focus:px-4 focus:py-2 focus:text-on-accent"
      >
        Skip to content
      </a>
      <AppHeader />
      {/*
        No `outline-none`. It was here, and it silently removed the focus
        indicator from the one element the skip link exists to move focus to —
        so a keyboard reader who used the skip link landed somewhere invisible.
        `focus-visible` keeps it off for mouse clicks, which is what the
        `outline-none` was actually reaching for.
      */}
      <main
        id="main"
        tabIndex={-1}
        className="flex-1 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[var(--focus)]"
      >
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
