import { cookies } from "next/headers";

/**
 * Which theme the signed-in app renders in.
 *
 * ------------------------------------------------------ why a cookie, not localStorage
 *
 * A cookie is readable on the server, so the layout can emit the right
 * `data-theme` in the first byte of HTML. `localStorage` is only readable after
 * hydration, and that gap is exactly the white flash every hand-rolled dark mode
 * ships with. The usual workaround is a blocking inline script in <head>, which
 * this avoids entirely.
 *
 * Not `HttpOnly`: the toggle writes it optimistically on the client too, so the
 * attribute flips instantly rather than after a server round trip.
 *
 * ------------------------------------------------------------------ "system"
 *
 * Stored as a third value rather than resolved to light or dark at write time.
 * The server cannot know an OS preference, and a reader who chose "system" and
 * then changed their OS at sunset expects the app to follow. `data-theme
 * ="system"` is emitted verbatim and a `prefers-color-scheme` media query in
 * globals.css resolves it in pure CSS, so this costs no JavaScript and still has
 * no flash.
 */

export const THEME_COOKIE = "theme";

export type Theme = "light" | "dark" | "system";

const THEMES: readonly Theme[] = ["light", "dark", "system"];

export function isTheme(value: string | undefined): value is Theme {
  return THEMES.includes(value as Theme);
}

/**
 * The theme for this request.
 *
 * Defaults to "system", which is the honest default: it is what somebody who has
 * never touched the control has actually expressed a preference for, via their
 * operating system.
 */
export async function getTheme(): Promise<Theme> {
  const store = await cookies();
  const value = store.get(THEME_COOKIE)?.value;
  return isTheme(value) ? value : "system";
}
