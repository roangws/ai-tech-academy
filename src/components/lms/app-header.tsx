import Link from "next/link";
import { Logo } from "@/components/logo";
import { Container } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { signOut } from "@/app/actions/auth";

/**
 * The chrome for the signed-in surfaces.
 *
 * ------------------------------------------------------- why not SiteHeader
 *
 * `SiteHeader` is 917 lines of scroll-spy, a motion-driven liquid pill indicator
 * tracking the active section, a mobile drawer and a courses dropdown. Every one
 * of those is built for a long marketing page where the nav's job is to show
 * where you are within a single scroll.
 *
 * None of it applies here. These are short, task-shaped pages with no sections to
 * spy on, and mounting it would ship a client component with a scroll listener to
 * a dashboard that does not scroll, so that it could highlight links to a page
 * the reader has left.
 *
 * So this is the same brand, the same tokens, the same 8px controls and the same
 * type scale, at a tenth of the weight — and it is a server component, which
 * `SiteHeader` cannot be.
 *
 * ---------------------------------------------------------------- the links
 *
 * Instructor and Judge appear only for people who hold those roles. That is a
 * courtesy, not a control: `requireRole` guards the routes and row-level
 * security guards the data, and a reader who types /judge without the role gets
 * a redirect whether or not a link was drawn for them.
 */
export async function AppHeader() {
  const viewer = await getViewer();

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/courses", label: "Catalog" },
    ...(viewer?.is("instructor") || viewer?.is("admin")
      ? [{ href: "/instructor", label: "Instructor" }]
      : []),
    ...(viewer?.is("judge") || viewer?.is("admin") ? [{ href: "/judge", label: "Judge" }] : []),
  ];

  return (
    /*
      `h-[72px]`, matching `SiteHeader`. It was 64, so the chrome jumped 8px and
      the wordmark shrank whenever a reader crossed from /courses to /dashboard —
      and `scroll-padding-top: 84px` in globals.css is calibrated as "72px of
      chrome plus 12 of air", so every in-page anchor under this header landed
      8px off.

      The blur is on an inner `-z-10` layer rather than on the header element.
      `backdrop-filter` makes the element it is on a backdrop root, so any glass
      control inside it can only sample the header's own emptiness — which is why
      site-header.tsx moved it years' worth of notes ago, and why putting it back
      here would have broken the first LiquidButton mounted in this bar.
    */
    <header className="sticky top-0 z-40 border-b border-line">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-surface/85 backdrop-blur-md" />
      <Container className="flex h-[72px] items-center justify-between gap-6">
        <div className="flex items-center gap-7">
          <Logo size={36} descriptor compact />
          {/*
            `aria-label="Main"`. It was "Your courses", which is not what this
            nav contains — a screen-reader user listing landmarks heard the app's
            primary navigation announced as a course list, on a page whose h1 is
            about courses.
          */}
          <nav aria-label="Main" className="hidden items-center gap-6 sm:flex">
            {links.map((l) => (
              <HeaderLink key={l.href} href={l.href}>
                {l.label}
              </HeaderLink>
            ))}
          </nav>
        </div>

        {viewer ? (
          <div className="flex items-center gap-4">
            {/* The email rather than the name, because on this control a reader
                is checking which account they are in, and two people called Sam
                are told apart by the address and not by the greeting. */}
            <span className="t-meta hidden max-w-[22ch] truncate text-ink-muted md:inline">
              {viewer.email}
            </span>
            {/*
              A form, not a link. Signing out changes server state, and a GET
              that mutates is a GET that a link prefetcher, a browser preview or
              an antivirus scanner will eventually fire on its own — which is how
              a reader gets signed out by hovering.
            */}
            <form action={signOut}>
              <button
                type="submit"
                className="t-button rounded-[var(--radius-control)] border border-line px-3.5 py-2 text-ink-secondary transition-colors hover:border-line-strong hover:text-ink"
              >
                Sign out
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <HeaderLink href="/sign-in">Sign in</HeaderLink>
            <Link
              href="/sign-up"
              className="t-button rounded-[var(--radius-control)] bg-accent px-4 py-2.5 text-white no-underline transition-colors hover:bg-accent-hover"
            >
              Create account
            </Link>
          </div>
        )}
      </Container>

      {/*
        The same links again, below the bar, under `sm`.

        The row above is `hidden sm:flex` and nothing replaced it on a phone —
        so a signed-in learner on /learn/gtm/03 had no route to their dashboard
        from anywhere on the page, and the footer is a marketing sitemap that
        carries none of these routes either. The browser back button was the only
        way out.

        A wrapped row rather than the drawer `SiteHeader` ships: there are only
        ever two to four links here, so the machinery a six-item marketing nav
        needs would be a disclosure button hiding three words.
      */}
      <nav
        aria-label="Main"
        className="relative border-t border-line bg-surface-subtle sm:hidden"
      >
        <Container className="flex flex-wrap items-center gap-x-5 gap-y-1 py-2.5">
          {links.map((l) => (
            <HeaderLink key={l.href} href={l.href}>
              {l.label}
            </HeaderLink>
          ))}
        </Container>
      </nav>
    </header>
  );
}

function HeaderLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="t-nav text-ink-secondary no-underline transition-colors hover:text-ink"
    >
      {children}
    </Link>
  );
}
