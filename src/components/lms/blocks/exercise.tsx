"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CopyIcon, CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { Prose } from "@/components/lms/prose";
import { saveBlockResponse } from "@/app/actions/blocks";

/**
 * A guided exercise: a prompt to run, and a scratchpad for what came back.
 *
 * The prompt is copyable because the point is to paste it into whatever tool the
 * learner actually uses, and the scratchpad persists because the whole
 * pedagogical claim of this course is that you did it on your own work — an
 * answer that evaporates on navigation is an answer nobody wrote.
 *
 * ------------------------------------------------------------------ autosave
 *
 * Saves 1.2 seconds after typing stops, and again on unmount. The alternative is
 * a Save button, which is the design that loses work: people close tabs.
 *
 * The status line is present in the DOM from first paint with `aria-live`, not
 * created when it fills — a live region that appears at the moment it has
 * something to say is not reliably announced. The whole app was missing this;
 * `grep aria-live src/` returned nothing before this pass.
 */
export function ExerciseBlock({
  blockId,
  title,
  prompt,
  placeholder,
}: {
  blockId: string;
  title: string | null;
  prompt: string;
  placeholder?: string;
}) {
  const uid = useId();
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");
  const [copied, setCopied] = useState(false);
  const loaded = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    fetch(`/api/block-response?blockId=${encodeURIComponent(blockId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (typeof d?.text === "string") setText(d.text);
        loaded.current = true;
      })
      .catch(() => {
        loaded.current = true;
      });
  }, [blockId]);

  const save = async (value: string) => {
    setStatus("Saving");
    const form = new FormData();
    form.set("blockId", blockId);
    form.set("text", value);
    try {
      await saveBlockResponse(form);
      setStatus("Saved to your account");
    } catch {
      setStatus("Could not save. Your text is still here.");
    }
  };

  const onChange = (value: string) => {
    setText(value);
    if (!loaded.current) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void save(value), 1200);
  };

  return (
    <section className="rounded-[var(--radius-feature)] border border-line bg-surface-subtle p-5">
      <h2 className="t-h3 text-ink">{title ?? "Try it"}</h2>

      <div className="relative mt-3 rounded-[var(--radius-card)] border border-line bg-surface p-4">
        <Prose body={prompt} />
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(prompt).then(() => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 2000);
            });
          }}
          className="t-meta absolute right-3 top-3 inline-flex min-h-[32px] items-center gap-1.5 rounded-full border border-line-control bg-surface px-3 text-ink-secondary transition-colors hover:border-accent hover:text-accent"
        >
          {copied ? (
            <CheckIcon size={13} weight="bold" aria-hidden="true" />
          ) : (
            <CopyIcon size={13} aria-hidden="true" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <label htmlFor={`${uid}-answer`} className="t-field mt-5 block text-ink-secondary">
        What came back, and what you would change
      </label>
      <textarea
        id={`${uid}-answer`}
        value={text}
        onChange={(e) => onChange(e.currentTarget.value)}
        onBlur={() => loaded.current && void save(text)}
        rows={6}
        placeholder={placeholder ?? "Paste the output, then note what you would change."}
        className="t-body mt-1.5 w-full rounded-[var(--radius-card)] border border-line-control bg-surface p-3.5 text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/25"
      />
      <p role="status" aria-live="polite" className="t-meta mt-2 min-h-[18px] text-ink-muted">
        {status}
      </p>
    </section>
  );
}
