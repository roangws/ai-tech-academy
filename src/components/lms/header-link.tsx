"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function HeaderLink({
  href,
  siblings = [],
  children,
  className,
}: {
  href: string;
  siblings?: readonly string[];
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname() ?? "";

  // Learning pages belong to My learning, or Courses for public previews.
  const owns = (candidate: string) =>
    candidate === "/courses" || candidate === "/dashboard"
      ? pathname === candidate ||
        pathname.startsWith(`${candidate}/`) ||
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
        "t-nav inline-flex min-h-[44px] items-center rounded-[var(--radius-control)] px-2.5 no-underline transition-colors",
        active ? "bg-accent-tint font-semibold text-accent underline decoration-2 underline-offset-8" : "text-ink-secondary hover:text-ink",
        className,
      )}
    >
      {children}
    </Link>
  );
}
