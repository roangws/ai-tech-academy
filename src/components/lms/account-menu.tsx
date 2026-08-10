"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowSquareOutIcon, SignOutIcon, UserCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { Avatar } from "@/components/lms/avatar";
import { cn } from "@/lib/utils";

/**
 * Identity, and the two things you do with it.
 *
 * ------------------------------------------------------------------ why a menu
 *
 * "Account" was a top-level nav item sitting beside Dashboard and Catalog, and
 * it does not belong there: those are places in the product, and this is who you
 * are. It also meant the portrait and the account link were two separate
 * controls doing the same job, two inches apart, while "Sign out" took a third
 * slot — three pieces of chrome for one concept, on a bar that also has to carry
 * Instructor, Judge and Admin for staff.
 *
 * The portrait is now the control, which is where every reader already looks.
 *
 * -------------------------------------------------------- what it has to get right
 *
 * A menu is easy to build badly, and the failures are all keyboard failures:
 *
 *   - `aria-expanded` and `aria-haspopup` on the trigger, so it announces as a
 *     menu button rather than as an image.
 *   - Escape closes it AND returns focus to the trigger. Closing without
 *     restoring focus drops a keyboard reader at the top of the document, which
 *     is the same bug the enrol button had.
 *   - A pointer-down listener rather than click, so pressing outside closes
 *     before the thing underneath activates.
 *   - It closes on navigation. Next keeps the layout mounted across a route
 *     change, so without this the menu stays open over the page it just opened.
 *
 * Sign out stays a form POST inside the menu. It changes server state, and a GET
 * that mutates is a GET a prefetcher will eventually fire on its own.
 */
export function AccountMenu({
  name,
  email,
  avatarUrl,
  signOut,
}: {
  name: string;
  email: string | null;
  avatarUrl: string | null;
  signOut: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  /*
    Close when the route changes. The header lives in the layout and survives
    navigation, so the menu would otherwise stay open on top of the page the
    reader just asked for.

    Adjusted during render rather than in an effect. An effect that calls
    setState synchronously causes a second render pass for something already
    knowable from the props of this one, and React's own guidance — and this
    project's lint rule — say to derive it instead. Comparing against the
    pathname the menu was opened at also handles back and forward, which an
    onClick on each link would not.
  */
  const [openedAt, setOpenedAt] = useState(pathname);
  if (open && openedAt !== pathname) {
    setOpen(false);
    setOpenedAt(pathname);
  }

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      trigger.current?.focus();
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panel.current?.contains(t) || trigger.current?.contains(t)) return;
      setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const item =
    "flex min-h-[44px] w-full items-center gap-2.5 rounded-[var(--radius-control)] px-2.5 text-left no-underline transition-colors";

  return (
    <div className="relative">
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        /* The name, not "Your account": two people called Sam are told apart by
           the address, and this control is where somebody checks which account
           they are signed in to. */
        aria-label={`Account menu for ${email ?? name}`}
        /*
          THE HOVER RING HAD NO OFFSET AND NO OFFSET COLOUR.

          `ring-2 ring-line-strong` painted a 2px band flush against the
          portrait's own `border-line`, so hovering produced a second edge
          touching the first — a muddy double outline hugging a 34px circle,
          which is what Roan photographed and called wrong. It read as a
          rendering artefact rather than as a state, because two adjacent
          hairlines in two near-identical greys is what an artefact looks like.

          The offset is what makes it a halo instead: 2px of the bar's own
          surface between the portrait and the ring, so the two edges are
          separated and the ring reads as something drawn deliberately around
          the picture. `ring-offset-color` has to be named — Tailwind's default
          is white, which is wrong on the dark theme and wrong on the tinted
          bar, and it is the reason an offset was not simply added before.

          The accent, at 30%, rather than `line-strong`: hover is an invitation,
          and every other invitation in this chrome is the accent.
        */
        className="flex items-center rounded-full outline-none ring-offset-2 ring-offset-[color:var(--surface)] transition-shadow hover:ring-2 hover:ring-accent/30 focus-visible:ring-2 focus-visible:ring-[color:var(--focus)]"
      >
        <Avatar name={name} email={email} url={avatarUrl} size={34} />
      </button>

      {open ? (
        <div
          ref={panel}
          id={menuId}
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[248px] rounded-[var(--radius-card)] border border-line bg-surface p-1.5 shadow-e2"
        >
          <div className="border-b border-line px-2.5 pb-2.5 pt-1.5">
            <p className="t-body-sm truncate text-ink">{name}</p>
            {email ? <p className="t-meta truncate text-ink-muted">{email}</p> : null}
          </div>

          <div className="pt-1.5">
            {/* One item, not two. The first draft had "Your details" and
                "Photo and password" both pointing at /account, which is a menu
                asking the reader to choose between two doors into one room. */}
            <Link
              href="/account"
              role="menuitem"
              className={cn(item, "t-body-sm text-ink-secondary hover:bg-surface-subtle hover:text-ink")}
            >
              <UserCircleIcon size={17} aria-hidden="true" />
              Your account
            </Link>

            {/* The same exit the bar carries, for the widths where the bar
                cannot. Under md the header drops it for room, and this menu is
                the one control that is present at every width. */}
            <Link
              href="/"
              role="menuitem"
              className={cn(item, "t-body-sm text-ink-secondary hover:bg-surface-subtle hover:text-ink md:hidden")}
            >
              <ArrowSquareOutIcon size={17} aria-hidden="true" />
              Visit website
            </Link>

            <form action={signOut} className="mt-1 border-t border-line pt-1.5">
              <button
                type="submit"
                role="menuitem"
                className={cn(item, "t-body-sm text-ink-secondary hover:bg-surface-subtle hover:text-ink")}
              >
                <SignOutIcon size={17} aria-hidden="true" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
