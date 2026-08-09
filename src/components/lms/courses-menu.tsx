"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr";
import { CourseGlyph } from "@/components/course/icons";
import { courseHref, courses } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * The five courses, under the Courses nav item.
 *
 * -------------------------------------------------- why this is the second version
 *
 * The first one could not be clicked on a pointer device, and that is the whole
 * reason it is being rewritten rather than restored.
 *
 * Its panel was `absolute top-full mt-2`. `top-full` puts the top edge at the
 * bottom of the wrapper and `mt-2` then pushes it 8px further down, so those 8px
 * belonged to no element at all. The wrapper owned `onMouseLeave`, so moving the
 * pointer from the caret toward a course crossed that strip, left the wrapper,
 * and closed the menu before it could be reached. Keyboard and touch were
 * unaffected, which is exactly why it survived review and failed for everyone
 * using a mouse.
 *
 * The fix is structural rather than a timer: the positioned element now starts
 * flush at `top-full` and carries the gap as its own transparent `pt-2`, so the
 * pointer never leaves the hover region. There is no dead zone to cross because
 * there is no gap outside an element any more.
 *
 * A close timer would also have "worked", and it would have been the wrong fix:
 * it makes the menu linger after a deliberate exit and turns a layout bug into a
 * timing one that only reproduces on a slow hand.
 *
 * --------------------------------------------------------------- the anatomy
 *
 * A link and a separate caret button, not one control that does both. `/courses`
 * is a real page a reader may want, so making the label open a menu instead of
 * going there would remove a destination to add a shortcut. The caret owns
 * `aria-expanded` and `aria-controls`; the link owns the navigation. A keyboard
 * user reaches the page on the first tab and the menu on the second.
 *
 * Not `role="menu"`. That promises the ARIA menu keyboard model — arrows move,
 * Home and End jump, typing selects — and this is a list of ordinary links that
 * Tab walks. Claiming the role tells a screen reader to expect behaviour that is
 * not implemented, which is worse than the plain disclosure it actually is.
 */
export function CoursesMenu({
  href,
  label,
  current,
  className,
}: {
  href: string;
  label: string;
  current?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  /* Close on navigation, derived rather than synced in an effect. */
  const [openedAt, setOpenedAt] = useState(pathname);
  if (open && openedAt !== pathname) {
    setOpen(false);
    setOpenedAt(pathname);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div
      ref={wrap}
      className={cn("relative", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <span className="flex items-center">
        <Link
          href={href}
          data-nav={href}
          aria-current={current ? "page" : undefined}
          className={cn(
            "t-nav relative whitespace-nowrap rounded-full py-2 pl-2 pr-1 no-underline transition-colors xl:pl-3.5",
            current ? "text-accent" : "text-ink-secondary hover:text-ink",
          )}
        >
          {label}
        </Link>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="courses-menu"
          aria-label={open ? "Hide the course list" : "Show the course list"}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "mr-1 flex h-8 w-6 items-center justify-center rounded-full transition-colors xl:mr-2",
            current ? "text-accent" : "text-ink-muted hover:text-ink-secondary",
          )}
        >
          <CaretDownIcon
            size={12}
            weight="bold"
            aria-hidden="true"
            className={cn("transition-transform duration-200", open && "rotate-180")}
          />
        </button>
      </span>

      {/*
        `top-full` with NO margin, and the visual gap as padding inside.

        This is the fix. The 8px between the bar and the panel is now part of an
        element the pointer is still inside, so travelling from the caret to a
        course never leaves the wrapper and never closes the menu.
      */}
      <div
        className={cn(
          "absolute left-0 top-full z-50 pt-2",
          open ? "block" : "pointer-events-none hidden",
        )}
      >
        <nav
          id="courses-menu"
          aria-label="Courses"
          className="w-[300px] overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-e2"
        >
          <ul className="p-1.5">
            {courses.map((course) => (
              <li key={course.id}>
                <Link
                  href={courseHref(course.id)}
                  className="flex items-start gap-3 rounded-[var(--radius-control)] px-2.5 py-2 no-underline transition-colors hover:bg-surface-subtle"
                >
                  <CourseGlyph id={course.id} size={18} className="mt-0.5 flex-none text-accent" />
                  <span className="min-w-0">
                    <span className="t-button block text-ink">{course.title}</span>
                    <span className="t-meta mt-0.5 block text-ink-muted">
                      {course.level} · {course.duration}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="border-t border-line p-1.5">
            <Link
              href="/courses"
              className="t-button flex items-center rounded-[var(--radius-control)] px-2.5 py-2 text-ink-secondary no-underline transition-colors hover:bg-surface-subtle"
            >
              Compare all five
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
