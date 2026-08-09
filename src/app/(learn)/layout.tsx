import { AppHeader } from "@/components/lms/app-header";
import { LearnFooter } from "@/components/lms/learn-footer";
import { getTheme } from "@/lib/theme";

/**
 * The chrome for reading, watching and listening.
 *
 * ------------------------------------------------------- why a separate group
 *
 * `(app)` renders `SiteFooter`, and a nested layout cannot remove something its
 * parent rendered. Learn mode needs it gone: a sixteen-link marketing sitemap
 * under a lesson is 37% of the page on a phone and every link in it leaves the
 * course. Route groups add no URL segment, so `/learn/...` is unchanged by this
 * existing — it is a free way to give one branch different chrome.
 *
 * ------------------------------------------------------------ still no auth
 *
 * Same rule as `(app)`, and here it is load-bearing rather than incidental:
 * module 1 of every course is open with no account and lives entirely under this
 * layout. The gate is per module, in `lib/lms/access.ts`, applied as an early
 * return inside each page before any content is fetched into the tree.
 *
 * The skip link, the `#main` id and the theme element are identical to `(app)`'s
 * on purpose — three groups now name the same things the same way, so moving a
 * route between them changes its chrome and nothing else.
 */
export default async function LearnLayout({ children }: { children: React.ReactNode }) {
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
      <main
        id="main"
        tabIndex={-1}
        className="flex-1 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[var(--focus)]"
      >
        {children}
      </main>
      <LearnFooter />
    </div>
  );
}
