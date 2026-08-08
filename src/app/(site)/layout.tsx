import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

/**
 * The page chrome, for every route that has chrome.
 *
 * The skip link, the header, the main landmark and the footer were mounted by
 * hand inside each page. That was fine at one route and wrong by three, which is
 * what the tree had: the homepage carried all four, the review board carried the
 * header and footer and no skip link, and a third route was about to repeat the
 * whole set again.
 *
 * Two things made this worth doing now rather than later.
 *
 * The header is `sticky` and holds scroll state. Navigating from a course card to
 * a course page is a client transition, so with the header inside the page it
 * unmounted and remounted: `scrolled` reset to false and the frosted layer
 * re-evaluated from scratch, which is a visible flicker in the middle of a
 * transition. In a layout it stays mounted and the transition is silent.
 *
 * And the missing skip link was a real accessibility gap rather than an
 * inconsistency. Hoisting it fixes every route at once and makes it impossible
 * for the next route to be added without one.
 *
 * A ROUTE GROUP, and not the root layout. `/sign-up` is deliberately bare: it
 * returns the auth panel and nothing else, and a product nav with six links to
 * another page's sections has no business on a screen somebody is trying to
 * finish. `(site)` adds no URL segment, so nothing about the routing changes;
 * `sign-up` simply sits outside it and keeps rendering alone.
 *
 * `<main id="main">` moving up here means each page's sections are children of a
 * `<main>` the page does not own. That is the point. It is what makes one skip
 * link work for all of them.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-[var(--radius-control)] focus:bg-accent focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <SiteHeader />
      {/*
        `tabIndex={-1}` is what makes the skip link above actually skip.

        `<main>` is not focusable by default, and Safari in particular follows
        the fragment without moving focus: the viewport scrolls, the next Tab
        continues from the skip link, and the reader is put straight back into
        the header they just asked to jump over. Making the target programmatically
        focusable is the fix the WAI pattern specifies, and it costs nothing on the
        browsers that already do the right thing.

        `outline-none` unconditionally rather than `focus:outline-none`. The focus
        here arrives programmatically, so `:focus` matches and the UA would draw a
        ring around the entire page content. `focus-visible` styling elsewhere is
        untouched — this element never gets it, because it is never focused by a
        gesture that counts as visible-intent.
      */}
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
