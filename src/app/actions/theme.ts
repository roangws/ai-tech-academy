"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { THEME_COOKIE, isTheme, type Theme } from "@/lib/theme";

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Remember which theme this reader wants.
 *
 * A server action rather than a client-side cookie write, so the control works
 * with JavaScript off — it is a `<form action={setTheme}>` and a `<button>`
 * carrying its value. The client component around it also flips the attribute
 * locally for instant feedback, but that is an enhancement rather than the
 * mechanism.
 *
 * `revalidatePath("/", "layout")` rather than a narrower path because the theme
 * lives on the app group's layout element and every route under it has to
 * re-render to pick up the change. This is the one place a layout-wide
 * revalidation is the correct scope rather than a lazy one.
 *
 * No `redirect`. The reader stays exactly where they are, which for a theme
 * toggle is the entire expected behaviour.
 */
export async function setTheme(formData: FormData) {
  const requested = String(formData.get("theme") ?? "");
  const theme: Theme = isTheme(requested) ? requested : "system";

  const store = await cookies();
  store.set(THEME_COOKIE, theme, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
    /* Readable by the toggle so it can write the same value optimistically. */
    httpOnly: false,
  });

  revalidatePath("/", "layout");
}
