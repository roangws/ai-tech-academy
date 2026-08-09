import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";

/**
 * Where a confirmation email lands.
 *
 * ------------------------------------------------------------- why it exists
 *
 * This project has email confirmation ON, and there was no route handler
 * anywhere in the app. `@supabase/ssr` forces the PKCE flow, so GoTrue sends
 * the reader back with a `?code=` that has to be exchanged for a session by the
 * server. With nothing to exchange it, the link in the email arrived at a page
 * that ignored it: the reader clicked "Confirm", got the homepage, and was
 * still signed out. Combined with a sign-up action that redirected as though it
 * had a session, no account could ever be completed.
 *
 * ---------------------------------------------------------------- two shapes
 *
 * Both are handled, because which one arrives depends on the email template.
 *
 *   ?code=…                     PKCE. The default for @supabase/ssr, exchanged
 *                               with exchangeCodeForSession.
 *   ?token_hash=…&type=signup   The newer template shape, verified with
 *                               verifyOtp. Also what a password-recovery or
 *                               email-change link uses, which is why `type` is
 *                               passed through rather than hardcoded.
 *
 * -------------------------------------------------------------- the redirect
 *
 * `next` is run through the same `safeNext` the auth actions use. It arrives
 * here from a query string on a link in an email — the least trustworthy input
 * on the site — and a redirect handler that echoes it unchecked is an open
 * redirect wearing a confirmation link, which is a considerably better phish
 * than the plain kind.
 *
 * A GET, and that is correct here: this is a link in an email, and the state it
 * changes is one the reader has already been sent a single-use token for.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = safeNext(url.searchParams.get("next"));
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as "signup" | "recovery" | "email_change" | "invite",
      token_hash: tokenHash,
    });
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }

  /*
    Everything else — an expired link, a link already used, a reader who opened
    it in a different browser than the one that started the flow (PKCE keeps its
    verifier in a cookie, so that last one is common and looks like nothing is
    wrong).

    Back to sign-in with a flag rather than a bare 400, because a dead
    confirmation link is not an error the reader made and the useful next step
    is the form they can retry from.
  */
  return NextResponse.redirect(new URL("/sign-in?confirm=failed", url.origin));
}
