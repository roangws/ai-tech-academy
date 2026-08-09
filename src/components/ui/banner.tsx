"use client";

import { type HTMLAttributes, useCallback, useSyncExternalStore } from "react";
import { XIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

/**
 * A dismissible strip across the top of a surface.
 *
 * ------------------------------------------------- adapted, not copied
 *
 * The version this came from is a shadcn component. It imports shadcn's
 * `buttonVariants`, uses `lucide-react`, styles itself with `bg-secondary` and
 * `text-muted-foreground`, and needs keyframes in a `tailwind.config.js`. This
 * repo has none of those: the primitives here are hand-written, the icon family
 * is Phosphor, the tokens are `--surface-subtle` and `--ink`, and Tailwind v4 is
 * CSS-first with no config file at all.
 *
 * Installing shadcn to take the component verbatim would put two design systems
 * in one repo — two button primitives, two icon families, two colour
 * vocabularies — and the first person to add a button would have to guess which
 * one. So the behaviour is kept and the surface is rebuilt on what is already
 * here. Nothing new was installed.
 *
 * ------------------------------------------------------- what was dropped
 *
 * The rainbow variant. It is two animated multiply/dodge gradient layers, and
 * this site's spec allows exactly one accent with green reserved for a single
 * meaning. A moving six-colour wash would be the loudest thing on any page it
 * appeared on, and it would be louder than the one control the page exists to
 * get pressed. `tone` carries the useful part of that idea instead: a banner can
 * be quiet or it can be the accent, and that is the whole range this palette has.
 *
 * ------------------------------------------------ what was kept, and fixed
 *
 * Dismissal survives a reload, per `id`, in localStorage. The original reached
 * for a `dangerouslySetInnerHTML` script and two `<style>` blocks to hide the
 * banner before paint, which solves a real problem: a dismissed banner otherwise
 * flashes on every load. `useSyncExternalStore` solves the same problem with no
 * inline script, because it has a server snapshot — see the hook below.
 *
 * `height` is still a prop and still published as `--banner-height`, so a sticky
 * header underneath can offset itself without measuring.
 */

interface BannerProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Remembered dismissal is keyed on this. Without an `id` the banner has no
   * close button at all, because there would be nowhere to record the answer and
   * a close button that forgets is worse than none.
   */
  id?: string;
  /** @defaultValue 'quiet' */
  tone?: "quiet" | "accent";
  /** @defaultValue '3rem' */
  height?: string;
  message?: string;
}

/**
 * Whether this banner is still open, read from localStorage.
 *
 * `useSyncExternalStore` rather than `useState` plus an effect. localStorage is
 * an external store — that is the whole category this hook exists for — and the
 * effect version has two real problems beyond the lint rule that flagged it: it
 * renders once with the wrong answer and then corrects, which is the flash, and
 * it does not notice the same key changing in another tab.
 *
 * The server snapshot is `false`, so the markup Next sends contains no banner at
 * all and a reader who dismissed it last week never sees it reappear for a
 * frame. React then re-renders with the client snapshot during hydration, which
 * is exactly the handoff this hook is designed to make safe. It is also why the
 * original needed a `dangerouslySetInnerHTML` script in the head, and why this
 * one does not.
 */
function useDismissal(key: string | undefined): boolean {
  return useSyncExternalStore(
    useCallback(
      (onChange: () => void) => {
        if (!key) return () => {};
        const onStorage = (e: StorageEvent) => {
          if (e.key === key || e.key === null) onChange();
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
      },
      [key],
    ),
    () => (key ? window.localStorage.getItem(key) !== "true" : true),
    /* Server and first hydration pass. See the note above. */
    () => !key,
  );
}

export function Banner({
  id,
  tone = "quiet",
  height = "3rem",
  message,
  children,
  className,
  ...props
}: BannerProps) {
  const key = id ? `banner-${id}` : undefined;

  const open = useDismissal(key);

  const dismiss = useCallback(() => {
    if (!key) return;
    window.localStorage.setItem(key, "true");
    /* Same-tab notification. The `storage` event only fires in OTHER tabs, so
       without this the banner would stay on screen in the tab that closed it. */
    window.dispatchEvent(new StorageEvent("storage", { key }));
  }, [key]);

  if (!open) return null;

  return (
    <div
      id={id}
      role="status"
      style={{ height, ["--banner-height" as string]: height }}
      className={cn(
        /* NOT sticky by default. The first version was `sticky top-0 z-50`, which on
           the admin overview floated it over the 72px site header (z-40) and covered
           the wordmark and the nav. A banner rendered inside a page body belongs in
           the flow of that page; only a banner mounted in a layout, above the
           header, has any business being sticky. */
        "relative flex items-center justify-center gap-3 px-12 text-center",
        tone === "accent"
          ? "bg-accent text-on-accent"
          : "border-b border-line bg-surface-subtle text-ink-secondary",
        className,
      )}
      {...props}
    >
      <p className="t-body-sm truncate">{message ?? children}</p>

      {id ? (
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss this message"
          className={cn(
            "absolute right-2 grid size-9 place-items-center rounded-full transition-colors",
            tone === "accent"
              ? "text-on-accent/70 hover:bg-black/10 hover:text-on-accent"
              : "text-ink-muted hover:bg-surface hover:text-ink",
          )}
        >
          <XIcon size={15} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
