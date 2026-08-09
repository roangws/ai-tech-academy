"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { WarningCircleIcon, CheckIcon } from "@phosphor-icons/react/dist/ssr";

/**
 * The console's form furniture.
 *
 * ------------------------------------------------------------- why it is client
 *
 * Two reasons, and both are about telling an author what happened.
 *
 * The first is pending state. Every save here is a round trip to Postgres, and a
 * button that looks identical before and after it is pressed is the same defect
 * that made "Complete lesson" feel like ten seconds. `useFormStatus` reads the
 * status of the enclosing form, which is why `Save` has to be a separate
 * component rather than a `<button>` written inline — the hook reports on the
 * form its component is inside, not on one it renders.
 *
 * The second is errors. `src/app/(app)/error.tsx` deliberately does not print
 * `error.message`: those strings are written for whoever reads the logs, and a
 * learner cannot act on "sheets for review: JWT expired". That is right for a
 * failed read and wrong for "a course with that id already exists" — which is
 * not a crash, it is an answer, and throwing it loses every field the author had
 * filled in. `ActionForm` keeps those on the page.
 *
 * ---------------------------------------------------------------- the contract
 *
 * An action used with `ActionForm` returns `{ error }` for something the author
 * can fix and `{ ok }` for a save that landed. It still THROWS for anything
 * else — a policy refusal, a dropped connection — because those belong in the
 * error boundary. Two channels, two meanings.
 */

export type FormState = { error?: string; ok?: string } | null;

export const inputClass =
  "t-body-sm mt-1 h-10 w-full rounded-[var(--radius-control)] border border-line-control bg-surface px-3 text-ink transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25";

export const areaClass =
  "t-body-sm mt-1 w-full rounded-[var(--radius-control)] border border-line-control bg-surface p-3 text-ink transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25";

/**
 * A form whose action can answer back.
 *
 * `role="alert"` on the failure and `role="status"` on the success, so a screen
 * reader hears the outcome. Without them the only feedback for a save is that a
 * button stopped saying "Saving…", which is no feedback at all if you cannot see
 * the button.
 */
export function ActionForm({
  action,
  children,
  className = "",
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  children: ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(action, null);

  return (
    <form action={formAction} className={className}>
      {children}

      {state?.error ? (
        <p
          role="alert"
          className="t-body-sm mt-3 flex items-start gap-2 rounded-[var(--radius-control)] border border-[var(--state-closed)] bg-surface-subtle p-3 text-ink"
        >
          <WarningCircleIcon
            size={16}
            weight="fill"
            aria-hidden="true"
            className="mt-0.5 flex-none text-[var(--state-closed)]"
          />
          {state.error}
        </p>
      ) : null}

      {state?.ok ? (
        <p role="status" className="t-meta mt-2 inline-flex items-center gap-1.5 text-ink-secondary">
          <CheckIcon size={13} weight="bold" aria-hidden="true" className="text-accent" />
          {state.ok}
        </p>
      ) : null}
    </form>
  );
}

export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="t-label text-ink-muted">{label}</span>
      {children}
      {hint ? <span className="t-meta mt-1 block text-ink-muted">{hint}</span> : null}
    </label>
  );
}

export function Text({
  name,
  defaultValue,
  placeholder,
  type = "text",
}: {
  name: string;
  defaultValue?: string | number | null;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      name={name}
      defaultValue={defaultValue ?? ""}
      placeholder={placeholder}
      className={inputClass}
    />
  );
}

export function Area({
  name,
  defaultValue,
  rows = 4,
  placeholder,
}: {
  name: string;
  defaultValue?: string | null;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      name={name}
      rows={rows}
      defaultValue={defaultValue ?? ""}
      placeholder={placeholder}
      className={areaClass}
    />
  );
}

/** The console's one filled control. Saving is the primary act on every screen. */
export function Save({ children = "Save" }: { children?: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="t-button inline-flex h-10 items-center gap-2 rounded-[var(--radius-control)] bg-accent px-4 text-on-accent transition-colors hover:bg-accent-hover disabled:opacity-70"
    >
      {pending ? "Saving…" : children}
    </button>
  );
}

/** Everything that is not saving: add, move, open, close. */
export function Quiet({
  children,
  title,
  ariaLabel,
}: {
  children: ReactNode;
  title?: string;
  ariaLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      title={title}
      aria-label={ariaLabel}
      className="t-meta inline-flex min-h-[36px] items-center gap-1.5 rounded-[var(--radius-control)] border border-line-control px-2.5 text-ink-secondary transition-colors hover:border-line-strong hover:text-ink disabled:opacity-50"
    >
      {children}
    </button>
  );
}

/**
 * A control that destroys something, styled as one.
 *
 * `--state-closed` rather than the accent, and it is the only place in the
 * console that colour appears. A delete that looks like every other button is a
 * delete somebody presses while looking for Save.
 */
export function Danger({ children, title }: { children: ReactNode; title?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      title={title}
      className="t-meta inline-flex min-h-[36px] items-center gap-1.5 rounded-[var(--radius-control)] border border-line-control px-2.5 text-ink-muted transition-colors hover:border-[var(--state-closed)] hover:text-[var(--state-closed)] disabled:opacity-50"
    >
      {children}
    </button>
  );
}
