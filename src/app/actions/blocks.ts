"use server";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Save what a learner wrote into an exercise, or ticked in a checklist.
 *
 * `user_id` comes from the session and never from the form, which is the rule
 * every write in this app follows — a hidden field naming the owner is a hidden
 * field somebody edits.
 *
 * ------------------------------------------------------- no revalidatePath
 *
 * Deliberate, and the opposite of what the other actions here do. Nothing
 * server-rendered depends on this value: the block loads its own state through
 * /api/block-response and holds it in React from then on. Revalidating would
 * re-render the lesson page on every autosave, remounting any audio element on
 * it — silencing an episode because somebody typed a sentence.
 *
 * ------------------------------------------------------------------ merged, not replaced
 *
 * The two block kinds write different keys into the same `body` column, so this
 * merges rather than overwrites. A checklist tick must not wipe the exercise
 * text on the same lesson if the two ever share a row by mistake, and merging
 * costs one read this write was going to need anyway.
 */
export async function saveBlockResponse(formData: FormData) {
  const viewer = await requireUser();

  const blockId = String(formData.get("blockId") ?? "");
  if (!blockId) throw new Error("saveBlockResponse: blockId is required");

  const patch: Record<string, unknown> = {};

  const text = formData.get("text");
  if (typeof text === "string") {
    /* Matches the 40k cap the prose payload carries. A textarea with no ceiling
       is a row somebody pastes a novel into. */
    patch.text = text.slice(0, 40_000);
  }

  const ticked = formData.get("ticked");
  if (typeof ticked === "string") {
    try {
      const parsed: unknown = JSON.parse(ticked);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        patch.ticked = parsed;
      }
    } catch {
      throw new Error("saveBlockResponse: ticked must be a JSON object");
    }
  }

  if (Object.keys(patch).length === 0) return;

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("block_responses")
    .select("body")
    .eq("user_id", viewer.id)
    .eq("block_id", blockId)
    .maybeSingle();

  const { error } = await supabase.from("block_responses").upsert(
    {
      user_id: viewer.id,
      block_id: blockId,
      body: { ...(existing?.body ?? {}), ...patch },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,block_id" },
  );

  /* Throw rather than swallow. The component turns this into "Could not save.
     Your text is still here." — which is the one thing a learner needs to know,
     and the failure mode `must()` exists elsewhere in this app to prevent is a
     write that silently did nothing. */
  if (error) throw new Error(`saveBlockResponse: ${error.message}`);
}
