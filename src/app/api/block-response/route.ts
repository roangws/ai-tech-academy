import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth";

/**
 * A learner's saved answers for one exercise or checklist block.
 *
 * Read-only. Writing goes through the `saveBlockResponse` server action, because
 * unlike a playback position it is a deliberate act by the learner and there is
 * nothing on the page to remount.
 *
 * The shape is whatever the block put in `body`: `{ text }` for an exercise,
 * `{ ticked }` for a checklist. Both are returned flat so the component reads
 * the key it cares about and ignores the rest.
 */
export async function GET(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return new NextResponse(null, { status: 204 });

  const blockId = new URL(request.url).searchParams.get("blockId");
  if (!blockId) return NextResponse.json({ error: "blockId required" }, { status: 400 });

  const supabase = await createClient();
  const { data } = await supabase
    .from("block_responses")
    .select("body, status")
    .eq("user_id", viewer.id)
    .eq("block_id", blockId)
    .maybeSingle();

  return NextResponse.json({ ...(data?.body ?? {}), status: data?.status ?? "draft" });
}
