"use client";

import { useState } from "react";
import { ArrowSquareOutIcon, CursorClickIcon } from "@phosphor-icons/react/dist/ssr";

/**
 * A third-party interactive tool, behind a click.
 *
 * Same facade reasoning as the video block, for the same two costs: an embed at
 * rest is a third party executing script in our page and setting cookies for a
 * reader who has not asked for it, and it is often a megabyte before it draws
 * anything. So it loads on the click that means "use this".
 *
 * ------------------------------------------------------- the origin allowlist
 *
 * Not enforced here. It lives in two places that are both harder to get wrong
 * than a component: a CHECK constraint on `lesson_blocks.payload` so a bad
 * origin cannot be stored, and `frame-src` in the CSP so a bad origin cannot be
 * loaded even if it somehow were. Those two are one fact stated twice and have
 * to be edited together — the constraint's comment says so, and so does
 * next.config.ts.
 *
 * `sandbox` is deliberately narrow. `allow-same-origin` is present because
 * without it these tools cannot reach their own storage or API and simply fail;
 * `allow-top-navigation` is absent so an embed cannot navigate the learner away
 * from the lesson.
 */
export function EmbedBlock({
  src,
  height = 480,
  title,
}: {
  src: string;
  height?: number;
  title: string;
}) {
  const [live, setLive] = useState(false);
  const host = (() => {
    try {
      return new URL(src).host;
    } catch {
      return src;
    }
  })();

  if (live) {
    return (
      <figure>
        <iframe
          src={src}
          title={title}
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          referrerPolicy="strict-origin-when-cross-origin"
          style={{ height }}
          className="w-full rounded-[var(--radius-feature)] border border-line bg-surface"
        />
        <figcaption className="t-meta mt-2 flex items-center gap-1.5 text-ink-muted">
          <ArrowSquareOutIcon size={12} aria-hidden="true" />
          {title} — loaded from {host}
        </figcaption>
      </figure>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setLive(true)}
      style={{ minHeight: Math.min(height, 260) }}
      className="flex w-full flex-col items-center justify-center gap-2 rounded-[var(--radius-feature)] border border-dashed border-line-control bg-surface-subtle p-8 text-center transition-colors hover:border-accent"
    >
      <CursorClickIcon size={24} className="text-ink-muted" aria-hidden="true" />
      <span className="t-card-title text-ink">{title}</span>
      <span className="t-meta text-ink-muted">
        Loads from {host} when you press it. Nothing is contacted until then.
      </span>
    </button>
  );
}
