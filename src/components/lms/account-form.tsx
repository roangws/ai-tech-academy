"use client";

import { useActionState, useRef, useState } from "react";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { Avatar } from "@/components/lms/avatar";
import { updateProfile, type ProfileState } from "@/app/actions/profile";

/**
 * The account form.
 *
 * ------------------------------------------------------------ the preview
 *
 * A client component for one reason worth having: the portrait updates the
 * moment a file is chosen, before anything is uploaded. Without it a reader
 * picks a file, sees nothing change, and cannot tell whether the control worked
 * until after a round trip — which is the point at which they press it again.
 *
 * The preview is an object URL, revoked when it is replaced so the page does not
 * leak a blob per file the reader tries.
 *
 * -------------------------------------------------------- the file input
 *
 * A real `<input type="file">`, visually hidden with `sr-only` rather than
 * `display:none`, with the visible control being its `<label>`. That keeps it
 * focusable, in the tab order, announced, and operable with the keyboard — all
 * of which a `<div onClick={() => inputRef.current.click()}>` throws away. Same
 * pattern the sign-up radios use.
 */
export function AccountForm({
  firstName,
  lastName,
  company,
  email,
  avatarUrl,
}: {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  avatarUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(updateProfile, null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const objectUrl = useRef<string | null>(null);

  return (
    <form action={formAction} className="mt-9 max-w-[560px]">
      {/* ------------------------------------------------------------ photo */}
      <div className="flex flex-wrap items-center gap-5">
        <Avatar
          name={firstName}
          email={email}
          url={preview ?? avatarUrl}
          size={80}
          className="shadow-e1"
        />
        <div>
          <label
            htmlFor="avatar"
            className="t-button inline-flex h-11 cursor-pointer items-center rounded-[var(--radius-control)] border border-line px-4 text-ink-secondary transition-colors hover:border-line-strong hover:text-ink"
          >
            {avatarUrl || preview ? "Change photo" : "Upload a photo"}
          </label>
          <input
            id="avatar"
            name="avatar"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
              if (!f) {
                objectUrl.current = null;
                setPreview(null);
                setFileName(null);
                return;
              }
              const url = URL.createObjectURL(f);
              objectUrl.current = url;
              setPreview(url);
              setFileName(f.name);
            }}
          />
          <p className="t-micro mt-2 text-ink-muted">
            {fileName ?? "PNG, JPEG, WebP or GIF. Up to 2MB."}
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------ fields */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="first_name" className="t-field block text-ink-secondary">
            First name
          </label>
          <input
            id="first_name"
            name="first_name"
            type="text"
            required
            defaultValue={firstName}
            autoComplete="given-name"
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor="last_name" className="t-field block text-ink-secondary">
            Last name
          </label>
          <input
            id="last_name"
            name="last_name"
            type="text"
            defaultValue={lastName}
            autoComplete="family-name"
            className={FIELD}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="company" className="t-field block text-ink-secondary">
            Company <span className="text-ink-muted">(optional)</span>
          </label>
          <input
            id="company"
            name="company"
            type="text"
            defaultValue={company}
            autoComplete="organization"
            className={FIELD}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="email-display" className="t-field block text-ink-secondary">
            Email
          </label>
          {/* `readOnly`, not `disabled` — a reader has to be able to select and
              copy the address they signed up with. Changing it needs a
              re-verification path that does not exist yet. */}
          <input
            id="email-display"
            type="email"
            value={email}
            readOnly
            className={`${FIELD} bg-surface-subtle text-ink-muted`}
          />
          <p className="t-micro mt-1.5 text-ink-muted">
            Changing your email opens when password recovery does.
          </p>
        </div>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-4 border-t border-line pt-6">
        <LiquidButton
          type="submit"
          variant="accent"
          size="md"
          disabled={pending}
          className="t-button disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </LiquidButton>

        {state?.error ? (
          <p role="alert" className="t-body-sm text-danger">
            {state.error}
          </p>
        ) : state?.ok ? (
          <p role="status" className="t-body-sm text-ink-secondary">
            {state.ok}
          </p>
        ) : null}
      </div>
    </form>
  );
}

const FIELD =
  "t-body mt-1.5 h-11 w-full rounded-[var(--radius-control)] border border-line bg-surface px-3 text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25";
