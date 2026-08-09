/**
 * Where a redirect is allowed to send somebody.
 *
 * ------------------------------------------------------------------ the bug
 *
 * The first version of this lived in the auth actions and was a string test:
 * accept one leading slash, reject two. A backslash walked straight through it.
 * `/\evil.example` starts with a single `/` and is not `//`, so it passed — and
 * then the WHATWG URL parser resolved it, where for a special scheme `/\` means
 * exactly what `//` means. It became `https://evil.example`, and Next's client
 * router recognised the cross-origin result and did a full navigation to it.
 * `/%09/evil.example` did the same by a different route: tab, newline and
 * carriage return are stripped before resolution, leaving `//evil.example`.
 *
 * The reader signs in on the genuine domain and is handed to somebody else's.
 * That is a better phish than a plain fake login page, because the first hop is
 * real.
 *
 * ----------------------------------------------------------------- the rule
 *
 * Do not pattern-match the string; resolve it and check where it landed. Every
 * escape — by scheme, by `//`, by `/\`, by a character the parser deletes — has
 * to change the origin, so one comparison covers the ones we thought of and the
 * ones we did not. Only `pathname`, `search` and `hash` are returned, so the
 * result cannot carry an origin even in principle.
 *
 * Shared by the auth actions, the proxy and the email confirmation handler, in
 * its own module with no `"use server"` and no imports, so the proxy does not
 * pull Server Action machinery into its bundle to get at it.
 */

/* Any absolute base works. It is never part of the return value. */
const BASE = "https://next.invalid";

export function safeNext(value: unknown, fallback = "/dashboard"): string {
  const raw = typeof value === "string" ? value : "";
  if (!raw) return fallback;

  let parsed: URL;
  try {
    parsed = new URL(raw, BASE);
  } catch {
    return fallback;
  }

  if (parsed.origin !== BASE) return fallback;
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}
