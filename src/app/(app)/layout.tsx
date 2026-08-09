import { AppHeader } from "@/components/lms/app-header";
import { SiteFooter } from "@/components/site-footer";

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
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-[var(--radius-control)] focus:bg-accent focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <AppHeader />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
