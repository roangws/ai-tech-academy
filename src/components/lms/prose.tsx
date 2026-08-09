import type { ReactNode } from "react";

/**
 * Lesson bodies, rendered.
 *
 * ------------------------------------------------------- why not a library
 *
 * `react-markdown` plus `remark-gfm` is ~60KB for a document format this app
 * fully controls: lesson bodies are written by `scripts/seed-catalog.mjs` and
 * are never user input, so the subset in use is known and small — `##` headings,
 * `-` bullets, `---` rules, `**bold**` and `_italic_`. Supporting exactly that is
 * forty lines and no dependency.
 *
 * ------------------------------------------------------------ why it is safe
 *
 * Nothing here uses `dangerouslySetInnerHTML`. The text is split and returned as
 * React children, so every character is escaped by React on the way out. That
 * matters more than the bundle size: the day a lesson body becomes editable by
 * an instructor, this renderer cannot become an injection vector, because it has
 * no path that turns a string into markup.
 *
 * Anything it does not recognise renders as a paragraph, which is the right
 * failure — an unsupported syntax shows its source rather than disappearing.
 */

/** `**bold**` and `_italic_`, non-greedy, applied in one pass. */
function inline(text: string, keyPrefix: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|_[^_]+_)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(
        <strong key={`${keyPrefix}-b${i}`} className="font-semibold text-ink">
          {token.slice(2, -2)}
        </strong>,
      );
    } else {
      parts.push(<em key={`${keyPrefix}-i${i}`}>{token.slice(1, -1)}</em>);
    }
    last = match.index + token.length;
    i += 1;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function Prose({ body, className = "" }: { body: string; className?: string }) {
  const lines = body.split("\n");
  const out: ReactNode[] = [];
  let bullets: string[] = [];

  const flushBullets = () => {
    if (!bullets.length) return;
    out.push(
      <ul key={`ul-${out.length}`} className="mt-3 grid gap-2 pl-1">
        {bullets.map((b, i) => (
          <li key={i} className="t-body flex gap-2.5 text-ink-secondary">
            <span aria-hidden="true" className="mt-2.5 size-1 flex-none rounded-full bg-line-strong" />
            <span>{inline(b, `li-${out.length}-${i}`)}</span>
          </li>
        ))}
      </ul>,
    );
    bullets = [];
  };

  lines.forEach((raw, i) => {
    const line = raw.trimEnd();

    if (line.startsWith("- ")) {
      bullets.push(line.slice(2));
      return;
    }
    flushBullets();

    if (!line.trim()) return;

    if (line === "---") {
      out.push(<hr key={i} className="mt-8 border-t border-line" />);
      return;
    }
    if (line.startsWith("## ")) {
      out.push(
        <h2 key={i} className="t-h3 mt-9 text-ink">
          {line.slice(3)}
        </h2>,
      );
      return;
    }
    out.push(
      <p key={i} className="t-body mt-4 text-ink-secondary">
        {inline(line, `p${i}`)}
      </p>,
    );
  });
  flushBullets();

  return <div className={`max-w-[68ch] ${className}`}>{out}</div>;
}
