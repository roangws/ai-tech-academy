"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";

/**
 * Sign up, sign in, sign out.
 *
 * ------------------------------------------------------------- what changed
 *
 * Both forms already existed, fully built and fully accessible, with submit
 * handlers that called `preventDefault()` and rendered "this form is not live".
 * Nothing about their markup, their validation or their focus management has
 * been touched. The only change is that `onSubmit` became `useActionState`
 * pointed at these functions.
 *
 * -------------------------------------------------------- validation, again
 *
 * The client already checks four non-empty fields, an `@`, and eight characters.
 * These functions check the same things again, because the client checks are a
 * courtesy to somebody typing and these are the ones that count: a Server Action
 * is a public endpoint, and anything that only the browser enforces is not
 * enforced.
 *
 * The messages are deliberately the same strings the client uses, so a reader
 * who trips the server copy does not get a second, differently-worded complaint
 * about the same field.
 *
 * -------------------------------------------------- what is NOT checked here
 *
 * Nothing about roles. A new account gets `student` from the handle_new_user
 * trigger on auth.users, inside the same transaction as the account itself, so
 * there is no window where a user exists without a profile and no path — OAuth,
 * dashboard, seed script — that can create one without going through it. Doing
 * it here would only cover this one route.
 *
 * ------------------------------------------------------------- open redirect
 *
 * `next` arrives from a query string, which means it arrives from anywhere. It
 * goes through `safeNext` in lib/safe-next.ts, which resolves it and checks the
 * origin rather than pattern-matching the string — see that file for the
 * backslash bypass that motivated it.
 */

export type AuthState = {
  error?: string;
  field?: string;
  /** Set when the account exists but needs a confirmation email clicked. */
  checkInbox?: string;
} | null;

const str = (form: FormData, name: string) => (form.get(name) as string | null)?.trim() ?? "";

/* The same test the sign-up form uses. Deliberately not an RFC pattern: anything
   stricter rejects addresses that are valid, and the only check that proves an
   address works is sending to it. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signUp(_prev: AuthState, form: FormData): Promise<AuthState> {
  const email = str(form, "email");
  const password = (form.get("password") as string | null) ?? "";
  const firstName = str(form, "first-name");
  const lastName = str(form, "last-name");

  if (!firstName) return { error: "Your first name, so we know what to call you.", field: "first-name" };
  if (!lastName) return { error: "Your last name.", field: "last-name" };
  if (!email) return { error: "An email address, so you can sign back in.", field: "email" };
  if (!EMAIL.test(email)) return { error: "That does not look like an email address.", field: "email" };
  if (password.length < 8) return { error: "Eight characters or more.", field: "password" };

  /* Steps 2 and 3 are optional in full and can be skipped, so every one of these
     is allowed to be empty. "Other" resolves to the free-text field beside it,
     which is where the eleventh role and the eighth source live. */
  const role = str(form, "role") === "Other" ? str(form, "role-other") : str(form, "role");
  const source = str(form, "source") === "Other" ? str(form, "source-other") : str(form, "source");

  const next = safeNext(form.get("next"));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      /* Where the confirmation link comes back to. Required whenever
         confirmations are on, and harmless when they are off. */
      emailRedirectTo: `${await originOf()}/auth/confirm?next=${encodeURIComponent(next)}`,
      /* Read by handle_new_user() out of raw_user_meta_data. Keys are snake_case
         to match the columns they land in.

         Nothing here can influence a role: handle_new_user grants a literal
         'student' and never reads a role out of this object. `role_title` is
         free text a learner typed about their job. */
      data: {
        first_name: firstName,
        last_name: lastName,
        company: str(form, "company"),
        role_title: role,
        source,
      },
    },
  });

  if (error) {
    /* Supabase returns this when the address is taken, and it is one of the few
       cases worth rewording: "User already registered" tells a reader nothing
       about what to do next. */
    if (/already registered/i.test(error.message)) {
      return { error: "There is already an account on that address. Try signing in.", field: "email" };
    }
    return { error: error.message, field: "email" };
  }

  /*
    THE CASE THIS ORIGINALLY GOT WRONG.

    `signUp` returns a live session only when email confirmation is off. This
    project has it ON — `mailer_autoconfirm` is false — so it returns a user and
    `session: null`, and the original code redirected anyway. The reader landed
    on /dashboard, the proxy saw no session and bounced them to /sign-in, and
    nothing anywhere said why. Signing in then failed with GoTrue's raw "Email
    not confirmed". Every account created on this site was in that state.

    So the branch is explicit and works either way: a live session redirects, no
    session renders the inbox screen. The link it sends lands on
    /auth/confirm, which is the other half of this fix — @supabase/ssr forces
    the PKCE flow, so the `?code=` GoTrue sends back has to be exchanged by a
    route handler, and there was not one.

    [FILL: email delivery] — Supabase's built-in sender is rate-limited to a
    handful of messages an hour and is not for production. Real SMTP is needed
    before launch, or confirmations turned off deliberately rather than by
    accident.
  */
  if (!data.session) {
    return { checkInbox: email };
  }

  revalidatePath("/dashboard");
  redirect(next);
}

/**
 * The site's own origin, for the confirmation link.
 *
 * From the request headers rather than a hardcoded constant, so previews and
 * local development send links that come back to themselves. `x-forwarded-host`
 * first, because behind a proxy `host` is the internal address.
 */
async function originOf(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function signIn(_prev: AuthState, form: FormData): Promise<AuthState> {
  const email = str(form, "email");
  const password = (form.get("password") as string | null) ?? "";

  if (!email) return { error: "An email address, so you can sign back in.", field: "email" };
  if (!password) return { error: "A password.", field: "password" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    /*
      One message for a wrong password and one for an address with no account,
      because Supabase gives the same error for both and that is the correct
      behaviour: distinguishing them turns the sign-in form into a tool for
      testing whether somebody has an account here.

      It is attached to `password` rather than `email` so focus lands on the
      field a reader can usefully retype.
    */
    if (/invalid login credentials/i.test(error.message)) {
      return { error: "That email and password do not match an account.", field: "password" };
    }
    /* Distinct from the above on purpose. This one IS actionable — the account
       exists and the password was right, there is just a link to click — and
       telling somebody "wrong password" when it was correct sends them to a
       recovery flow that will not help. */
    if (/email not confirmed/i.test(error.message)) {
      return { checkInbox: email };
    }
    return { error: error.message, field: "password" };
  }

  revalidatePath("/dashboard");
  redirect(safeNext(form.get("next")));
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  /*
    `/dashboard`, not `revalidatePath("/", "layout")`.

    The original call was wrong twice. It claimed to be refreshing the header's
    account menu — but the marketing header is a client component that reads no
    session and renders the signed-out controls unconditionally, so there was
    nothing there to refresh. And "/" with "layout" invalidates the entire route
    tree, which on this site means throwing away the prerendered homepage and
    all five `revalidate = 3600` course pages on every single sign-in, sign-up
    and sign-out. The pages that actually render session state are all
    force-dynamic and were never cached.
  */
  revalidatePath("/dashboard");
  redirect("/");
}
