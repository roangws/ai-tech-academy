"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRightIcon, CaretDownIcon } from "@phosphor-icons/react/dist/ssr";
import { CourseGlyph } from "@/components/course/icons";
import type { Course } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * The five courses, under the Courses nav item.
 *
 * ------------------------------------------------------ two bugs, both mine
 *
 * The first version could not be clicked at all. Its panel was `absolute
 * top-full mt-2`, so those 8px belonged to no element: moving the pointer from
 * the caret toward a course left the wrapper that owned `onMouseLeave` and shut
 * the menu before it could be reached. The gap is transparent padding INSIDE the
 * positioned element now, so there is nothing to cross.
 *
 * The second was subtler and is why hover and click have to know about each
 * other. `onMouseEnter` opens the menu, so by the time a pointer reaches the
 * caret the menu is already open — and a plain toggle on that caret therefore
 * CLOSES it. The control whose entire job is "show me the courses" hid them, on
 * the input device most people use.
 *
 * So the component records HOW it opened. Opened by hover, the first click
 * adopts the panel rather than undoing it: it stays open and now belongs to the
 * click, so a second click closes it. Opened by keyboard or touch, where there
 * was no hover, the first click closes it as it should. A ref rather than state
 * because nothing renders from it.
 *
 * --------------------------------------------------------------- the anatomy
 *
 * A link and a separate caret, not one control doing both. `/courses` is a real
 * page, so making the label open a menu instead of going there would remove a
 * destination to add a shortcut. The caret owns `aria-expanded`; the link owns
 * the navigation. A keyboard user reaches the page on the first tab and the menu
 * on the second.
 *
 * Not `role="menu"`. That promises the ARIA menu keyboard model — arrows move,
 * typing selects — and this is a list of links that Tab walks. Claiming it tells
 * a screen reader to expect behaviour that is not implemented.
 */
export function CoursesMenu({
  href,
  label,
  current,
  className,
  /*
    The catalogue arrives as a prop rather than as an import.

    This is a client component and the catalogue is a database query now, so it
    cannot read it. The list is resolved in the (site) layout — a server
    component — and threaded down through SiteHeader. That also means the menu
    shows courses created in the console without this file knowing they exist.
  */
  courses,
  onMouseEnter,
  onFocus,
  onBlur,
}: {
  href: string;
  label: string;
  current?: boolean;
  className?: string;
  courses: readonly Pick<Course, "id" | "slug" | "title" | "badge" | "level" | "duration">[];
  onMouseEnter?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const openedByHover = useRef(false);
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
    /*
      `data-nav` IS ON THIS DIV, and it used to be on the `<Link>` inside it.

      Two things were wrong with that and they are the same mistake seen from two
      sides. The travelling pill in site-header.tsx measures the element carrying
      `data-nav`, so it measured the label alone: the caret — which is part of this
      control, not a decoration beside it — sat outside the lozenge, which is what
      Roan photographed. And `offsetLeft` is read against the nearest positioned
      ancestor, which for the old target was THIS `relative` div rather than the
      nav, so the number the pill was placed at was ~0. Courses is the first item,
      so a pill parked at the left edge of the nav happened to land near the right
      place and the bug stayed invisible.

      Moving the attribute up one level fixes both at once: the div is a direct
      child of the positioned nav, so `offsetLeft` is measured against the row, and
      its width is the label plus the caret, so the pill covers the whole control.
    */
    <div
      data-nav={href}
      className={cn("relative", className)}
      onMouseEnter={() => {
        setOpen(true);
        openedByHover.current = true;
        onMouseEnter?.();
      }}
      onMouseLeave={() => {
        setOpen(false);
        openedByHover.current = false;
      }}
      onFocus={onFocus}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setOpen(false);
          onBlur?.();
        }
      }}
    >
      {/* The label and the caret read as one control, so the padding that shapes
          the pill lives here and the two children carry none of their own on the
          outer edges. `pr-2` against `pl-2` looks lopsided written down and is
          correct on screen: the caret is 12px of ink inside a 20px box, so the
          optical gap on the right is already wider than the number says. */}
      <span className="flex items-center gap-0.5 rounded-full py-2 pl-2 pr-2 xl:pl-3.5 xl:pr-3">
        <Link
          href={href}
          aria-current={current ? "page" : undefined}
          className={cn(
            "t-nav relative whitespace-nowrap no-underline transition-colors",
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
          onClick={() => {
            if (open && openedByHover.current) {
              /* Hover opened it; this click adopts it rather than undoing it. */
              openedByHover.current = false;
              return;
            }
            setOpen((v) => !v);
          }}
          className={cn(
            "flex size-5 items-center justify-center rounded-full transition-colors",
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

      {/* `top-full` with NO margin, and the visual gap as padding inside, so the
          pointer never leaves the hover region on its way to a course. */}
      <div
        className={cn("absolute left-0 top-full z-50 pt-2", open ? "block" : "hidden")}
      >
        <nav
          id="courses-menu"
          aria-label="Courses"
          className="w-[336px] overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-e2"
        >
          <ul className="p-1">
            {courses.map((course) => {
              /* The course being read is marked in the list it was picked from.
                 Without it the menu is the only piece of chrome that cannot say
                 where you are — you open it from a course page and five courses
                 look identical. */
              const here =
                pathname === `/courses/${course.slug}` ||
                pathname === `/learn/${course.slug}` ||
                pathname.startsWith(`/learn/${course.slug}/`);

              return (
              <li key={course.id}>
                <Link
                  href={`/courses/${course.slug}`}
                  aria-current={here ? "page" : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-[var(--radius-control)] px-2.5 py-2 no-underline transition-colors",
                    here ? "bg-accent-tint" : "hover:bg-surface-subtle",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-8 flex-none place-items-center rounded-[var(--radius-control)] text-accent transition-colors",
                      here ? "bg-surface" : "bg-surface-subtle group-hover:bg-surface",
                    )}
                  >
                    <CourseGlyph id={course.id} size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    {/*
                      `t-body-sm` and `clamp-1`, not `t-button` on two lines.

                      "AI literacy, ethics and data compliance" wrapped, so one of
                      five rows was double-height and the list lost its rhythm.
                      A nav panel is scanned, not read: one line per course, with
                      the full title still on the card a click away.
                    */}
                    <span
                      className={cn(
                        "t-body-sm block clamp-1",
                        here ? "text-accent" : "text-ink",
                      )}
                    >
                      {course.title}
                    </span>
                    <span className="t-micro block text-ink-muted">
                      {course.level} · {course.duration}
                    </span>
                  </span>
                </Link>
              </li>
              );
            })}
          </ul>

          <div className="border-t border-line p-1">
            <Link
              href="/courses"
              className="t-body-sm flex items-center justify-between gap-2 rounded-[var(--radius-control)] px-2.5 py-2 text-ink-secondary no-underline transition-colors hover:bg-surface-subtle hover:text-ink"
            >
              Compare all five
              <ArrowRightIcon size={13} weight="bold" aria-hidden="true" className="flex-none" />
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
