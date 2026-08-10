import Link from "next/link";
import { ArrowSquareOutIcon } from "@phosphor-icons/react/dist/ssr";
import { Logo } from "@/components/logo";
import { brand } from "@/lib/content";
import { Container } from "@/components/ui";
import { AccountMenu } from "@/components/lms/account-menu";
import { getViewer } from "@/lib/auth";
import { openInvitationCount } from "@/lib/lms/events";
import { getTheme } from "@/lib/theme";
import { ThemeToggle } from "@/components/lms/theme-toggle";
import { HeaderLink } from "@/components/lms/header-link";
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
 *
 * ------------------------------------------------------------- the judge count
 *
 * The one badge in this bar, and it is the whole notification mechanism for
 * judging events: nothing is emailed, so a judge who does not open /judge is
 * never told anything. `openInvitationCount` counts invitations with no answer
 * on an event still ahead — not unread, because nothing here tracks whether a
 * page was looked at and a badge that clears when you glance at it reports
 * nothing. It clears when they have actually replied.
 *
 * One extra query, for judges only, on pages a judge is looking at.
 *
 * -------------------------------------------------- AND IT MUST NOT THROW
 *
 * Caught here, and this is not defensive noise — it is the one rule this
 * component has to obey. `AppHeader` renders from the `(app)` and `(learn)`
 * LAYOUTS, and `error.tsx` does not wrap the layout of its own segment; there is
 * no `global-error.tsx` either. So an exception raised here is not a broken
 * badge, it is Next's default error screen in place of every signed-in page on
 * the site.
 *
 * `getViewer` carries the same guard fifteen lines into `lib/auth.ts`, put there
 * by exactly this outage: a deploy with no Supabase variables threw inside this
 * component and took down every LMS route. A count for a nav badge is nowhere
 * near worth that, so a failure degrades to no badge and a log line.
 */
export async function AppHeader() {
  const viewer = await getViewer();

  const theme = await getTheme();

  let judgeCount = 0;
  if (viewer?.is("judge")) {
    try {
      judgeCount = await openInvitationCount();
    } catch (error) {
      console.error("judging invitations badge:", error);
    }
  }

  /*
    Signed out, this offered "Dashboard" and "Account" — two links whose only
    behaviour is to bounce the reader to /sign-in. Module 1 of every course is
    open with no account and this header sits on top of it, so the first screen
    of the entire funnel handed a prospect two dead clicks before they had read a
    word. Instructor and Judge were already gated on the viewer; the other two
    simply were not.
  */
  const links: { href: string; label: string; count?: number }[] = viewer
    ? [
        { href: "/dashboard", label: "Dashboard" },
        /* The tab Roan asked for. It sits beside Dashboard rather than inside it
           because a completion record is a thing somebody comes back for
           specifically — often long after they have stopped taking courses — and
           a destination you visit on purpose is a nav item, not a section of
           another page. */
        { href: "/dashboard/certifications", label: "Certifications" },
        ...(viewer.is("admin") ? [{ href: "/admin", label: "Admin" }] : []),
        /*
          BY ROLE, not by admin.

          These three lines used to sit inside `viewer.is("admin")` with a note
          saying that until there were real instructors and seated judges the
          safest default was that only the owner could open them. That default
          outlived its reason and became the defect: an instructor assigned to a
          course by the console, and a judge bound to a seat, had no link to
          their own console — and `requireRole("admin", "/instructor")` on the
          pages themselves meant that typing the address redirected them to the
          dashboard as well. The role granted them nothing.

          `requireRole` on each page is still the door and RLS is still the
          boundary. An admin sees both consoles because `requireRole` lets an
          admin pass every check, which is the rule that file states.
        */
        ...(viewer.is("instructor") || viewer.is("admin")
          ? [{ href: "/instructor", label: "Instructor" }]
          : []),
        ...(viewer.is("judge") || viewer.is("admin")
          ? [{ href: "/judge", label: "Judge", count: judgeCount }]
          : []),
      ]
    : [{ href: "/courses", label: "Courses" }];

  /* Resolved once and handed to every link, so the bar can decide which single
     item owns the current path. See header-link.tsx. */
  const hrefs = links.map((l) => l.href);

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
          {/*
            THE MARK GOES TO THE DASHBOARD HERE, and it went to `/` until now.

            Inside a product the lockup is the way back to the top of the
            product. Pointing it at the marketing site made the one control
            every reader presses without thinking the one control that threw
            them out — and there was nothing in this chrome that admitted the
            marketing site existed either, so the two were exactly backwards.
            "Visit website" below is the other half of the fix: an explicit exit
            rather than a mark that silently is one.

            Signed out, the product has no home, so it keeps `/`.
          */}
          <Logo
            size={36}
            descriptor
            compact
            href={viewer ? "/dashboard" : "/"}
            label={viewer ? `${brand.name}, dashboard` : undefined}
          />
          {/*
            `aria-label="Main"`. It was "Your courses", which is not what this
            nav contains — a screen-reader user listing landmarks heard the app's
            primary navigation announced as a course list, on a page whose h1 is
            about courses.
          */}
          <nav aria-label="Main" className="hidden items-center gap-1 sm:flex">
            {links.map((l) => (
              /* `hrefs` is every link in this bar, so `HeaderLink` can let the
                 longest match win. Without it /dashboard/certifications lit up
                 Dashboard and Certifications at the same time — that file has
                 the note. */
              <HeaderLink key={l.href} href={l.href} siblings={hrefs}>
                {l.label}
                <Count n={l.count} />
              </HeaderLink>
            ))}
          </nav>
        </div>

        {viewer ? (
          <div className="flex items-center gap-3">
            {/*
              The way out, stated.

              The footer carried this as one link among twenty-two in a marketing
              sitemap, which is not a door — it is a place a door might be. With
              the mark now pointing at the dashboard, a reader who wants the
              public site has to be given somewhere to press, and it has to say
              which of the two things it is: "Dashboard" and "website" are the
              pair of words Roan used to describe the confusion, so they are the
              pair of words the chrome uses.

              `ArrowSquareOut` rather than a plain arrow: it is the same tab, but
              it is a different site, and the glyph is the only thing in the row
              saying so.
            */}
            <Link
              href="/"
              className="t-meta hidden items-center gap-1.5 rounded-[var(--radius-control)] border border-line-control px-2.5 py-1.5 text-ink-secondary no-underline transition-colors hover:border-line-strong hover:text-ink md:inline-flex"
            >
              <ArrowSquareOutIcon size={14} aria-hidden="true" />
              Visit website
            </Link>
            {/* Hidden under sm so the 72px bar stays one row on a phone; the
                mobile nav row below carries it instead. */}
            <ThemeToggle theme={theme} className="hidden sm:inline-flex" />
            {/*
              Identity lives on the portrait, not in the nav row. "Account" was a
              top-level link beside Dashboard and Catalog, which are places in the
              product; this is who you are. It also meant the portrait, the
              account link and a sign-out button were three controls for one
              concept on a bar that already has to carry Instructor, Judge and
              Admin for staff.
            */}
            <AccountMenu
              name={viewer.profile?.first_name ?? viewer.name}
              email={viewer.email}
              avatarUrl={viewer.profile?.avatar_url ?? null}
              signOut={signOut}
            />
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <HeaderLink href="/sign-in">Sign in</HeaderLink>
            <Link
              href="/sign-up"
              className="t-button rounded-[var(--radius-control)] bg-accent px-4 py-2.5 text-on-accent no-underline transition-colors hover:bg-accent-hover"
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
        <Container className="flex flex-wrap items-center gap-x-1 gap-y-0 py-1.5">
          {links.map((l) => (
            <HeaderLink key={l.href} href={l.href} siblings={hrefs}>
              {l.label}
              <Count n={l.count} />
            </HeaderLink>
          ))}
          {viewer ? <ThemeToggle theme={theme} className="ml-auto" /> : null}
        </Container>
      </nav>
    </header>
  );
}

/**
 * The count beside a nav item, when there is something waiting.
 *
 * The number is repeated in `sr-only` text with a word after it, because "Judge
 * 2" read aloud is a heading level, a version, or nothing. `aria-hidden` on the
 * pill itself so the digit is not announced twice.
 *
 * `--accent-tint`, not a red dot. Nothing here is an alert; it is work waiting,
 * which is what the accent means everywhere else in this product.
 */
function Count({ n }: { n?: number }) {
  if (!n) return null;
  return (
    <>
      <span
        aria-hidden="true"
        className="t-micro ml-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 tabular-nums text-on-accent"
      >
        {n > 9 ? "9+" : n}
      </span>
      <span className="sr-only">, {n} waiting on your answer</span>
    </>
  );
}

/*
  `HeaderLink` moved to its own file and became a client component. It needs
  `usePathname` to mark the current section, which this server component cannot
  give it, and the alternative — threading the pathname down from every server
  parent that renders a header — is worse than a few hundred bytes of client
  JavaScript for a link.
*/
