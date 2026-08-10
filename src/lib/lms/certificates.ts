import { cache } from "react";

import { anonClient } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";
import type { VerifiedCompletion } from "@/lib/supabase/types";

/**
 * Reading completion records, from the two directions they are read from.
 *
 * -------------------------------------------------------------- two readers
 *
 * A completion record has two audiences and they are allowed to know different
 * amounts. The holder sees their own row through `completion_read_own` and gets
 * the ordinary request-scoped client. A stranger holding a printed reference has
 * no row-level access at all and goes through `verify_completion`, which is a
 * SECURITY DEFINER function returning seven fields chosen one at a time.
 *
 * That asymmetry is the whole design and the migration argues it at length: an
 * anon SELECT policy on `completion_records` would expose `user_id` and turn a
 * public identifier into a way of asking "who has completed what". A function
 * that takes a reference and cannot be asked for a list answers the only
 * question a verifier actually has.
 *
 * `verifyCompletion` uses the anonymous key on purpose rather than the caller's
 * session. The verification page and the certificate image are the same bytes
 * for every reader, and reading them as the caller would touch `cookies()` and
 * make both uncacheable — the argument catalog.ts makes for `anonClient`.
 */

/** One record, by the reference printed on it. Works signed out. */
export const verifyCompletion = cache(async function verifyCompletion(
  reference: string,
): Promise<VerifiedCompletion | null> {
  /* References are uppercase, hyphenated and fixed-format. Normalising here
     means somebody who typed theirs in lowercase off a printout still lands on
     their certificate rather than on the not-found state. */
  const normalised = reference.trim().toUpperCase();
  if (!/^AITE-[A-Z0-9]+-\d{4}-[A-Z0-9]{6}$/.test(normalised)) return null;

  const { data, error } = await anonClient().rpc("verify_completion", {
    p_reference: normalised,
  });

  if (error) throw new Error(`verify_completion: ${error.message}`);
  const rows = (data ?? []) as VerifiedCompletion[];
  return rows[0] ?? null;
});

export type MyCertificate = {
  reference: string;
  issued_at: string;
  course_id: string;
  course_slug: string;
  course_title: string;
  course_badge: string;
  course_ground: string | null;
};

/**
 * Every certificate the signed-in caller holds, newest first.
 *
 * One embed rather than two queries: `completion_read_own` restricts the rows and
 * the join rides along on the same round trip, which is the round-trip budget the
 * rest of this directory keeps.
 */
export async function listMyCertificates(): Promise<MyCertificate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("completion_records")
    .select("reference, issued_at, course_id, courses!inner(slug, title, badge, ground)")
    .order("issued_at", { ascending: false });

  if (error) throw new Error(`certificates: ${error.message}`);

  type Row = {
    reference: string;
    issued_at: string;
    course_id: string;
    courses: { slug: string; title: string; badge: string; ground: string | null };
  };

  return ((data ?? []) as unknown as Row[]).map((r) => ({
    reference: r.reference,
    issued_at: r.issued_at,
    course_id: r.course_id,
    course_slug: r.courses.slug,
    course_title: r.courses.title,
    course_badge: r.courses.badge,
    course_ground: r.courses.ground,
  }));
}

/** The caller's certificate for one course, or null if they have not earned it. */
export async function getMyCertificate(courseId: string): Promise<MyCertificate | null> {
  return (await listMyCertificates()).find((c) => c.course_id === courseId) ?? null;
}

/* ------------------------------------------------------------------- colour

   `courses.ground` holds a CSS custom property reference — the literal string
   "var(--path-a)" — because every other consumer of it is a stylesheet. The
   certificate is rendered by satori, which resolves no custom properties and has
   no stylesheet to resolve them against, so the five values are restated here as
   the hex they carry in :root.

   Restated rather than parsed out of globals.css: a build step that reads CSS to
   find a colour is a build step that breaks silently when the variable is
   renamed. This throws the fallback instead, which is visible. */
const GROUND_HEX: Record<string, string> = {
  "--path-a": "#0a5c7a",
  "--path-b": "#46305f",
  "--path-c": "#1f5540",
  "--path-d": "#1b3f6b",
  "--path-e": "#6d3c22",
};

/** The hex behind `courses.ground`, or ink for anything unrecognised. */
export function groundHex(ground: string | null | undefined): string {
  const name = ground?.match(/--path-[a-e]/)?.[0];
  return (name && GROUND_HEX[name]) || "#101820";
}

/**
 * Where a certificate is shown, downloaded and checked.
 *
 * Keyed by reference at every one of them, including the learner's own page. The
 * reference is the document's identity: it is what is printed on it, what a
 * verifier types in, and what the image and the PDF are addressed by. Keying the
 * page by course slug instead would have given the same document two names, and
 * the one on the paper is the one that has to work.
 */
export const certificatePaths = {
  page: (reference: string) => `/certificate/${reference}`,
  image: (reference: string) => `/certificate/${reference}/image`,
  download: (reference: string) => `/certificate/${reference}/image?download=1`,
  pdf: (reference: string) => `/certificate/${reference}/pdf`,
  verify: (reference: string) => `/verify/${reference}`,
} as const;

/** The date as it is printed on the certificate and beside it. */
export function issuedOn(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
