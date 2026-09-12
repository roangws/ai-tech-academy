"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function HeaderLink({
  href,
  siblings = [],
  children,
  className,
  variant = "item",
}: {
  href: string;
  siblings?: readonly string[];
  children: React.ReactNode;
  className?: string;
  variant?: "item" | "tab";
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
        "inline-flex min-h-11 items-center text-[13px] no-underline transition-colors",
        variant === "tab"
          ? `h-full border-b-2 pt-0.5 ${active ? "border-ink font-medium text-ink" : "border-transparent text-ink-muted hover:text-ink"}`
          : `rounded-[var(--radius-control)] px-2.5 ${active ? "bg-surface-subtle font-medium text-ink" : "text-ink-secondary hover:bg-surface-subtle hover:text-ink"}`,
        className,
      )}
    >
      {children}
    </Link>
  );
}
