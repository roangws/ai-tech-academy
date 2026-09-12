import Link from "next/link";
import { SunIcon } from "@phosphor-icons/react/dist/ssr";
import { HeaderIdentity } from "@/components/header-identity";
import { Container } from "@/components/ui";
import { AccountMenu } from "@/components/lms/account-menu";
import { getViewer, type Viewer } from "@/lib/auth";
import { openInvitationCount } from "@/lib/lms/events";
import { getTheme, type Theme } from "@/lib/theme";
import { ThemeToggle } from "@/components/lms/theme-toggle";
import { PortalNavigation } from "@/components/lms/portal-navigation";
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
  return (
    <header className="portal-header relative top-0 z-40 border-b border-line bg-surface lg:sticky">
      <Container className="grid grid-cols-[auto_1fr] items-center gap-x-3 lg:grid-cols-[auto_1fr_auto] lg:gap-x-6">
        <div className="flex h-14 items-center lg:h-16"><HeaderIdentity area="learning" signedIn={Boolean(viewer)} /></div>
        <div className="contents"><PortalNavigation links={links} /></div>
        <div className="col-start-2 row-start-1 flex items-center justify-end gap-2 lg:col-start-3">
          <details className="relative">
            <summary aria-label="Colour theme" className="flex size-9 cursor-pointer list-none items-center justify-center rounded-[var(--radius-control)] text-ink-muted hover:bg-surface-subtle hover:text-ink [&::-webkit-details-marker]:hidden"><SunIcon size={17} aria-hidden="true" /></summary>
            <div className="absolute right-0 top-full z-50 mt-1 rounded-[var(--radius-control)] border border-line bg-surface p-2 shadow-e2"><ThemeToggle theme={theme} /></div>
          </details>
          {viewer ? <AccountMenu name={viewer.profile?.first_name ?? viewer.name} email={viewer.email} avatarUrl={viewer.profile?.avatar_url ?? null} signOut={signOut} /> : <Link href="/sign-in" className="inline-flex min-h-11 items-center text-[13px] font-medium text-ink no-underline">Sign in</Link>}
        </div>
      </Container>
    </header>
  );
}
