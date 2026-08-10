"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * A nav link that knows whether you are on it.
 *
 * The header is the only persistent chrome in the product and it emitted no
 * location signal at all: on /dashboard, "Dashboard" rendered in exactly the
 * same `--ink-secondary` as "Catalog" and "Account". In a five-course LMS with
 * three role consoles, a learner could not tell at a glance whether they were in
 * the catalog or their own dashboard, and an instructor could not tell they had
 * left the console.
 *
 * `aria-current="page"` first, then the tint. The colour is the second cue, not
 * the only one — and `--accent-tint` was contrast-checked for exactly this
 * control when it was added (6.30:1 against the accent, per the note in
 * globals.css).
 *
 * A client component only because it needs `usePathname`. It is a link and a
 * string; the cost is a few hundred bytes and the alternative is threading the
 * pathname down from every server parent that renders a header.
 *
 * `/learn` counts as Catalog rather than as nothing: a learner reading a lesson
 * is inside a course, and leaving every item unmarked there would be the one
 * place the signal is most useful.
 *
 * ------------------------------------------------------ ONLY ONE AT A TIME
 *
 * `siblings` is what stops the bar highlighting two items at once, and it is
 * load-bearing rather than a nicety.
 *
 * The `/dashboard` branch used to claim any path under it, and Certifications
 * lives at `/dashboard/certifications` — so on that page BOTH pills were tinted
 * and both carried `aria-current="page"`, which is not a cosmetic bug: a screen
 * reader was told the reader was on two pages, and Roan's report was that the
 * chrome had simply stopped saying where he was.
 *
 * The rule is longest match wins. A parent link keeps its prefix behaviour, which
 * is what makes /learn read as Courses and /dashboard/outcome read as Dashboard,
 * but it yields to any sibling in the same nav whose own href is a longer prefix
 * of the same path. That is derived from the nav rather than special-cased, so
 * adding a third `/dashboard/...` tab needs no change here.
 */
export function HeaderLink({
  href,
  siblings = [],
  children,
}: {
  href: string;
  /** Every href in this nav, so the longest matching one can win. */
  siblings?: readonly string[];
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";

  /* Does this href own the current path at all? `/courses` also answers for
     `/learn`, because a learner reading a lesson is inside a course. */
  const owns = (candidate: string) =>
    candidate === "/courses"
      ? pathname === "/courses" ||
        pathname.startsWith("/courses/") ||
        pathname === "/learn" ||
        pathname.startsWith("/learn/")
      : pathname === candidate || pathname.startsWith(`${candidate}/`);

  const active =
    owns(href) &&
    /* Yield to a sibling that matches the same path more specifically. `>` and
       not `>=`, so an href never loses to itself. */
    !siblings.some((s) => s.length > href.length && owns(s));

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        /* 44px minimum tap target below lg. These were bare 14px/20px links —
           a 20px-tall strip, which WCAG 2.5.8 fails outright at AA. */
        "t-nav inline-flex min-h-[44px] items-center rounded-full px-2.5 no-underline transition-colors lg:min-h-0 lg:py-1.5",
        active ? "bg-accent-tint text-accent" : "text-ink-secondary hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}
