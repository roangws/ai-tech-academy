"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { wallClockToInstant, isEventZone } from "@/lib/lms/time";
import type { FormState } from "@/lib/form-state";
import type { JudgeEventFormat } from "@/lib/supabase/types";

/**
 * Writing, issuing and answering a judging opportunity.
 *
 * ------------------------------------------------- the guard is in every function
 *
 * `/admin/layout.tsx` does not run for a Server Action invoked from a page under
 * it — an action is a POST endpoint with a generated name, reachable by anyone
 * who can read the page's HTML — so each of these checks for itself, the same
 * discipline `actions/admin.ts` follows.
 *
 * Postgres is still the boundary. `judge_events_admin_all`, the
 * `judge_event_invitations_own_answer` policy and the guard trigger are what
 * actually decide; `requireRole` here is a redirect and a good error message.
 *
 * ------------------------------------------------------- issuing is not an update
 *
 * `issueEvent` calls an RPC rather than setting `status = 'issued'`, because
 * issuing is two writes that must not come apart: the event's status, and one
 * invitation row per judge. An event marked issued with nobody notified is the
 * exact failure this feature exists to prevent, and it would be invisible —
 * the console would say "issued" and no judge would have heard anything.
 */

const FORMATS: readonly JudgeEventFormat[] = ["online", "in_person", "hybrid"];

function text(formData: FormData, name: string, max = 4_000): string | null {
  const value = String(formData.get(name) ?? "").trim();
  return value ? value.slice(0, max) : null;
}

/**
 * Write an event, or revise one.
 *
 * It lands as a draft. Nothing is sent to anybody until it is issued, which is a
 * separate press with a separate button — an admin half way through typing a
 * date should not have already notified the board.
 */
export async function saveEvent(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireRole("admin", "/admin/events");

  const id = text(formData, "id");
  const title = text(formData, "title", 200);
  const timezone = text(formData, "timezone", 64) ?? "America/Los_Angeles";
  const format = String(formData.get("format") ?? "online") as JudgeEventFormat;

  if (!title) return { error: "An event needs a title." };
  if (!FORMATS.includes(format)) return { error: `Unknown format "${format}".` };
  /* Checked against the list the form offers, rather than passed through to
     `Intl.DateTimeFormat`. An unrecognised zone reaches this function only from a
     hand-rolled POST, and the failure it produces is a `RangeError` in the error
     boundary with every field lost — an answer on the form is the right shape for
     something the caller can correct. It also keeps the column to values
     `instantToWallClock` can round-trip on the edit form. */
  if (!isEventZone(timezone)) return { error: `Unknown time zone "${timezone}".` };

  const starts_at = wallClockToInstant(String(formData.get("starts_at") ?? ""), timezone);
  if (!starts_at) return { error: "An event needs a start date and time." };

  const ends_at = wallClockToInstant(String(formData.get("ends_at") ?? ""), timezone);
  const respond_by = wallClockToInstant(String(formData.get("respond_by") ?? ""), timezone);

  /* The database has the same constraint. This one exists so the answer arrives
     on the form with every field still filled in, rather than in the error
     boundary with all of it lost. */
  if (ends_at && ends_at < starts_at) return { error: "The end is before the start." };

  const neededRaw = text(formData, "judges_needed", 8);
  const judges_needed = neededRaw ? Number(neededRaw) : null;
  if (judges_needed !== null && (!Number.isInteger(judges_needed) || judges_needed < 1)) {
    return { error: "How many judges are needed has to be a whole number, or blank." };
  }

  const row = {
    title,
    host: text(formData, "host", 200),
    summary: text(formData, "summary", 1_000),
    brief: text(formData, "brief", 10_000),
    location: text(formData, "location", 200),
    format,
    timezone,
    starts_at,
    ends_at,
    respond_by,
    judges_needed,
  };

  const supabase = await createClient();

  if (id) {
    const { error } = await supabase.from("judge_events").update(row).eq("id", id);
    if (error) throw new Error(`saveEvent: ${error.message}`);
    revalidatePath("/admin/events");
    revalidatePath("/judge");
    return { ok: "Saved." };
  }

  /* `created_by` is written from the session rather than from the form, for the
     same reason `feedback_by` is set in a trigger: a field the client sends is a
     field the client chooses. */
  const { error } = await supabase.from("judge_events").insert({ ...row, created_by: viewer.id });
  if (error) throw new Error(`saveEvent: ${error.message}`);

  revalidatePath("/admin/events");
  return { ok: "Saved as a draft. Issue it when it is ready." };
}

/**
 * Issue it, and notify every judge.
 *
 * Re-issuable on purpose. Pressing it again after somebody new is appointed
 * notifies exactly the people who were not told the first time, and tells the
 * console how many that was — `issue_judge_event` returns the count, so "issued"
 * never has to be a claim nobody checked.
 */
export async function issueEvent(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin", "/admin/events");
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "No event to issue." };

  /*
    Reopening is the same act, said out loud.

    Both paths fan out, which is the entire reason issuing is an RPC: a closed
    event that is reopened has to notify anybody appointed while it was shut, and
    a plain `status = 'issued'` UPDATE would not. Review found the other half of
    this — the issue form used to render on closed cards too, so "Notify anyone
    new" silently reopened them. `issue_judge_event` refuses that outright now
    unless `p_reopen` says it was asked for.
  */
  const reopen = Boolean(formData.get("reopen"));

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("issue_judge_event", {
    p_event_id: id,
    p_reopen: reopen,
  });
  if (error) throw new Error(`issueEvent: ${error.message}`);

  revalidatePath("/admin/events");
  revalidatePath("/judge");

  const notified = Number(data ?? 0);
  const verb = reopen ? "Reopened" : "Issued";
  return {
    ok: notified
      ? `${verb}. ${notified} judge${notified === 1 ? "" : "s"} notified.`
      : `${verb}. Everybody holding the judge role had already been notified.`,
  };
}

/**
 * Close it.
 *
 * Only closing. It used to take a status and write it, which meant it could also
 * reopen — and reopening without a fan-out is the split `issue_judge_event`
 * exists to prevent, because a judge appointed while the event was shut would
 * never hear about it. Reopening goes through `issueEvent` with `reopen` set.
 *
 * Closing does not delete the invitations. A judge who said they were available
 * for something that has been and gone should still be able to see that they
 * did, and the answers are the only record of who agreed to what.
 */
export async function closeEvent(formData: FormData): Promise<void> {
  await requireRole("admin", "/admin/events");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  /* `eq("status", "issued")` so this cannot reach a draft — the constraint
     `judge_events_issued_has_a_time` would refuse that with a 500, and an action
     that relies on a constraint to catch a state it should not have reached is
     an action missing a check. */
  const { error } = await supabase
    .from("judge_events")
    .update({ status: "closed" })
    .eq("id", id)
    .eq("status", "issued");
  if (error) throw new Error(`closeEvent: ${error.message}`);

  revalidatePath("/admin/events");
  revalidatePath("/judge");
}

/**
 * Delete a draft nobody has been told about. The invitations cascade.
 *
 * `eq("status", "draft")` is the enforcement, not the button. The card renders
 * this control only for drafts and a comment beside it explains why deleting an
 * issued event would be wrong — deleting it takes every answer with it — and
 * until review pointed it out, neither of those was true of the action itself,
 * which took an id and deleted whatever it named.
 */
export async function deleteEvent(formData: FormData): Promise<void> {
  await requireRole("admin", "/admin/events");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("judge_events")
    .delete()
    .eq("id", id)
    .eq("status", "draft");
  if (error) throw new Error(`deleteEvent: ${error.message}`);

  revalidatePath("/admin/events");
  revalidatePath("/judge");
}

/* --------------------------------------------------------------- the judge */

/**
 * Answer an invitation.
 *
 * The row is addressed by `event_id` and `auth.uid()` rather than by an
 * invitation id from the form. An id in a hidden field is a row identifier the
 * client chooses, and the only thing standing between that and answering on
 * somebody else's behalf would be the policy — which does hold, but a write that
 * cannot name another person's row is better than one that can and is refused.
 *
 * `responded_at` is not sent. The guard trigger sets it from the clock, for the
 * same reason `artifacts_guard` pins `feedback_at`.
 */
export async function respondToEvent(formData: FormData): Promise<void> {
  const viewer = await requireRole("judge", "/judge");

  const eventId = String(formData.get("eventId") ?? "");
  const response = String(formData.get("response") ?? "");
  if (!eventId) return;
  if (response !== "available" && response !== "unavailable") {
    throw new Error(`unknown response "${response}"`);
  }

  const note = String(formData.get("note") ?? "").trim().slice(0, 2_000) || null;

  const supabase = await createClient();
  /*
    WHEN an answer may be written is decided by the guard trigger, not here.

    Review found that nothing at any layer looked at the event's state: the
    update policy is `judge_id = auth.uid()` and nothing more, so a judge with a
    tab left open — or a PATCH sent straight at PostgREST with their own token —
    could flip "unavailable" to "available" on a panel that had already happened,
    and the trigger would stamp a fresh `responded_at` on the rewrite. The whole
    reason an invitation is a row is that it records what somebody said and when;
    that record has to be closed to the person it describes.

    So `judge_event_invitations_guard` now refuses a changed answer once the
    event is closed or its end has passed, and this is the good error message
    rather than the boundary. `select()` is here so a refusal is not silent: a
    write that matches no row comes back `error: null`, which would render as a
    successful answer that changed nothing.
  */
  const { data, error } = await supabase
    .from("judge_event_invitations")
    .update({ response, note })
    .eq("event_id", eventId)
    .eq("judge_id", viewer.id)
    .select("id");
  if (error) throw new Error(`respondToEvent: ${error.message}`);
  if (!data?.length) {
    throw new Error(
      "respondToEvent: no invitation for this judge on this event, or it is no longer open",
    );
  }

  revalidatePath("/judge");
}
