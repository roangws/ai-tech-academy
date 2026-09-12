import Link from "next/link";
import { ArrowSquareOutIcon } from "@phosphor-icons/react/dist/ssr";
import { Logo } from "@/components/logo";
import { brand } from "@/lib/content";
import { Container } from "@/components/ui";
import { AccountMenu } from "@/components/lms/account-menu";
import { getViewer, type Viewer } from "@/lib/auth";
import { openInvitationCount } from "@/lib/lms/events";
import { getTheme, type Theme } from "@/lib/theme";
import { ThemeToggle } from "@/components/lms/theme-toggle";
import { HeaderLink } from "@/components/lms/header-link";
import { signOut } from "@/app/actions/auth";

/** Shared portal navigation. Route guards and RLS still enforce permissions. */
export async function AppHeader() {
  const [viewer, theme] = await Promise.all([getViewer(), getTheme()]);
  let judgeCount = 0;
  if (viewer?.is("judge")) {
    try {
      judgeCount = await openInvitationCount();
    } catch (error) {
      // A failed notification query must not take down the shared layout.
      console.error("judging invitations badge:", error);
    }
  }
  return <PortalHeader viewer={viewer} theme={theme} judgeCount={judgeCount} />;
}

/** Presentational shell; permissions are resolved by AppHeader on the server. */
export function PortalHeader({ viewer, theme, judgeCount = 0 }: {
  viewer: Viewer | null;
  theme: Theme;
  judgeCount?: number;
}) {
  const links: { href: string; label: string; count?: number }[] = viewer
    ? [
        { href: "/dashboard", label: "My learning" },
        { href: "/dashboard/certifications", label: "Certifications" },
        ...(viewer.is("instructor") || viewer.is("admin")
          ? [{ href: "/instructor", label: "Instructor" }] : []),
        ...(viewer.is("judge") || viewer.is("admin")
          ? [{ href: "/judge", label: "Judge", count: judgeCount }] : []),
        ...(viewer.is("admin") ? [{ href: "/admin", label: "Admin" }] : []),
      ]
    : [{ href: "/courses", label: "Courses" }];
  const hrefs = links.map((link) => link.href);
  return (
    <header className="portal-header relative top-0 z-40 border-b border-line bg-surface lg:sticky">
      <div className="bg-[#082b3a] text-white">
        <Container className="flex min-h-[80px] items-center justify-between gap-3 py-3">
          <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-5">
            <Logo size={32} compact tone="dark" href={viewer ? "/dashboard" : "/"}
              label={viewer ? `${brand.name}, my learning` : undefined} />
            <span className="text-[12px] font-medium tracking-wide text-[#c2e6f0] sm:border-l sm:border-white/25 sm:py-2 sm:pl-5 sm:text-sm">
              Academy portal
            </span>
          </div>
          <Link href="/" className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-[var(--radius-control)] border border-white/40 px-3 text-[13px] font-medium text-white no-underline hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            <ArrowSquareOutIcon size={16} aria-hidden="true" />Visit website
          </Link>
        </Container>
      </div>
      <Container className="flex flex-wrap items-center gap-1 py-2">
        <nav aria-label="Portal" className="contents">
          {links.map((link) => (
            <HeaderLink key={link.href} href={link.href} siblings={hrefs}>
              {link.label}
              {link.count ? <>
                <span aria-hidden="true" className="ml-1.5 rounded-full bg-accent px-1.5 text-xs tabular-nums text-on-accent">{link.count > 9 ? "9+" : link.count}</span>
                <span className="sr-only">, {link.count} waiting on your answer</span>
              </> : null}
            </HeaderLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle theme={theme} className="hidden sm:inline-flex" />
          <details className="relative sm:hidden">
            <summary className="t-meta flex min-h-11 cursor-pointer items-center rounded-[var(--radius-control)] px-2 text-ink-secondary hover:bg-surface-subtle">Theme</summary>
            <div className="absolute right-0 top-full z-50 rounded-[var(--radius-control)] border border-line bg-surface p-2 shadow-e2">
              <ThemeToggle theme={theme} />
            </div>
          </details>
          {viewer ? (
            <AccountMenu name={viewer.profile?.first_name ?? viewer.name} email={viewer.email}
              avatarUrl={viewer.profile?.avatar_url ?? null} signOut={signOut} />
          ) : (
            <><HeaderLink href="/sign-in">Sign in</HeaderLink>
              <Link href="/sign-up" className="t-button inline-flex min-h-11 items-center rounded-[var(--radius-control)] bg-accent px-3 text-on-accent no-underline hover:bg-accent-hover">Create account</Link></>
          )}
        </div>
      </Container>
    </header>
  );
}
