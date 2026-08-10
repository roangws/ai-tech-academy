"use client";

import { useId, useRef, useState } from "react";
import {
  CodeSimpleIcon,
  EyeIcon,
  LinkSimpleIcon,
  ListBulletsIcon,
  ListNumbersIcon,
  MinusIcon,
  PencilSimpleIcon,
  QuotesIcon,
  TextBIcon,
  TextHOneIcon,
  TextHTwoIcon,
  TextItalicIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Prose } from "@/components/lms/prose";

/**
 * The text editor lesson bodies are written in.
 *
 * ------------------------------------------------------------------ the report
 *
 * Roan, on the lesson editor: "I was not able to find any way to edit this as a
 * final user. That's totally broken. It's very bad… I need to have the option to
 * have rich text information to insert elements. You need to create a text box
 * place that can do all the management there."
 *
 * The screen he was looking at showed each block as a line of raw JSON —
 * `{"md":"Map the whole revenue process once…\n\n## What this covers\n\n…"}` —
 * inside a textarea. Editing a paragraph meant editing a JSON string literal:
 * every newline typed as a backslash-n, every quotation mark escaped, and one
 * missed backslash losing the entire save to "payload is not valid JSON". For
 * the single most-authored object in the product, on a screen whose only purpose
 * is authoring.
 *
 * -------------------------------------------------- why Markdown and not a WYSIWYG
 *
 * The obvious answer is a contenteditable rich-text surface, and it is the wrong
 * one here for a reason that has nothing to do with effort.
 *
 * `components/lms/prose.tsx` renders these bodies, and it renders them WITHOUT
 * `dangerouslySetInnerHTML` — every character is escaped by React on the way
 * out, so the renderer has no path that turns a string into markup and therefore
 * cannot become an injection vector. That property is stated in that file as the
 * thing that matters most about it, and it is worth more than a WYSIWYG surface:
 * a contenteditable editor stores HTML, storing HTML means rendering HTML, and
 * rendering HTML means the day an instructor account is compromised, a lesson
 * body is a script tag.
 *
 * So the storage stays Markdown and the editor is a toolbar over it. The author
 * never types syntax — they select text and press a button — and the preview
 * beside it is the actual `Prose` component, not an approximation of it. What
 * they see IS what the learner gets, because it is the same code.
 *
 * ------------------------------------------------- the toolbar matches the renderer
 *
 * Every button emits something `Prose` knows, and `Prose` grew four rules to
 * meet this: `###`, numbered lists, blockquotes and links. That direction is
 * deliberate — a toolbar button that emits syntax the renderer cannot read
 * prints brackets and asterisks to the learner, which is worse than not offering
 * the button. There is no button here without a rule there.
 *
 * ----------------------------------------------------------- selection handling
 *
 * The fiddly part, and the part that makes it feel like an editor rather than a
 * macro. Three cases, all handled by `wrap` and `linePrefix`:
 *
 *   - Text is selected: it is wrapped or prefixed, and stays selected afterwards
 *     so a second press can toggle another mark onto the same words.
 *   - Nothing is selected: the marks are inserted with the caret placed BETWEEN
 *     them, so pressing Bold and typing produces bold text rather than `****`
 *     with the caret past the end.
 *   - A line prefix on a multi-line selection prefixes every line, which is what
 *     turning four paragraphs into a bullet list means.
 *
 * `setRangeText` rather than splicing the value by hand, because it keeps the
 * browser's own undo stack intact. Rebuilding the string and assigning `.value`
 * works and quietly makes ⌘Z stop undoing, which on a text editor is not a
 * detail.
 */

type Tool =
  | { kind: "wrap"; before: string; after: string; label: string; Icon: typeof TextBIcon; hint: string }
  | { kind: "line"; prefix: string; label: string; Icon: typeof TextBIcon; hint: string }
  | { kind: "block"; text: string; label: string; Icon: typeof TextBIcon; hint: string }
  | { kind: "link"; label: string; Icon: typeof TextBIcon; hint: string };

const TOOLS: Tool[] = [
  { kind: "line", prefix: "## ", label: "Heading", Icon: TextHOneIcon, hint: "Section heading" },
  { kind: "line", prefix: "### ", label: "Subheading", Icon: TextHTwoIcon, hint: "Sub-heading" },
  { kind: "wrap", before: "**", after: "**", label: "Bold", Icon: TextBIcon, hint: "Bold" },
  { kind: "wrap", before: "_", after: "_", label: "Italic", Icon: TextItalicIcon, hint: "Italic" },
  { kind: "wrap", before: "`", after: "`", label: "Code", Icon: CodeSimpleIcon, hint: "Inline code" },
  { kind: "line", prefix: "- ", label: "Bulleted list", Icon: ListBulletsIcon, hint: "Bulleted list" },
  { kind: "line", prefix: "1. ", label: "Numbered list", Icon: ListNumbersIcon, hint: "Numbered list. The numbers redraw themselves" },
  { kind: "line", prefix: "> ", label: "Quote", Icon: QuotesIcon, hint: "Pull quote" },
  { kind: "link", label: "Link", Icon: LinkSimpleIcon, hint: "Link" },
  { kind: "block", text: "\n---\n", label: "Divider", Icon: MinusIcon, hint: "Horizontal rule" },
];

export function RichText({
  name,
  defaultValue = "",
  rows = 14,
  placeholder,
}: {
  name: string;
  defaultValue?: string | null;
  rows?: number;
  placeholder?: string;
}) {
  const area = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(defaultValue ?? "");
  const [previewing, setPreviewing] = useState(false);
  const id = useId();

  /* Read back from the element after every edit. `setRangeText` mutates the
     textarea directly — that is what preserves undo — so React's state has to be
     told rather than being the thing that drove the change. */
  const sync = () => {
    const el = area.current;
    if (el) setValue(el.value);
  };

  function wrap(before: string, after: string) {
    const el = area.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;

    el.setRangeText(before + el.value.slice(start, end) + after, start, end, "select");

    /* Nothing was selected: put the caret between the two marks so the next
       keystroke lands inside them. With "select" and an empty selection the
       caret would sit after `after`, and typing would produce `****text`. */
    if (start === end) {
      const caret = start + before.length;
      el.setSelectionRange(caret, caret);
    }
    el.focus();
    sync();
  }

  function linePrefix(prefix: string) {
    const el = area.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;

    /* Grow the range to whole lines. Prefixing from the middle of a line would
       put "## " inside a sentence, which is not a heading in any Markdown
       dialect and is a confusing thing to watch happen. */
    const from = el.value.lastIndexOf("\n", start - 1) + 1;
    const toIndex = el.value.indexOf("\n", end);
    const to = toIndex === -1 ? el.value.length : toIndex;

    const lines = el.value.slice(from, to).split("\n");
    /* Every line already prefixed means this is a toggle off. It is what makes
       the button feel like a control rather than a stamp — pressing Bulleted
       list on a bulleted list should un-bullet it. */
    const allPrefixed = lines.every((l) => l.startsWith(prefix));
    const next = lines
      .map((l) => (allPrefixed ? l.slice(prefix.length) : prefix + l.replace(/^(#{2,3} |- |\d+\. |> )/, "")))
      .join("\n");

    el.setRangeText(next, from, to, "select");
    el.focus();
    sync();
  }

  function insert(text: string) {
    const el = area.current;
    if (!el) return;
    el.setRangeText(text, el.selectionStart, el.selectionEnd, "end");
    el.focus();
    sync();
  }

  function link() {
    const el = area.current;
    if (!el) return;
    const selected = el.value.slice(el.selectionStart, el.selectionEnd);
    /*
      `prompt` is not a design choice anybody would defend on its own, and it is
      the right one here: this is an admin-only screen used by one person, a
      modal with focus management and an escape hatch is a component, and the
      native dialog is keyboard-accessible, dismissible and impossible to get
      wrong. If a second person ever authors here, this is the first thing to
      replace.
    */
    const href = window.prompt("Link to:", "https://");
    if (!href) return;
    wrap("[", `](${href})`);
    if (!selected) {
      /* No text was selected, so the label is empty and the caret is between the
         brackets — which is where somebody now wants to type the words. */
      const el2 = area.current;
      if (el2) el2.setSelectionRange(el2.selectionStart, el2.selectionStart);
    }
  }

  const button =
    "grid size-8 place-items-center rounded-[var(--radius-control)] text-ink-secondary transition-colors hover:bg-surface hover:text-ink";

  return (
    <div className="rounded-[var(--radius-card)] border border-line-control bg-surface">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-surface-subtle p-1.5">
        {TOOLS.map((tool) => (
          <button
            key={tool.label}
            type="button"
            title={tool.hint}
            aria-label={tool.label}
            /* `disabled` while previewing rather than hidden. The toolbar
               keeping its shape is what stops the whole panel jumping 40px every
               time somebody checks their work. */
            disabled={previewing}
            onClick={() => {
              if (tool.kind === "wrap") wrap(tool.before, tool.after);
              else if (tool.kind === "line") linePrefix(tool.prefix);
              else if (tool.kind === "block") insert(tool.text);
              else link();
            }}
            className={`${button} disabled:opacity-40`}
          >
            <tool.Icon size={15} aria-hidden="true" />
          </button>
        ))}

        {/*
          Write and Preview, and the preview is the real renderer.

          Not a second implementation of Markdown for the console. `Prose` is
          imported and mounted with the current value, so what an author checks
          here is byte-for-byte what a learner gets — including the cases where
          the renderer does something they did not expect, which is exactly when
          a preview earns its place.
        */}
        <div className="ml-auto flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setPreviewing(false)}
            aria-pressed={!previewing}
            className={`t-meta inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-control)] px-2.5 transition-colors ${
              previewing ? "text-ink-muted hover:text-ink" : "bg-surface text-ink shadow-e1"
            }`}
          >
            <PencilSimpleIcon size={13} aria-hidden="true" />
            Write
          </button>
          <button
            type="button"
            onClick={() => setPreviewing(true)}
            aria-pressed={previewing}
            className={`t-meta inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-control)] px-2.5 transition-colors ${
              previewing ? "bg-surface text-ink shadow-e1" : "text-ink-muted hover:text-ink"
            }`}
          >
            <EyeIcon size={13} aria-hidden="true" />
            Preview
          </button>
        </div>
      </div>

      {/*
        THE TEXTAREA IS ALWAYS MOUNTED, and hidden rather than unmounted while
        previewing. It is the form control: unmounting it removes the field from
        the submission, so switching to Preview and pressing Save would post an
        empty body and wipe the lesson. Hiding it also keeps the caret position
        and the undo stack across a preview, which unmounting would throw away.
      */}
      <div className={previewing ? "hidden" : "block"}>
        <textarea
          ref={area}
          id={id}
          name={name}
          rows={rows}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          spellCheck
          className="t-body-sm block w-full resize-y border-0 bg-transparent p-3.5 text-ink outline-none placeholder:text-ink-muted"
        />
      </div>

      {previewing ? (
        <div className="p-3.5">
          {value.trim() ? (
            <Prose body={value} />
          ) : (
            <p className="t-body-sm text-ink-muted">Nothing written yet.</p>
          )}
        </div>
      ) : null}

      {!previewing ? (
        <p className="t-meta border-t border-line px-3.5 py-2 text-ink-muted">
          Select text and press a button, or type Markdown directly. Preview shows the learner&rsquo;s
          view exactly.
        </p>
      ) : null}
    </div>
  );
}
