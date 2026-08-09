import { SmoothAnchors } from "@/components/smooth-anchors";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getViewer } from "@/lib/auth";
import { getCatalog } from "@/lib/catalog";

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
/**
 * ------------------------------------------------------- why this is now async
 *
 * The header needs to know whether anyone is signed in, so it can show a reader
 * their account instead of offering them one they already have. `SiteHeader` is
 * a client component and cannot read the session itself, so the layout reads it
 * and passes it down.
 *
 * The cost is real and worth naming: `getViewer()` reads cookies, so every route
 * under this group becomes dynamic. The pages themselves keep their own
 * `revalidate` for data, but the shell is now rendered per request. The
 * alternative — fetching the session in the browser after mount — would flash
 * "Sign in" at every signed-in reader on every page before correcting itself,
 * which is worse than the caching.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [viewer, courses] = await Promise.all([getViewer(), getCatalog()]);
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-[var(--radius-control)] focus:bg-accent focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <SiteHeader
        viewer={
          viewer
            ? { name: viewer.name, email: viewer.email, avatarUrl: viewer.profile?.avatar_url ?? null }
            : null
        }
        courses={courses.map((c) => ({
          id: c.id,
          slug: c.slug,
          title: c.title,
          badge: c.badge,
          level: c.level,
          duration: c.duration,
        }))}
      />
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
      <SmoothAnchors />
      <SiteFooter />
    </>
  );
}
