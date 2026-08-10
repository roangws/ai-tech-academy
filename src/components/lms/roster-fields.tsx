"use client";

import { useId, useRef, useState } from "react";
import { ImageSquareIcon, UploadSimpleIcon, XIcon } from "@phosphor-icons/react/dist/ssr";

/**
 * The two controls on the roster form that were unusable.
 *
 * ------------------------------------------------------------------ the report
 *
 * Roan, on /admin/roster/aaron: "there are options not clear… I can't upload a
 * logo, no idea what's `Ground / var(--path-a)`."
 *
 * Both complaints are the same mistake: the form was asking an author to type
 * the value a developer would have typed in `content.ts`. A file PATH under
 * `/public` is a fact about the git repository, and a CSS custom property is a
 * fact about `globals.css`. Neither is knowable from the screen, and neither is
 * something the person filling in a judge's card should have to hold.
 */

/* ---------------------------------------------------------------- the picture */

/**
 * Upload an image, see it, or keep the one that is there.
 *
 * ------------------------------------------------------- three states, one control
 *
 * The awkward part of an image field is that "unchanged" and "removed" are
 * different intentions and an empty file input expresses both. So the file input
 * only ever means "replace with this", the preview shows what is currently
 * stored, and clearing is its own explicit control writing an empty string into
 * the hidden path field. The server reads the two independently — see
 * `uploadImage` in actions/roster.ts.
 *
 * The preview uses `URL.createObjectURL`, so an author sees the actual picture
 * before saving rather than a filename. It is revoked when replaced: an object
 * URL pins the whole file in memory until the document unloads, and somebody
 * trying four portraits in a row would otherwise hold all four.
 *
 * A plain `<img>` rather than `next/image`. The preview source is a `blob:` URL
 * that the optimiser cannot fetch, and the stored source may be either a repo
 * path or a Supabase URL — one element that renders all three beats a branch
 * that renders two of them.
 */
export function ImageField({
  label,
  hint,
  name,
  pathName,
  current,
  round = false,
}: {
  label: string;
  hint?: string;
  /** The file input's name, read by the action as an upload. */
  name: string;
  /** The hidden field carrying the existing value, so "no change" survives. */
  pathName: string;
  current: string | null;
  round?: boolean;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [kept, setKept] = useState<string | null>(current);

  const shown = preview ?? kept;

  return (
    <div>
      <span className="t-label block text-ink-muted">{label}</span>

      <div className="mt-1.5 flex items-start gap-3">
        <span
          className={`relative grid size-16 flex-none place-items-center overflow-hidden border border-line bg-surface-subtle ${
            round ? "rounded-full" : "rounded-[var(--radius-control)]"
          }`}
        >
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="" className="size-full object-cover" />
          ) : (
            <ImageSquareIcon size={20} aria-hidden="true" className="text-ink-muted" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          {/*
            A styled label rather than a styled `<input type=file>`. The native
            control cannot be restyled to match anything on this site, and the
            label-wraps-input pattern keeps the whole thing keyboard reachable
            and screen-reader correct without a click handler.
          */}
          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor={id}
              className="t-meta inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-[var(--radius-control)] border border-line-control px-2.5 text-ink-secondary transition-colors hover:border-accent hover:text-accent"
            >
              <UploadSimpleIcon size={14} aria-hidden="true" />
              {shown ? "Replace" : "Upload"}
            </label>
            <input
              ref={input}
              id={id}
              type="file"
              name={name}
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={(e) => {
                const file = e.target.files?.[0];
                /* Revoke the previous blob before making another. Without it,
                   trying four portraits pins all four in memory for the life of
                   the document. */
                setPreview((old) => {
                  if (old) URL.revokeObjectURL(old);
                  return file ? URL.createObjectURL(file) : null;
                });
              }}
              className="sr-only"
            />

            {shown ? (
              <button
                type="button"
                onClick={() => {
                  setPreview((old) => {
                    if (old) URL.revokeObjectURL(old);
                    return null;
                  });
                  setKept(null);
                  if (input.current) input.current.value = "";
                }}
                className="t-meta inline-flex min-h-[36px] items-center gap-1.5 rounded-[var(--radius-control)] border border-line-control px-2.5 text-ink-secondary transition-colors hover:border-danger hover:text-danger"
              >
                <XIcon size={13} aria-hidden="true" />
                Remove
              </button>
            ) : null}
          </div>

          {/*
            HIDDEN, and it was a visible monospace text box until 9 Aug.

            Roan, on the roster entry for Aaron Jimenez: "remove this field, only
            upload /images/logos/n-aible.png."

            It was there as an escape hatch for the marks that genuinely live in the
            repository under /public, so an author could paste a path instead of
            uploading a copy of a file the repo already has. In practice it showed a
            path nobody needs to read, invited editing a value that has exactly one
            correct form, and made a two-control field out of a one-control job. The
            upload button is the whole interface now.

            It stays in the DOM because it is LOAD-BEARING: it carries the existing
            value on every save, and without it a save with no new file chosen would
            submit nothing for this column and clear the image. `Remove` still works
            the same way, by emptying this value rather than by a separate flag.

            The paths already in the database are unaffected, and an author who needs
            to set one by hand has the SQL editor. If it has to come back it should be
            a disclosure rather than a field: the value is diagnostic, not editorial.
          */}
          <input type="hidden" name={pathName} value={kept ?? ""} />

          {hint ? <span className="t-meta mt-1 block text-ink-muted">{hint}</span> : null}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- the colour */

/**
 * The six grounds, shown rather than named.
 *
 * `var(--path-a)` is meaningless on screen — it is a variable name, and the
 * thing it names is a colour, so the control should be the colour. The value
 * stored is unchanged: these are still the tokens `globals.css` defines, which
 * is what lets a card follow the theme instead of freezing one theme's hex into
 * the database.
 *
 * Radios rather than buttons, because this is one choice out of a fixed set and
 * that is what a radio group is. Arrow keys move between them for free, which a
 * row of buttons would have to implement.
 *
 * The swatch is painted with the token itself, so what an author picks is
 * literally what renders — and if somebody adds `--path-f` to globals.css, this
 * list is where it becomes pickable.
 */
const GROUNDS: readonly { token: string; label: string }[] = [
  { token: "var(--accent)", label: "Accent" },
  { token: "var(--path-a)", label: "A · teal" },
  { token: "var(--path-b)", label: "B · plum" },
  { token: "var(--path-c)", label: "C · green" },
  { token: "var(--path-d)", label: "D · blue" },
  { token: "var(--path-e)", label: "E · rust" },
];

export function GroundPicker({ name, value }: { name: string; value: string }) {
  /* An unrecognised stored value — hand-written, or a token since renamed —
     is kept and shown as a seventh option rather than silently snapping to the
     accent, which would rewrite data on save that nobody asked to change. */
  const known = GROUNDS.some((g) => g.token === value);
  const options = known ? GROUNDS : [...GROUNDS, { token: value, label: "Current" }];
  const [picked, setPicked] = useState(value);

  return (
    <fieldset>
      <legend className="t-label text-ink-muted">Card colour</legend>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {options.map((g) => {
          const on = picked === g.token;
          return (
            <label
              key={g.token}
              title={g.token}
              className={`flex cursor-pointer items-center gap-2 rounded-[var(--radius-control)] border px-2.5 py-1.5 transition-colors ${
                on ? "border-accent bg-accent-tint" : "border-line-control hover:border-line-strong"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={g.token}
                checked={on}
                onChange={() => setPicked(g.token)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                style={{ background: g.token }}
                className="size-5 flex-none rounded-full ring-1 ring-inset ring-black/10"
              />
              <span className={`t-meta ${on ? "text-accent" : "text-ink-secondary"}`}>{g.label}</span>
            </label>
          );
        })}
      </div>
      <span className="t-meta mt-1.5 block text-ink-muted">
        Tints the card behind this person&rsquo;s photograph, and follows the light and dark themes.
      </span>
    </fieldset>
  );
}
