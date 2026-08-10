"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole, requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/form-state";

/**
 * Earning, issuing and revoking a completion record.
 *
 * ---------------------------------------------------------- the rules are in Postgres
 *
 * Every function here is a thin call onto an RPC that already existed and was
 * read by nothing. That is deliberate and it is the whole reason these are four
 * lines each: `claim_completion` and `issue_completion` enforce who may do what
 * and when, inside one transaction, and re-checking any of it here would create
 * a second copy of the rule that can disagree with the first.
 *
 * What that buys, concretely:
 *
 *   - `claim_completion` takes the learner from `auth.uid()`, so there is no
 *     user id in this file to get wrong and no hidden field an attacker can
 *     edit. It refuses unless every lesson is complete.
 *   - `issue_completion` checks `is_admin()` itself. `requireRole` below is the
 *     good error message, not the boundary.
 *   - Both mint the reference through `mint_completion_reference`, so a record
 *     issued by an admin and one claimed by a learner cannot have different
 *     formats.
 *   - Both mark the enrolment `completed` in the same transaction, so a record
 *     can never exist against an enrolment that still reads "active".
 */

/** Every surface that prints a record or a count of them. */
function revalidateCertifications() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/certifications");
  revalidatePath("/admin/certifications");
  revalidatePath("/admin/learners");
}

/* ------------------------------------------------------------------ learner */

/**
 * A learner claims the record for a course they have finished.
 *
 * ------------------------------------------------------- it ends on the document
 *
 * Success REDIRECTS to the certificate rather than returning `{ ok }`, and that
 * is a fix rather than a flourish. Returning a message did not work: this action
 * revalidates the page it was called from, the claimable row moves into the
 * earned list, and the `ActionForm` holding the message is unmounted by that
 * re-render — so the learner pressed the button, it vanished, and nothing
 * anywhere said what had happened.
 *
 * That is precisely the failure `lesson-advance.tsx` documents at length and
 * fixed twice. The lesson learned there applies exactly: the acknowledgement
 * belongs on the destination. And here the destination is not a consolation —
 * it is the thing they pressed the button for, and Roan's own third step:
 * "3. Show the certification."
 *
 * The interesting failure case is the refusal. `claim_completion` raises with
 * `errcode = 'check_violation'` when lessons remain, which arrives as PostgREST
 * code `23514` — that is a learner pressing a button slightly too early, not a
 * fault, so it is an answer with the real number in it rather than an error
 * page. Everything else is genuinely unexpected and keeps its message.
 */
export async function claimCompletion(_prev: FormState, formData: FormData): Promise<FormState> {
  const courseId = String(formData.get("courseId") ?? "");
  if (!courseId) return { error: "Missing the course." };

  await requireUserId("/dashboard/certifications");
  const supabase = await createClient();

  /* The reference the RPC returns is deliberately discarded: the redirect below
     lands on the page that reads it out of the row, so carrying it through a
     query string would be a second copy that could disagree. */
  const { error } = await supabase.rpc("claim_completion", { p_course_id: courseId });

  if (error) {
    if (error.code === "23514") {
      /* The function's message is "completed 34 of 39 lessons", which is the one
         fact the learner needs and is already phrased for a person. */
      return { error: `Not yet — you have ${error.message}. Finish them and this unlocks.` };
    }
    return { error: error.message };
  }

  revalidateCertifications();

  /* `redirect` throws to unwind, so it must be outside the try/catch above and
     after the revalidation — and nothing may follow it. */
  redirect(`/dashboard/certifications/${courseId}?earned=1`);
}

/* -------------------------------------------------------------------- admin */

/**
 * An admin issues a record on somebody's behalf.
 *
 * `force` is the whole reason this exists alongside the learner path. A record
 * is normally earned by finishing every lesson, and there are real cases where
 * that check is the wrong answer — somebody who did the work before the course
 * was in this system, or a course whose lessons were restructured underneath a
 * learner. Making that an explicit, separately-labelled act keeps the default
 * honest: without the tick, this refuses exactly as the learner's own path does.
 */
export async function issueCompletion(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin", "/admin/certifications");

  const userId = String(formData.get("userId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const force = formData.get("force") === "on";

  if (!userId) return { error: "Pick who this is for." };
  if (!courseId) return { error: "Pick a course." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("issue_completion", {
    p_user_id: userId,
    p_course_id: courseId,
    p_force: force,
  });

  if (error) {
    /* The function's own refusal already names the shortfall and says what to
       do — "learner has completed 12 of 39 lessons; pass p_force to issue
       anyway" — so it is rewritten for the person reading this screen rather
       than passed through with an RPC parameter name in it. */
    if (/completed \d+ of \d+/.test(error.message)) {
      const counted = error.message.match(/completed (\d+) of (\d+)/);
      return {
        error: `They have finished ${counted?.[1]} of ${counted?.[2]} lessons. Tick "Issue anyway" if you mean to override that.`,
      };
    }
    return { error: error.message };
  }

  revalidateCertifications();
  return { ok: `Issued. Reference ${String(data)}.` };
}

/**
 * Take a record back.
 *
 * A plain delete rather than an RPC, because there is no rule to enforce beyond
 * "an admin may" and `completion_admin_write` already says that.
 *
 * The enrolment is deliberately NOT reset to `active`. Its `completed_at` is a
 * record of when the work was finished, which revoking a certificate does not
 * un-happen — and the learner's `lesson_progress` is untouched either way, so
 * they can claim again the moment they are eligible. Revoking is about the
 * document, not about the history.
 */
export async function revokeCompletion(formData: FormData): Promise<void> {
  await requireRole("admin", "/admin/certifications");

  const id = String(formData.get("recordId") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase.from("completion_records").delete().eq("id", id);
  if (error) throw new Error(`revoke completion: ${error.message}`);

  revalidateCertifications();
}
