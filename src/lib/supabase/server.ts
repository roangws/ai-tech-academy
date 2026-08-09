import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * The Supabase client for server components, server actions and route handlers.
 *
 * ------------------------------------------------------------- why a factory
 *
 * A new client per request, never a module-level singleton. The client holds the
 * caller's session, and on a server that handles many requests at once a shared
 * instance is one reader's cookies answering another reader's query. It is the
 * single worst bug available in this file, and it is only avoidable by never
 * creating something that could be reused.
 *
 * `cookies()` is awaited because it is async in Next 16.
 *
 * ---------------------------------------------------- why setAll can throw
 *
 * Supabase writes cookies when it refreshes an expired access token, and that
 * can happen inside a Server Component render — where cookies are read-only,
 * because the response headers are already on their way. Next throws there, and
 * the throw is caught and dropped.
 *
 * That is safe here and nowhere else: proxy.ts runs before every request that
 * matters and refreshes the session where cookies *are* writable, so the write
 * this catch discards is one that already happened a moment earlier. Without the
 * proxy, swallowing this would silently sign readers out an hour after they
 * signed in.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        /*
          `headers` is accepted and deliberately not applied here.

          @supabase/ssr hands `setAll` a set of no-store cache headers alongside
          the cookies, because a response carrying a session token must never be
          cached by a CDN. The proxy does apply them — it holds a NextResponse.
          This context does not: `cookies()` can write cookies during a Server
          Action, but there is no response object to set a header on, and
          `cookieStore.set(name, value)` would write a COOKIE called
          "Cache-Control", which is not the same thing and would be shipped to
          the browser.

          It is covered anyway. Every route that renders session state is
          force-dynamic or cookie-dynamic and so is already uncacheable, and the
          proxy runs ahead of all of them with the headers attached.
        */
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* Called from a Server Component. See the note above. */
          }
        },
      },
    },
  );
}
