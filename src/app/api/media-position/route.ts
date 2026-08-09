import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth";

/**
 * Where a listener is in an episode.
 *
 * ------------------------------------------------ why a route handler, not an action
 *
 * Every Server Action in this app ends in `revalidatePath`, and the ones that do
 * not still trigger a router refresh. Either would re-render the lesson page and
 * remount the `<audio>` element — so a fifteen-second autosave would restart the
 * episode four times a minute, which is the exact bug the autosave exists to
 * prevent the reverse of.
 *
 * A route handler writes and returns 204. Nothing re-renders. It goes through
 * the same request-scoped client as everything else, so `positions_own` is still
 * the boundary and this handler does not need to be trusted — a forged
 * `blockId` writes a row the forger already owns.
 *
 * `furthest` is clamped monotonically here rather than in a trigger, because it
 * is one `Math.max` against a row this request already has to read.
 */

export async function GET(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return new NextResponse(null, { status: 204 });

  const blockId = new URL(request.url).searchParams.get("blockId");
  if (!blockId) return NextResponse.json({ error: "blockId required" }, { status: 400 });

  const supabase = await createClient();
  const { data } = await supabase
    .from("media_positions")
    .select("seconds, furthest, duration")
    .eq("user_id", viewer.id)
    .eq("block_id", blockId)
    .maybeSingle();

  return NextResponse.json(data ?? { seconds: 0, furthest: 0, duration: null });
}

export async function POST(request: Request) {
  const viewer = await getViewer();
  /* 204 rather than 401. A signed-out reader listening to module 1 is a
     supported case, and the player should not log an error for doing exactly
     what it is allowed to do — there is simply nowhere to store their position. */
  if (!viewer) return new NextResponse(null, { status: 204 });

  let body: { blockId?: string; seconds?: number; duration?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "expected JSON" }, { status: 400 });
  }

  const blockId = body.blockId;
  const seconds = Math.max(0, Math.floor(Number(body.seconds ?? 0)));
  const duration = Number(body.duration ?? 0);

  if (!blockId || !Number.isFinite(seconds)) {
    return NextResponse.json({ error: "blockId and seconds required" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("media_positions")
    .select("furthest")
    .eq("user_id", viewer.id)
    .eq("block_id", blockId)
    .maybeSingle();

  const { error } = await supabase.from("media_positions").upsert(
    {
      user_id: viewer.id,
      block_id: blockId,
      seconds,
      furthest: Math.max(existing?.furthest ?? 0, seconds),
      duration: duration > 0 ? Math.floor(duration) : null,
      /* "Finished" is 95%, not 100%: nobody listens through the outro, and a
         bookmark that never reaches the end never clears itself from a
         continue-listening list. */
      finished_at: duration > 0 && seconds >= duration * 0.95 ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,block_id" },
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return new NextResponse(null, { status: 204 });
}
