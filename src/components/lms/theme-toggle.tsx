"use client";

import { useState } from "react";
import { MoonIcon, SunIcon, DesktopIcon } from "@phosphor-icons/react/dist/ssr";
import { setTheme } from "@/app/actions/theme";
import type { Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

/**
 * Light / dark / system, as a three-way segmented control.
 *
 * ------------------------------------------------- why not a two-state switch
 *
 * A moon icon that toggles is the common shape and it cannot express "follow my
 * OS", which is the default and the option most people actually want. Worse, a
 * two-state toggle has to pick a side for a reader who has expressed no
 * preference, and that arbitrary side becomes sticky the first time they press
 * it. Three explicit choices are one extra control and no ambiguity.
 *
 * ------------------------------------------------------------ how it updates
 *
 * `action` on the FORM, and `name`/`value` on each submit button. That is the
 * plain HTML submitter contract, and it is load-bearing: the first version put a
 * client `formAction` on each button instead, and the submitter's name and value
 * never reached the action — so every press wrote the fallback, `system`, and the
 * theme silently refused to persist across a reload while appearing to work.
 * Verified by reading the cookie, not by watching the colours change.
 *
 * So this posts a real form and works with JavaScript off.
 *
 * With JavaScript, `onClick` runs first and does two things. It moves the
 * selected state locally so the control does not sit still for a round trip, and
 * it writes `data-theme` straight onto the shell — because the colours come from
 * CSS keyed on that attribute, and waiting for the server to re-render would
 * make the theme visibly lag the press.
 *
 * Writing the attribute rather than re-rendering the shell is deliberate: it is
 * one line, it cannot drift (the action writes the same value and revalidates),
 * and it makes the change a CSS repaint instead of a React tree swap that would
 * remount anything stateful underneath — including, once it exists, an audio
 * element mid-episode.
 */

const OPTIONS: readonly { value: Theme; label: string; Icon: typeof SunIcon }[] = [
  { value: "light", label: "Light", Icon: SunIcon },
  { value: "dark", label: "Dark", Icon: MoonIcon },
  { value: "system", label: "System", Icon: DesktopIcon },
];

export function ThemeToggle({ theme, className }: { theme: Theme; className?: string }) {
  const [shown, setShown] = useState<Theme>(theme);

  return (
    <form
      action={setTheme}
      role="group"
      aria-label="Colour theme"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-line p-0.5",
        className,
      )}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = shown === value;
        return (
          <button
            key={value}
            type="submit"
            name="theme"
            value={value}
            aria-pressed={active}
            title={label}
            onClick={() => {
              setShown(value);
              document
                .querySelectorAll("[data-theme]")
                .forEach((el) => el.setAttribute("data-theme", value));
            }}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-full transition-colors",
              active
                ? "bg-accent-tint text-accent"
                : "text-ink-muted hover:bg-surface-subtle hover:text-ink",
            )}
          >
            <Icon size={15} weight={active ? "fill" : "regular"} aria-hidden="true" />
            <span className="sr-only">{label}</span>
          </button>
        );
      })}
    </form>
  );
}
