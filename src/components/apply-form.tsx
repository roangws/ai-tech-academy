"use client";

import { useActionState, useRef, useState } from "react";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { Avatar } from "@/components/lms/avatar";
import { saveApplication, type ApplyState } from "@/app/actions/apply";
import type { Application } from "@/lib/supabase/types";

/**
 * The second half of an application: everything that does not belong in a form
 * on a public page.
 *
 * -------------------------------------------------------- why it is a client
 *
 * One reason, and it is the same one `account-form.tsx` gives: the portrait has
 * to update the moment a file is chosen, before anything is uploaded. Without
 * that, somebody picks a file, sees nothing change, cannot tell whether the
 * control worked, and presses it again. The preview is an object URL, revoked
 * when it is replaced so the page does not leak a blob per file tried.
 *
 * Everything else here would work as a plain server-rendered form and is written
 * so that it nearly does: real inputs, real labels, `defaultValue` from the row,
 * no controlled state anywhere except the preview.
 *
 * ------------------------------------------------- two buttons, one action
 *
 * Save and Submit post the same form to the same action and differ by the
 * `intent` of the button pressed, which is what `formData.get("intent")` reads.
 * Two forms would mean two copies of fifteen fields; a single button that
 * "saves and submits" would mean an applicant cannot stop halfway, which is the
 * whole reason a draft exists.
 *
 * Submit carries a `confirm`, because it is the one control on this page that
 * cannot be undone by pressing it again: past it, the row is the board's and the
 * only way back is to withdraw.
 */
export function ApplyForm({
  track,
  application,
  courses,
  profile,
}: {
  track: "instructor" | "judge";
  application: Application | null;
  courses: readonly { id: string; badge: string; title: string }[];
  profile: { firstName: string; lastName: string; company: string; email: string; avatarUrl: string | null };
}) {
  const [state, formAction, pending] = useActionState<ApplyState, FormData>(saveApplication, null);

  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const objectUrl = useRef<string | null>(null);

  /*
    Prefilled from the profile where the application has nothing yet, and never
    the other way round. Somebody who has already typed a name onto their
    application has said what they want the board to read, and having a later
    profile edit overwrite it would be the form changing an answer behind them.
  */
  const a = application;
  const fullName =
    a?.full_name || [profile.firstName, profile.lastName].filter(Boolean).join(" ");
  const photo = preview ?? a?.photo_url ?? profile.avatarUrl;

  return (
    <form action={formAction} className="mt-9 max-w-[720px]">
      <input type="hidden" name="track" value={track} />

      {/* ------------------------------------------------------------ photo */}
      <section aria-labelledby="photo-heading">
        <h2 id="photo-heading" className="t-h3 text-ink">
          Your portrait
        </h2>
        <p className="t-body-sm mt-1.5 max-w-[58ch] text-ink-secondary">
          The board reads applications with the face attached, and this becomes your
          photograph on the site if you are seated. It also becomes your account picture,
          so there is only ever one of you.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-5">
          <Avatar name={fullName} email={profile.email} url={photo} size={80} className="shadow-e1" />
          <div>
            {/*
              A real `<input type="file">`, hidden with `sr-only` rather than
              `display:none`, with the visible control being its `<label>`. That
              keeps it focusable, in the tab order, announced, and operable from
              the keyboard, all of which a div with an onClick throws away.
            */}
            <label
              htmlFor="photo"
              className="t-button inline-flex h-11 cursor-pointer items-center rounded-[var(--radius-control)] border border-line-control px-4 text-ink-secondary transition-colors hover:border-line-strong hover:text-ink"
            >
              {photo ? "Change photo" : "Upload a photo"}
            </label>
            <input
              id="photo"
              name="photo"
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
                const next = URL.createObjectURL(f);
                objectUrl.current = next;
                setPreview(next);
                setFileName(f.name);
              }}
            />
            <p className="t-micro mt-2 text-ink-muted">
              {fileName ?? "PNG, JPEG, WebP or GIF. Up to 2MB."}
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- who */}
      <Fieldset heading="Who you are" note="As the board should read it, not as a CV.">
        <Field label="Full name" name="full_name" defaultValue={fullName} required autoComplete="name" />
        <Field
          label="Your headline"
          name="headline"
          defaultValue={a?.headline ?? ""}
          hint="One line, in your own words. This is what appears under your name if you are seated."
          span
        />
        <Field label="Organisation" name="org" defaultValue={a?.org ?? profile.company} optional autoComplete="organization" />
        <Field label="Where you are" name="location" defaultValue={a?.location ?? ""} optional placeholder="City, country" />
        <Field
          label="LinkedIn"
          name="linkedin_url"
          defaultValue={a?.linkedin_url ?? ""}
          type="url"
          placeholder="linkedin.com/in/you"
          span
        />
        <Field
          label="Anything else public"
          name="site_url"
          defaultValue={a?.site_url ?? ""}
          type="url"
          optional
          hint="A site, a repository, a channel. One link."
          span
        />
      </Fieldset>

      {/* --------------------------------------------------------- reaching */}
      <Fieldset
        heading="How to reach you"
        note="Read by the advisory board and by nobody else. It is not published on the site and it is not shown to learners."
      >
        <Field label="Phone" name="phone" defaultValue={a?.phone ?? ""} type="tel" required autoComplete="tel" placeholder="+1 555 000 0000" />
        <Field
          label="WhatsApp"
          name="whatsapp"
          defaultValue={a?.whatsapp ?? ""}
          type="tel"
          optional
          hint="Leave blank if it is the same number."
        />
      </Fieldset>

      {/* -------------------------------------------------------- substance */}
      <Fieldset
        heading={track === "instructor" ? "What you would record" : "What you would read"}
        note={
          track === "instructor"
            ? "One path, and the evidence that you have run what it teaches."
            : "One discipline, and the evidence that your judgement in it has been tested."
        }
      >
        <div className="sm:col-span-2">
          <label htmlFor="course_id" className="t-field block text-ink-secondary">
            {track === "instructor" ? "The path" : "The course you would read"}{" "}
            <span className="text-ink-muted">(optional)</span>
          </label>
          <select
            id="course_id"
            name="course_id"
            defaultValue={a?.course_id ?? ""}
            className="t-body mt-1.5 h-11 w-full rounded-[var(--radius-control)] border border-line-control bg-surface px-3 text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25"
          >
            <option value="">No preference, or none of these</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.badge} · {c.title}
              </option>
            ))}
          </select>
          <p className="t-micro mt-1.5 text-ink-muted">
            A preference rather than a claim on it. The board seats people where the
            program needs them.
          </p>
        </div>

        <Field
          label={track === "instructor" ? "The subject you would teach" : "Your discipline"}
          name="focus"
          defaultValue={a?.focus ?? ""}
          span
          hint="One sentence."
        />

        <Area
          label="Your evidence"
          name="evidence"
          defaultValue={a?.evidence ?? ""}
          required
          rows={7}
          hint={
            track === "instructor"
              ? "What you have built or run in production, where it can be checked, and what somebody outside your company has said about it. Specifics beat adjectives here, and the board reads a great many adjectives."
              : "Where your judgement has been tested in the open: what you have reviewed, hired for, funded, graded or shipped, and where a stranger can verify it. Specifics beat adjectives here, and the board reads a great many adjectives."
          }
        />

        <Field
          label={track === "instructor" ? "A recorded sample" : "Published work"}
          name="sample_url"
          defaultValue={a?.sample_url ?? ""}
          type="url"
          optional
          span
          hint={
            track === "instructor"
              ? "A link to you explaining something on camera. Twenty unedited minutes is more useful than a showreel."
              : "A link to something you wrote, reviewed or presented."
          }
        />
      </Fieldset>

      {/* ----------------------------------------------------------- extras */}
      <Fieldset
        heading="What else you can do"
        note="Neither of these is required, and neither counts against an application that says no. They decide what you are asked to do, not whether you are seated."
      >
        {/*
          Real checkboxes with real labels. The pill treatment used elsewhere on
          this site is for radios in a group; a pair of independent yes/no
          questions is what a checkbox is, and inventing a control for it would
          cost the native semantics for nothing.
        */}
        <Check
          name="in_person"
          defaultChecked={a?.in_person ?? false}
          label="I can sit on a panel in person"
          hint="Events where learners present the workflows they deployed."
        />
        <Field
          label="Which city"
          name="in_person_city"
          defaultValue={a?.in_person_city ?? ""}
          optional
          hint="Only if you ticked the box above."
        />
        <Check
          name="reviews_curriculum"
          defaultChecked={a?.reviews_curriculum ?? false}
          label="I would also read curriculum each term"
          hint="A written review of one course per term, against the sentence that defines the seat."
          span
        />
        <Area
          label="Anything else the board should know"
          name="notes"
          defaultValue={a?.notes ?? ""}
          rows={4}
          optional
        />
      </Fieldset>

      {/* ---------------------------------------------------------- controls */}
      <div className="mt-9 flex flex-wrap items-center gap-4 border-t border-line pt-6">
        <LiquidButton
          type="submit"
          name="intent"
          value="submit"
          variant="accent"
          size="md"
          disabled={pending}
          className="t-button disabled:opacity-60"
          onClick={(e) => {
            if (!confirm("Send this to the advisory board? You cannot edit it afterwards.")) {
              e.preventDefault();
            }
          }}
        >
          {pending ? "Working…" : "Submit to the board"}
        </LiquidButton>

        <button
          type="submit"
          name="intent"
          value="save"
          disabled={pending}
          className="t-button h-11 rounded-[var(--radius-control)] border border-line-control px-5 text-ink-secondary transition-colors hover:border-line-strong hover:text-ink disabled:opacity-60"
        >
          Save draft
        </button>

        {state?.error ? (
          <p role="alert" className="t-body-sm text-danger">
            {state.error}
          </p>
        ) : state?.ok ? (
          <p role="status" className="t-body-sm text-ink-secondary">
            {state.ok}
          </p>
        ) : (
          <p className="t-micro text-ink-muted">
            Saving keeps it private. Submitting sends it.
          </p>
        )}
      </div>
    </form>
  );
}

/* -------------------------------------------------------------- primitives

   Local to this file rather than in components/ui, because they are this form's
   internal repetition and nothing else on the site has fifteen fields in a
   two-column grid. Promoting them the moment a second form wants them is a
   smaller change than un-promoting a shared component that turned out to fit one
   caller. */

const FIELD =
  "t-body mt-1.5 w-full rounded-[var(--radius-control)] border border-line-control bg-surface px-3 text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/25";

function Fieldset({
  heading,
  note,
  children,
}: {
  heading: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="mt-10 border-t border-line pt-7">
      {/* A real `<legend>`, so a screen reader announces which group focus has
          entered rather than reading fifteen unrelated labels in a row. */}
      <legend className="t-h3 text-ink">{heading}</legend>
      <p className="t-body-sm mt-1.5 max-w-[58ch] text-ink-secondary">{note}</p>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Label({
  htmlFor,
  label,
  optional,
}: {
  htmlFor: string;
  label: string;
  optional?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="t-field block text-ink-secondary">
      {label} {optional ? <span className="text-ink-muted">(optional)</span> : null}
    </label>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  optional,
  span,
  hint,
  placeholder,
  autoComplete,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
  optional?: boolean;
  span?: boolean;
  hint?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  const hintId = hint ? `${name}-hint` : undefined;
  return (
    <div className={span ? "sm:col-span-2" : ""}>
      <Label htmlFor={name} label={label} optional={optional} />
      {/*
        `type="url"` is deliberately NOT used on the link fields. The browser's
        native validation for it refuses anything without a scheme, so
        "linkedin.com/in/you" is rejected in the browser before the action gets
        the chance to add the https:// it obviously means. The action normalises
        and then validates; see the note on `url` in actions/apply.ts.
      */}
      <input
        id={name}
        name={name}
        type={type === "url" ? "text" : type}
        inputMode={type === "url" ? "url" : undefined}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-describedby={hintId}
        className={`${FIELD} h-11`}
      />
      {hint ? (
        <p id={hintId} className="t-micro mt-1.5 text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function Area({
  label,
  name,
  defaultValue,
  rows,
  required,
  optional,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows: number;
  required?: boolean;
  optional?: boolean;
  hint?: string;
}) {
  const hintId = hint ? `${name}-hint` : undefined;
  return (
    <div className="sm:col-span-2">
      <Label htmlFor={name} label={label} optional={optional} />
      {hint ? (
        <p id={hintId} className="t-micro mt-1.5 max-w-[62ch] text-ink-muted">
          {hint}
        </p>
      ) : null}
      <textarea
        id={name}
        name={name}
        rows={rows}
        required={required}
        defaultValue={defaultValue}
        aria-describedby={hintId}
        className={`${FIELD} p-3.5`}
      />
    </div>
  );
}

function Check({
  name,
  label,
  hint,
  defaultChecked,
  span,
}: {
  name: string;
  label: string;
  hint: string;
  defaultChecked: boolean;
  span?: boolean;
}) {
  return (
    <div className={span ? "sm:col-span-2" : ""}>
      <div className="flex gap-3">
        <input
          id={name}
          name={name}
          type="checkbox"
          defaultChecked={defaultChecked}
          aria-describedby={`${name}-hint`}
          className="mt-0.5 size-[18px] flex-none accent-[var(--accent)]"
        />
        <div className="min-w-0">
          <label htmlFor={name} className="t-body-sm cursor-pointer text-ink">
            {label}
          </label>
          <p id={`${name}-hint`} className="t-micro mt-1 text-ink-muted">
            {hint}
          </p>
        </div>
      </div>
    </div>
  );
}
