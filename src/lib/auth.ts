import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole, Profile } from "@/lib/supabase/types";

/**
 * Who is asking, and what they are allowed to be asking for.
 *
 * ------------------------------------------------------- one lookup per request
 *
 * `getViewer` is wrapped in React's `cache`, so a request that renders a layout,
 * a page and three server components makes one round trip rather than five. The
 * cache is per-request and per-render, not global — there is no window in which
 * one reader's identity can be served to another.
 *
 * -------------------------------------------------------------- getClaims
 *
 * `getClaims()` rather than `getSession()`. `getSession()` reads the cookie and
 * believes it, which on a server is reading a value the client sent and calling
 * it authentication. `getClaims()` verifies the token's signature. The
 * difference is the whole security model of every page below it.
 *
 * ------------------------------------------------------- roles are not claims
 *
 * Roles are read from `user_roles` on every request, not lifted from the JWT.
 * A claim is fixed until the token refreshes, so revoking somebody's judge role
 * would leave up to an hour of access standing after the revocation. A table
 * read costs a query and takes effect immediately, and the query is on a primary
 * key.
 *
 * ------------------------------------------------------ these are not the fence
 *
 * `requireRole` is a good error message, not a security boundary. The boundary
 * is row-level security in Postgres: a reader who defeats this guard and reaches
 * the page still cannot read a row the policies do not allow, because the
 * policies are evaluated by the database against their own token.
 *
 * Guarding here as well means an unauthorised reader gets a redirect instead of
 * a rendered console full of empty tables, which is a different thing worth
 * having.
 */

export type Viewer = {
  id: string;
  email: string | null;
  roles: AppRole[];
  profile: Profile | null;
  is: (role: AppRole) => boolean;
  name: string;
};

export const getViewer = cache(async (): Promise<Viewer | null> => {
  /*
    No credentials configured means nobody is signed in, rather than a crash.

    `AppHeader` calls this, and the header is in the `(app)` layout — so without
    this guard a deploy missing the Supabase variables threw inside the layout of
    every LMS route, before any page-level error boundary could catch it. See the
    same guard, and the outage that motivated both, in proxy.ts.

    Returning null degrades honestly: the header renders its signed-out controls.
    A page that genuinely needs data still fails, in its own error boundary,
    which is where a missing backend should surface.
  */
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return null;
  }

  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims?.sub) return null;

  const [{ data: roleRows }, { data: profile }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", claims.sub),
    supabase.from("profiles").select("*").eq("id", claims.sub).maybeSingle(),
  ]);

  const roles = (roleRows ?? []).map((r) => r.role as AppRole);
  const email = (claims.email as string | undefined) ?? profile?.email ?? null;

  /* First name if there is one, then the local part of the email, then a word
     rather than an empty string. The header renders this, and "Hi, " reads as a
     bug even when nothing is wrong. */
  const name =
    profile?.first_name?.trim() ||
    email?.split("@")[0] ||
    "there";

  return {
    id: claims.sub,
    email,
    roles,
    profile: (profile as Profile | null) ?? null,
    is: (role) => roles.includes(role),
    name,
  };
});

/** Redirects to sign-in, preserving where they were going. */
export async function requireUser(next?: string): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) {
    redirect(next ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in");
  }
  return viewer;
}

/**
 * Redirects to the dashboard if signed in without the role, to sign-in if not
 * signed in at all. The two are deliberately different: one is "you are not
 * allowed here" and the other is "we do not know who you are yet", and sending
 * the second to a dashboard they cannot see would be a loop.
 *
 * Admins pass every check. There is no separate admin console, and an admin
 * locked out of the instructor view they are meant to be administering has to
 * grant themselves a role to do their job, which makes the roles meaningless.
 */
export async function requireRole(role: AppRole, next?: string): Promise<Viewer> {
  const viewer = await requireUser(next);
  if (!viewer.is(role) && !viewer.is("admin")) redirect("/dashboard");
  return viewer;
}
