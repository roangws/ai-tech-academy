"use client";
import { useState } from "react";
import { CopyIcon, CheckIcon } from "@phosphor-icons/react";

export function CookbookPrompt({ prompt }: { prompt: string }) {
  const [status, setStatus] = useState("");
  async function copy() {
    try { await navigator.clipboard.writeText(prompt); setStatus("Prompt copied. Replace the capitalized fields before you send it."); }
    catch { setStatus("Select the prompt below and copy it manually."); }
  }
  return <div className="mt-5 overflow-hidden rounded-xl border border-line bg-surface">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2">
      <h5 className="t-body-sm font-medium text-ink">Your starter prompt</h5>
      <button type="button" onClick={copy} className="t-meta inline-flex min-h-11 items-center gap-2 text-accent hover:underline">
        {status.startsWith("Prompt copied") ? <CheckIcon size={16} aria-hidden="true" /> : <CopyIcon size={16} aria-hidden="true" />}Copy prompt
      </button>
    </div>
    <pre className="whitespace-pre-wrap break-words p-4 text-sm leading-7 text-ink-secondary"><code>{prompt}</code></pre>
    {status && <p role="status" className="t-meta px-4 pb-4 text-ink-secondary">{status}</p>}
  </div>;
}
