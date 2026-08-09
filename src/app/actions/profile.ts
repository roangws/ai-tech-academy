"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

export type ProfileState = { error?: string; ok?: string } | null;

const MAX_BYTES = 2 * 1024 * 1024;
const TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

/**
 * Upload a portrait, and update the name alongside it.
 *
 * -------------------------------------------------------------- where it goes
 *
 * `avatars/<user id>/<timestamp>.<ext>`, and the folder name is the access
 * control: the storage policy requires the first path segment to equal
 * `auth.uid()`, so this cannot write into anyone else's folder even if the path
 * were built from user input. It is not — the id comes from the session.
 *
 * The timestamp in the filename is a cache-buster. Overwriting a fixed
 * `avatar.png` would leave the old image on every CDN edge and in every open
 * tab, so a reader who uploads a new portrait would keep seeing the old one and
 * conclude it had not worked. A new key each time makes the URL change with the
 * image, and the previous object is deleted immediately after.
 *
 * ------------------------------------------------------------ checked twice
 *
 * Size and mime are checked here AND on the bucket. The bucket is the one that
 * counts — a direct upload to the storage API never runs this function — but
 * failing here first turns "413 from an API you have never heard of" into a
 * sentence about the file being too big.
 */
export async function updateProfile(_prev: ProfileState, form: FormData): Promise<ProfileState> {
  const viewer = await requireUser("/account");
  const supabase = await createClient();

  const firstName = ((form.get("first_name") as string | null) ?? "").trim().slice(0, 80);
  const lastName = ((form.get("last_name") as string | null) ?? "").trim().slice(0, 80);
  const company = ((form.get("company") as string | null) ?? "").trim().slice(0, 120);

  if (!firstName) return { error: "Your first name, so we know what to call you." };

  const patch: Record<string, string | null> = {
    first_name: firstName,
    last_name: lastName || null,
    company: company || null,
  };

  const file = form.get("avatar");
  const hasFile = file instanceof File && file.size > 0;

  if (hasFile) {
    if (file.size > MAX_BYTES) {
      return { error: "That image is over 2MB. Try a smaller one." };
    }
    if (!TYPES.has(file.type)) {
      return { error: "Images only: PNG, JPEG, WebP or GIF." };
    }

    const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "png";
    const key = `${viewer.id}/${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(key, file, { contentType: file.type, upsert: false });
    if (upErr) return { error: `Upload failed: ${upErr.message}` };

    const { data } = supabase.storage.from("avatars").getPublicUrl(key);
    patch.avatar_url = data.publicUrl;

    /* Remove whatever they had before, so a bucket does not accumulate every
       portrait a person has ever set. Best-effort: a failure here leaves an
       orphaned object, which is untidy and not worth failing the save over. */
    const { data: existing } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", viewer.id)
      .maybeSingle();
    const old = (existing?.avatar_url as string | null) ?? null;
    if (old) {
      const marker = "/avatars/";
      const at = old.indexOf(marker);
      if (at !== -1) await supabase.storage.from("avatars").remove([old.slice(at + marker.length)]);
    }
  }

  const { error } = await supabase.from("profiles").update(patch).eq("id", viewer.id);
  if (error) return { error: error.message };

  /*
    ONE PATH, not the whole tree.

    This was `revalidatePath("/", "layout")`, and it is why saving a photo failed.
    That invalidates every route in the application from the root down —
    including the five marketing pages and every course page — as part of a
    Server Action running in a serverless function. The upload and the profile
    write both completed every time; the RESPONSE never made it back, the POST
    came back as ERR_ABORTED, and the reader got the error boundary telling them
    the page broke while their photo sat safely in the bucket.

    It was also unnecessary. Every route under `(app)` and `(learn)` is
    `force-dynamic` — they re-render on every request by definition, so there is
    no cache holding a stale avatar for them to invalidate. Only this page needs
    the fresh row for the redirect-free `useActionState` render it is about to do.
  */
  revalidatePath("/account");
  return { ok: hasFile ? "Photo updated." : "Saved." };
}
