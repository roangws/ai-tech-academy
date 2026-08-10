import { createClient } from "@/lib/supabase/server";
import type { JudgeEvent, JudgeEventInvitation, Profile } from "@/lib/supabase/types";

/**
 * Every read the judging-events feature does.
 *
 * Apart from `queries.ts` because it is a different subject with a different
 * audience: the judge console and the events desk in the back office, neither of
 * which touches a lesson, a module or an outcome sheet. That file is 900 lines
 * of the learning record; this is 200 of a calendar.
 *
 * -------------------------------------------------------------- no RLS bypass
 *
 * Same rule as `queries.ts`: every read goes through the request-scoped client,
 * so if a row comes back the policies allowed it. `listEventsForAdmin` has no
 * admin check in it because `judge_events_admin_all` already is one.
 *
 * ------------------------------------------------- but the policy is not the view
 *
 * `listInvitations` and `openInvitationCount` DO name the reader, and the reason
 * is worth writing down because the first version of this file did not and it
 * was wrong.
 *
 * Two permissive policies select from `judge_event_invitations`: your own row,
 * and every row if you are an administrator. Permissive policies OR together, so
 * for anyone holding both roles — which is every account on this site today —
 * "what the policy returns" is every judge's invitation to every event. QA
 * caught it immediately: the judge console rendered the same hackathon three
 * times, once per judge notified.
 *
 * So the filter here is not a duplicate of the policy and cannot drift from it.
 * The policy answers "may this row be read"; this answers "is this row mine",
 * which is a different question that RLS was never asked.
 */

/* Errors throw, for the reason `queries.ts` explains at length: a dropped error
   is a page that renders "no events" as a fact when the read failed. */
type Result = { data: unknown; error: { message: string } | null };

async function rows<T>(label: string, query: PromiseLike<Result>): Promise<T[]> {
  const { data, error } = await query;
  if (error) throw new Error(`${label}: ${error.message}`);
  return (data ?? []) as T[];
}

/* --------------------------------------------------------------- the judge */

export type InvitationWithEvent = JudgeEventInvitation & { event: JudgeEvent };

/**
 * Every event this judge has been notified about, split at the present moment.
 *
 * The split happens here rather than on the page, and that is not tidiness:
 * `react-hooks/purity` refuses `Date.now()` inside a component, correctly —
 * a render that reads the clock is a render that can disagree with itself. This
 * function is a server read, not a component, so the clock belongs in it.
 *
 * Ordered by when the event happens rather than when it was issued, because a
 * judge reading this is answering "what am I being asked to turn up to", and the
 * order of that question is the calendar's.
 */
export type Invitations = {
  /** Still ahead, and still open. The ones with an answer to give. */
  upcoming: InvitationWithEvent[];
  /** Over, or closed by the organiser. Read-only history. */
  past: InvitationWithEvent[];
};

export async function listInvitations(judgeId: string): Promise<Invitations> {
  const supabase = await createClient();

  const invitations = await rows<JudgeEventInvitation & { judge_events: JudgeEvent | null }>(
    "judging invitations",
    /* `eq("judge_id")` is load-bearing, not belt and braces — an administrator
       can read every judge's row, so without it this console shows one card per
       judge notified. The note at the head of the file has the story.

       No `order` on the query. PostgREST's `referencedTable` order sorts rows
       WITHIN a to-many embed, and this is a to-one — it would be accepted and do
       nothing. The sort is below, after the null embeds are dropped. */
    supabase.from("judge_event_invitations").select("*, judge_events(*)").eq("judge_id", judgeId),
  );

  /*
    The embed can be null and the filter is not paranoia: `judge_events_read_as_judge`
    only returns rows with `status <> 'draft'`, so an event moved back to a draft
    keeps its invitation rows and hands this query an invitation attached to
    nothing. Rendering that would be a card with no title and no date.
  */
  const all = invitations
    .filter((row): row is JudgeEventInvitation & { judge_events: JudgeEvent } =>
      Boolean(row.judge_events),
    )
    .map(({ judge_events, ...invitation }) => ({ ...invitation, event: judge_events }))
    .sort((a, b) => a.event.starts_at.localeCompare(b.event.starts_at));

  const now = Date.now();
  /* Over means the end has passed, or the start has if there is no end — a
     one-line detail that decides whether a judge is still asked to answer. */
  const isAhead = (i: InvitationWithEvent) =>
    new Date(i.event.ends_at ?? i.event.starts_at).getTime() >= now;

  return {
    upcoming: all.filter((i) => i.event.status === "issued" && isAhead(i)),
    past: all.filter((i) => i.event.status !== "issued" || !isAhead(i)).reverse(),
  };
}

/**
 * How many of this judge's invitations are waiting on an answer.
 *
 * This is the notification badge, and what it counts is deliberate: not "unread"
 * — nothing here tracks whether a page was looked at — but unanswered, on an
 * event that has not been closed. A badge that clears when you glance at it
 * tells you nothing; this one clears when you have actually replied, which is
 * the thing the person issuing the event is waiting for.
 *
 * `eq("judge_id")` for the same reason `listInvitations` has one: an admin may
 * read every row, so without it the badge counts the whole board's silence.
 */
export async function openInvitationCount(judgeId: string): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("judge_event_invitations")
    .select("id, judge_events!inner(status)", { count: "exact", head: true })
    .eq("judge_id", judgeId)
    .is("response", null)
    .eq("judge_events.status", "issued");

  if (error) throw new Error(`open invitations: ${error.message}`);
  return count ?? 0;
}

/* --------------------------------------------------------------- the admin */

export type EventResponse = {
  judge: Pick<Profile, "id" | "first_name" | "last_name" | "email"> | null;
  response: JudgeEventInvitation["response"];
  note: string | null;
  notified_at: string;
  responded_at: string | null;
};

export type EventForAdmin = JudgeEvent & {
  notified: number;
  available: number;
  unavailable: number;
  waiting: number;
  responses: EventResponse[];
};

/**
 * The events desk: every event, with who was told and what they said.
 *
 * Two queries rather than an embed with a profile join, for the same reason
 * `getSubmittedWork` splits: `judge_event_invitations.judge_id` points at
 * `auth.users`, which is not in the exposed schema, so PostgREST has no foreign
 * key to embed `profiles` through.
 */
export async function listEventsForAdmin(): Promise<EventForAdmin[]> {
  const supabase = await createClient();

  const [events, invitations] = await Promise.all([
    rows<JudgeEvent>(
      "events",
      supabase.from("judge_events").select("*").order("starts_at", { ascending: false }),
    ),
    rows<JudgeEventInvitation>(
      "event invitations",
      supabase.from("judge_event_invitations").select("*").order("notified_at"),
    ),
  ]);

  const judgeIds = [...new Set(invitations.map((i) => i.judge_id))];
  const profiles = judgeIds.length
    ? await rows<Pick<Profile, "id" | "first_name" | "last_name" | "email">>(
        "judge profiles",
        supabase.from("profiles").select("id, first_name, last_name, email").in("id", judgeIds),
      )
    : [];

  const byId = new Map(profiles.map((p) => [p.id, p]));
  const byEvent = new Map<string, JudgeEventInvitation[]>();
  for (const invitation of invitations) {
    const list = byEvent.get(invitation.event_id);
    if (list) list.push(invitation);
    else byEvent.set(invitation.event_id, [invitation]);
  }

  return events.map((event) => {
    const mine = byEvent.get(event.id) ?? [];
    return {
      ...event,
      notified: mine.length,
      available: mine.filter((i) => i.response === "available").length,
      unavailable: mine.filter((i) => i.response === "unavailable").length,
      waiting: mine.filter((i) => i.response === null).length,
      responses: mine.map((i) => ({
        judge: byId.get(i.judge_id) ?? null,
        response: i.response,
        note: i.note,
        notified_at: i.notified_at,
        responded_at: i.responded_at,
      })),
    };
  });
}

/** How many people would be notified if an event were issued right now. */
export async function countJudges(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("user_roles")
    .select("user_id", { count: "exact", head: true })
    .eq("role", "judge");

  if (error) throw new Error(`judge count: ${error.message}`);
  return count ?? 0;
}
