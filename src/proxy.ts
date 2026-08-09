import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { safeNext } from "@/lib/safe-next";

/**
 * Session refresh, and a coarse gate on the signed-in routes.
 *
 * ------------------------------------------------------- proxy, not middleware
 *
 * `middleware.ts` is deprecated in Next 16 and renamed to `proxy.ts`. Same
 * behaviour, same `config` export, different filename and function name — see
 * node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md.
 * It lives in `src/` because `app/` does.
 *
 * ------------------------------------------------------------- what it is for
 *
 * Supabase access tokens expire in an hour. Something has to notice and exchange
 * the refresh token, and that something has to be able to write cookies. A
 * Server Component cannot — its response headers are already committed — so
 * without this file every reader is signed out an hour after signing in, and
 * `createClient()` in supabase/server.ts swallows the failed write.
 *
 * `getClaims()` is the call that performs the refresh. It is not decoration and
 * removing it breaks sessions in a way that takes an hour to reproduce.
 *
 * --------------------------------------------------- what it is NOT for
 *
 * This is not the authorisation boundary. It sees a cookie, not a role: it can
 * tell that somebody is signed in, and nothing else. Every real decision is made
 * twice below it — by `requireRole` in the route's own layout, and by row-level
 * security in Postgres, which is the only one of the three that a forged request
 * cannot route around.
 *
 * What it buys is that a signed-out reader gets a redirect to sign-in rather
 * than a rendered dashboard with empty queries in it.
 *
 * --------------------------------------------------------- the cookie dance
 *
 * `supabaseResponse` has to be built from the request and returned intact.
 * Returning a `NextResponse.next()` created elsewhere, or reconstructing one
 * after the client has written to it, drops the refreshed cookies and logs the
 * reader out on the next request — the failure mode is a session that survives
 * exactly one page load.
 *
 * The redirect path is the exception, and it copies the cookies across
 * explicitly for the same reason.
 */

/*
  Prefixes that require a session.

  `/learn` is deliberately NOT among them. Module 1 of every course is open with
  no account — it is the site's central promise, made on the homepage, the
  catalog, the enrol rail and the auth panel — and a prefix match here would
  redirect an anonymous reader away from the one thing they were told they could
  have. The gate is per-module instead, in lms/access.ts, which is the only place
  that can tell module 01 from module 04.
*/
/* `/apply` belongs here and `/instructors` does not get caught by `/instructor`:
   the test below is an exact match or a `/`-terminated prefix, so the public
   roster is unaffected by the console route next to it. */
const PROTECTED = ["/dashboard", "/instructor", "/judge", "/admin", "/apply"];

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  /*
    NO CREDENTIALS, NO PROXY — and this is not defensive padding, it is a fix for
    an outage this file caused.

    The first version read `process.env.NEXT_PUBLIC_SUPABASE_URL!`. The `!` is a
    TypeScript assertion and nothing more: at runtime the value was `undefined`,
    `createServerClient` threw on it, and because the matcher below covers
    essentially every path, the throw became a 500 on EVERY PAGE. The marketing
    site — statically generated, needing no database at all — went down because a
    backend variable was missing in the deploy environment. Confirmed in
    production: `/`, `/courses` and `/sign-up` all returned 500 while
    `/robots.txt`, the one route the matcher excludes, returned 200.

    So the failure mode is inverted. Without credentials this returns the plain
    response: the public site serves exactly as it did before the LMS existed,
    and only the signed-in routes are affected — they redirect to /sign-in, which
    is the honest answer when there is no auth backend to ask.

    A hard failure here can only ever be worse than a degraded one, because
    nothing on the public site needs this to run.
  */
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    const { pathname } = request.nextUrl;
    if (PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      return NextResponse.redirect(new URL("/sign-in", request.nextUrl.origin));
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        /*
          `headers` is the second argument and dropping it is a real hazard, not
          a tidiness point. @supabase/ssr passes `Cache-Control: private,
          no-cache, no-store, must-revalidate, max-age=0` plus `Expires: 0` and
          `Pragma: no-cache` whenever it writes auth cookies, for one reason: a
          response carrying a Set-Cookie for a session token must never be cached
          by a CDN or a reverse proxy, because the next reader through that cache
          is handed somebody else's session.
        */
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          Object.entries(headers ?? {}).forEach(([k, v]) => supabaseResponse.headers.set(k, v));
        },
      },
    },
  );

  /* The refresh. Everything below only reads the result. */
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);

  const { pathname } = request.nextUrl;
  const needsSession = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (needsSession && !signedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    /* Where they were going, so signing in can finish the journey rather than
       dropping them on a dashboard they did not ask for. The query string is
       carried too — without it, /judge/review?filter=open came back as bare
       /judge/review. Read back by the sign-in action, which re-validates it. */
    const target = `${pathname}${request.nextUrl.search}`;
    url.search = "";
    url.searchParams.set("next", target);
    const redirect = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  /*
    Nobody signed in needs to see the sign-in screen.

    GET only. A Server Action is a POST to the route it was invoked from, so
    without this guard a reader who signed in in a second tab and then submitted
    the form in the first got a 307 — which preserves the method — and their
    Next-Action POST was replayed against /dashboard.

    `next` is honoured here too, and goes through the same parse-based check the
    auth actions use rather than the string test that let `/\evil.example`
    through: assigning to `url.pathname` happened to normalise that one safely,
    but relying on a setter's side effect for a security property is how it
    stops being true.
  */
  if (signedIn && request.method === "GET" && (pathname === "/sign-in" || pathname === "/sign-up")) {
    /* safeNext returns path + query + hash, so it is resolved as a whole
       against the origin rather than assigned to `pathname` — which would have
       swallowed a query string into the path. */
    const next = safeNext(request.nextUrl.searchParams.get("next"));
    const redirect = NextResponse.redirect(new URL(next, request.nextUrl.origin));
    supabaseResponse.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  return supabaseResponse;
}

export const config = {
  /*
    Everything except static assets and image files.

    Without a matcher this runs on `_next/static`, `_next/image` and every file
    in `public/`, which means a Supabase round trip before each of the ~40 images
    on the homepage. The negative lookahead is the pattern the Next docs give for
    exactly this.
  */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|brand|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|mp4|webm|txt|xml)$).*)",
  ],
};
