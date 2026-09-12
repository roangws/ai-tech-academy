import Link from "next/link";
import { ArrowSquareOutIcon, SunIcon } from "@phosphor-icons/react/dist/ssr";
import { Crest } from "@/components/logo";
import { brand } from "@/lib/content";
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
      <Container className="grid grid-cols-[auto_1fr] items-center gap-x-5 lg:grid-cols-[auto_1fr_auto] lg:gap-x-8">
        <Link href={viewer ? "/dashboard" : "/"} aria-label={`${brand.name}, academy portal`} className="flex h-14 items-center gap-2 no-underline lg:h-16">
          <Crest size={24} />
          <span className="text-[14px] font-semibold tracking-[-0.02em] text-ink">Academy<span className="ml-1.5 font-normal text-ink-muted">/ Portal</span></span>
        </Link>
        <div className="contents"><PortalNavigation links={links} /></div>
        <div className="col-start-2 row-start-1 flex items-center justify-end gap-2 lg:col-start-3">
          <Link href="/" className="hidden min-h-11 items-center gap-1 text-[12px] text-ink-muted no-underline hover:text-ink sm:inline-flex"><span>Website</span><ArrowSquareOutIcon size={13} aria-hidden="true" /></Link>
          <Link href="/" aria-label="Visit website" className="inline-flex size-9 items-center justify-center text-ink-muted hover:text-ink sm:hidden"><ArrowSquareOutIcon size={17} aria-hidden="true" /></Link>
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
