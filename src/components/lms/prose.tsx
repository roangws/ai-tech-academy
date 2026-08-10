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

/**
 * `**bold**`, `_italic_`, `` `code` `` and `[text](url)`, in one pass.
 *
 * ------------------------------------------------------------- what was added
 *
 * Bold and italic were the whole of it. The editor in the admin console offers a
 * toolbar now, and a toolbar button has to produce something this renders — a
 * "Link" button emitting `[text](url)` into a renderer that does not know the
 * syntax would print the brackets to the learner, which is worse than not having
 * the button. So the two grew to four, and the toolbar offers exactly these.
 *
 * ------------------------------------------------------------- links are safe
 *
 * `href` is the one place in this file where a string authored elsewhere reaches
 * an HTML attribute, so it is the one place that can be an injection vector.
 * `javascript:` and `data:` URLs in an `href` execute on click; the scheme is
 * therefore checked against a whitelist rather than a blacklist, and anything
 * unrecognised renders as plain text with the markup visible. That is the same
 * "show your source rather than disappear" rule the rest of this renderer holds,
 * and here it doubles as the security boundary.
 *
 * `rel="noopener noreferrer"` on external links: `target="_blank"` without
 * `noopener` hands the opened page a handle on this one.
 */
const SAFE_SCHEME = /^(https?:\/\/|mailto:|\/|#)/i;

function inline(text: string, keyPrefix: string): ReactNode[] {
  const parts: ReactNode[] = [];
  /* Order matters inside the alternation: code first, so a backtick span
     containing asterisks is not chewed up by the bold rule before it is seen. */
  const pattern = /(`[^`]+`|\[[^\]]+\]\([^)\s]+\)|\*\*[^*]+\*\*|_[^_]+_)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];

    if (token.startsWith("`")) {
      parts.push(
        <code
          key={`${keyPrefix}-c${i}`}
          className="rounded bg-surface-subtle px-1 py-0.5 font-mono text-[0.9em] text-ink"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("[")) {
      const split = token.indexOf("](");
      const label = token.slice(1, split);
      const href = token.slice(split + 2, -1);

      if (!SAFE_SCHEME.test(href)) {
        /* Not a scheme this renderer will put in an href. The source shows,
           which tells the author exactly what to fix. */
        parts.push(token);
      } else {
        const external = /^https?:\/\//i.test(href);
        parts.push(
          <a
            key={`${keyPrefix}-a${i}`}
            href={href}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="text-accent underline underline-offset-2 hover:text-accent-hover"
          >
            {label}
          </a>,
        );
      }
    } else if (token.startsWith("**")) {
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

/**
 * Block-level Markdown.
 *
 * ------------------------------------------------------------- what was added
 *
 * `##`, `-`, `---` and paragraphs were the whole grammar, which was the right
 * size while the only author was a seed script. The console has a real editor
 * now, so the set grew to what a person writing a lesson reaches for: a
 * sub-heading, a numbered list, and a pull quote. Each one is here because a
 * toolbar button emits it — nothing was added speculatively, and anything still
 * unrecognised falls through to a paragraph and shows its own source.
 *
 * `###` renders at the same size as `##` in a smaller weight rather than at its
 * own scale step. Lesson bodies run to a few hundred words inside a page that
 * already has an h1 and section furniture around it; a third visible size buys
 * nothing and the semantic level is what a screen reader navigates by.
 */
export function Prose({ body, className = "" }: { body: string; className?: string }) {
  const lines = body.split("\n");
  const out: ReactNode[] = [];
  let bullets: string[] = [];
  let ordered: string[] = [];

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

  /*
    Numbered lists get an `<ol>` and let the browser number it, rather than
    printing the numeral the author typed.

    That is not pedantry: an author who inserts a step in the middle of a
    hand-numbered list has to renumber every line below it, and the first time
    they forget, the lesson has two step 4s. The marker is drawn from
    `counter(list-item)` through the `before` utility so it can be styled to
    match the bullet's gutter, which `list-decimal` alone cannot do.
  */
  const flushOrdered = () => {
    if (!ordered.length) return;
    out.push(
      <ol key={`ol-${out.length}`} className="mt-3 grid list-none gap-2 pl-1">
        {ordered.map((b, i) => (
          <li key={i} className="t-body flex gap-2.5 text-ink-secondary">
            <span
              aria-hidden="true"
              className="t-meta mt-1 w-4 flex-none tabular-nums text-ink-muted"
            >
              {i + 1}.
            </span>
            <span>{inline(b, `oli-${out.length}-${i}`)}</span>
          </li>
        ))}
      </ol>,
    );
    ordered = [];
  };

  const flush = () => {
    flushBullets();
    flushOrdered();
  };

  lines.forEach((raw, i) => {
    const line = raw.trimEnd();

    if (line.startsWith("- ")) {
      flushOrdered();
      bullets.push(line.slice(2));
      return;
    }
    /* `1.`, `2.`, `17.` — the numeral is read and discarded; see flushOrdered. */
    const numbered = /^(\d+)\.\s+(.*)$/.exec(line);
    if (numbered) {
      flushBullets();
      ordered.push(numbered[2]);
      return;
    }
    flush();

    if (!line.trim()) return;

    if (line === "---") {
      out.push(<hr key={i} className="mt-8 border-t border-line" />);
      return;
    }
    if (line.startsWith("### ")) {
      out.push(
        <h3 key={i} className="t-card-title mt-7 text-ink">
          {line.slice(4)}
        </h3>,
      );
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
    if (line.startsWith("> ")) {
      out.push(
        <blockquote
          key={i}
          className="t-body mt-5 border-l-2 border-accent pl-4 text-ink-secondary"
        >
          {inline(line.slice(2), `q${i}`)}
        </blockquote>,
      );
      return;
    }
    out.push(
      <p key={i} className="t-body mt-4 text-ink-secondary">
        {inline(line, `p${i}`)}
      </p>,
    );
  });
  flush();

  return <div className={`max-w-[68ch] ${className}`}>{out}</div>;
}
