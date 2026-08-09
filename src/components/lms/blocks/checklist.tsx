"use client";

import { useEffect, useRef, useState } from "react";
import { saveBlockResponse } from "@/app/actions/blocks";
import { cn } from "@/lib/utils";

/**
 * A checklist the learner works through, whose state persists.
 *
 * The lab and template lesson kinds have always described work done outside the
 * site — "open the tool you actually use", "fill in only the rows you have
 * evidence for" — and the site kept no record that any of it happened. This is
 * that record, and it is per-step rather than one done flag because "three of
 * seven" is the useful state to come back to.
 *
 * Real `<input type="checkbox">` elements, not styled divs with `role`. They
 * already announce their own state, take Space, and work in a form with no
 * JavaScript; a hand-built substitute has to reimplement each of those and gets
 * one of them wrong.
 *
 * Saves on change rather than on a debounce: a tick is a discrete decision, and
 * there are only ever a handful of them.
 */
export function ChecklistBlock({
  blockId,
  title,
  steps,
}: {
  blockId: string;
  title: string | null;
  steps: readonly { id: string; text: string }[];
}) {
  const [ticked, setTicked] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState("");
  const loaded = useRef(false);

  useEffect(() => {
    fetch(`/api/block-response?blockId=${encodeURIComponent(blockId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.ticked && typeof d.ticked === "object") setTicked(d.ticked);
        loaded.current = true;
      })
      .catch(() => {
        loaded.current = true;
      });
  }, [blockId]);

  const toggle = async (id: string, next: boolean) => {
    const updated = { ...ticked, [id]: next };
    setTicked(updated);
    if (!loaded.current) return;

    setStatus("Saving");
    const form = new FormData();
    form.set("blockId", blockId);
    form.set("ticked", JSON.stringify(updated));
    try {
      await saveBlockResponse(form);
      setStatus("Saved to your account");
    } catch {
      setStatus("Could not save that tick.");
    }
  };

  const done = steps.filter((s) => ticked[s.id]).length;

  return (
    <section className="rounded-[var(--radius-feature)] border border-line bg-surface-subtle p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="t-h3 text-ink">{title ?? "Work through this"}</h2>
        <span className="t-meta tabular-nums text-ink-muted">
          {done} of {steps.length}
        </span>
      </div>

      <ul className="mt-4 flex flex-col gap-1">
        {steps.map((step) => {
          const on = Boolean(ticked[step.id]);
          return (
            <li key={step.id}>
              <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-[var(--radius-control)] px-2 transition-colors hover:bg-surface">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) => void toggle(step.id, e.currentTarget.checked)}
                  className="size-4 flex-none rounded accent-[var(--accent)]"
                />
                <span
                  className={cn(
                    "t-body-sm",
                    /* Struck through AND dimmed would make finished steps hard
                       to re-read, and re-reading what you already did is most of
                       what a checklist is for the second time you open it. */
                    on ? "text-ink-muted line-through" : "text-ink",
                  )}
                >
                  {step.text}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <p role="status" aria-live="polite" className="t-meta mt-3 min-h-[18px] text-ink-muted">
        {status}
      </p>
    </section>
  );
}
