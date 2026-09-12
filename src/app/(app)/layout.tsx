import { AppHeader } from "@/components/lms/app-header";
import { LearnFooter } from "@/components/lms/learn-footer";
import { getTheme } from "@/lib/theme";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const theme = await getTheme();

  return (
    <div data-theme={theme} className="portal-shell flex min-h-dvh flex-col bg-surface-subtle text-ink">
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
      <LearnFooter />
    </div>
  );
}
