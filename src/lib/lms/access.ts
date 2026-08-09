import type { ModuleAccess } from "@/lib/supabase/types";

/**
 * The free-first-module gate.
 *
 * The whole rule, in one place, because it is the one commitment the site
 * repeats on every surface it has:
 *
 *   homepage      "One free account unlocks modules 2 to 8 in every course"
 *   catalog       "What free covers"
 *   enrol rail    "Module 1 opens with no account"
 *   auth panel    the reason to make an account at all
 *   method        step 1 is "Open", steps 2-5 are "Free account"
 *   curriculum    a StatusChip on module 01 and no other
 *
 * Six places in the copy, one function here, and one column in Postgres. If the
 * rule ever changes it changes in `modules.access` and nowhere else.
 *
 * -------------------------------------------------------- why not in the proxy
 *
 * A prefix match on `/learn` cannot tell module 01 from module 04, so putting
 * the gate there would either lock the free module or open the paid ones. The
 * proxy stays coarse and this stays exact.
 *
 * ----------------------------------------------------------- why not in the UI
 *
 * `locked` decides what a page renders, and it is called on the server before
 * the lesson bodies are read. A gate that runs in the browser is a `hidden`
 * attribute somebody can delete, and the content is already in the payload by
 * the time they do.
 */

/**
 * `access` comes from the database, not from a prop. The caller has already
 * loaded the module row; passing the column rather than the module number means
 * this cannot be fooled by a URL that says `01`.
 */
export function isLocked(access: ModuleAccess, signedIn: boolean): boolean {
  return access === "account" && !signedIn;
}

/**
 * The sign-in URL to send a locked reader to, carrying where they were so the
 * journey finishes after they sign up rather than dumping them on a dashboard.
 *
 * `next` is a path, never a full URL: the proxy and the auth actions both refuse
 * anything that does not start with a single `/`, which is what stops this from
 * becoming an open redirect.
 */
export function unlockHref(pathname: string, mode: "sign-up" | "sign-in" = "sign-up"): string {
  return `/${mode}?next=${encodeURIComponent(pathname)}`;
}
