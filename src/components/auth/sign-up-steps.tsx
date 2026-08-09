"use client";

import Link from "next/link";
import { useActionState, useId, useRef, useState } from "react";
import { ArrowLeftIcon, CheckIcon } from "@phosphor-icons/react";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { CheckInbox } from "@/components/auth/check-inbox";
import { signUp, type AuthState } from "@/app/actions/auth";
import { auth } from "@/lib/content";

/**
 * Sign-up, in three steps.
 *
 * content.ts holds the copy and the argument for the sequence. This file is the
 * machine, and the decisions in it are these.
 *
 * ------------------------------------------------------------------- ONE FORM
 *
 * Three steps, one `<form>`, and the inputs of the steps that are not showing
 * stay mounted. That is not laziness about conditional rendering: unmounting a
 * step throws away everything typed into it, so pressing Back to fix a typo in
 * an email address would clear the role chosen after it. The hidden steps are
 * `hidden` — the attribute, not a class — which removes them from the layout,
 * from the tab order, and from the accessibility tree in one move, and keeps
 * their values in the DOM and in React state.
 *
 * It is also what makes the whole thing submit as one payload the day there is
 * something to submit it to.
 *
 * -------------------------------------------------------------- WHAT VALIDATES
 *
 * Step 1 only, and only for the things a browser can actually check: four
 * non-empty fields, an email with an `@` in it, and eight characters of
 * password. Steps 2 and 3 are optional in full, so there is nothing to validate
 * and no way to fail them.
 *
 * `noValidate` on the form, with the checks done here. The browser's own bubble
 * appears at the field, disappears on the next keystroke, is unstyleable and is
 * announced inconsistently; a message rendered under the field with
 * `aria-describedby` and `aria-invalid` survives all three problems. Errors
 * appear on Continue rather than on blur, because validating a field a reader
 * has not finished with yet is how a form starts arguing with somebody halfway
 * through their own email address.
 *
 * ------------------------------------------------------------------ FOCUS
 *
 * Moving between steps moves focus to the new step's heading, which is given
 * `tabIndex={-1}` so it can take focus without joining the tab order. Without
 * it, focus stays on a Continue button that has just been replaced and a
 * keyboard or screen-reader user is told nothing happened. The heading is the
 * right target rather than the first field: it announces where they are before
 * asking for anything.
 *
 * Nothing is focused on first paint. The move lives inside `goTo`, which only a
 * navigation calls, rather than in an effect that would also fire on mount and
 * pull a reader who was already reading down to the form.
 *
 * ------------------------------------------------- WHY NOT role="tablist"/"progressbar"
 *
 * The step strip is an ordered list with `aria-current="step"` on the one being
 * worked through, which is the WAI pattern for exactly this. `role="tablist"`
 * would promise arrow-key navigation between steps that do not permit it, and
 * `role="progressbar"` describes an indeterminate machine process rather than a
 * position in a sequence. The same argument course/tabs.tsx makes about the
 * section row.
 *
 * ------------------------------------------------------------ THERE IS A BACKEND
 *
 * The `onSubmit` that prevented default is gone; the form's `action` is now the
 * `signUp` Server Action, driven through `useActionState`.
 *
 * The "one form, hidden steps stay mounted" decision above is what makes that a
 * two-line change rather than a rewrite. Every field from all three steps is
 * still in the DOM when the last step submits, so the whole payload posts in one
 * go — which is exactly what that section said it was for. Nothing had to be
 * lifted into hidden inputs or re-serialised from state.
 *
 * The one thing that did need care: the server validates step 1 again, but by
 * then the reader is looking at step 3. `state.field` is mapped back to the step
 * that owns it and the wizard jumps there, or an error about an email address
 * renders under a question about podcasts.
 */
export function SignUpSteps({ next = "" }: { next?: string }) {
  const steps = auth.signUpSteps;
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signUp, null);

  /* `next` is a prop now, read from the query string on the server by the route.
     Reading it here with `useSearchParams` kept this entire form out of the
     server-rendered HTML — see the note in auth-screen.tsx. */

  /* Which step owns which field, so a server error can send the reader back to
     it. Only step 1 can fail server-side — steps 2 and 3 are optional in full —
     but the map is written out rather than assumed, so adding a required field
     to a later step does not silently strand its error. */
  const stepOfField: Record<string, number> = {
    "first-name": 0, "last-name": 0, email: 0, password: 0,
    company: 1, role: 1,
    source: 2,
  };
  const errorStep = state?.field ? stepOfField[state.field] : undefined;

  /*
    LATCHED ON THE ACTION RESULT, and the latch is the entire point.

    The first version jumped to the offending step with a bare
    `if (errorStep !== step) setStep(errorStep)` during render. It was loop-safe
    — the update satisfies its own guard — and it trapped the reader forever.

    `state` from `useActionState` only changes when the action runs again, and
    the only submit button is on the last step. So: submit on step 3, server
    rejects the email, wizard jumps to step 0 (right), reader fixes it and
    presses Continue, `goTo(1)` runs, re-render, `state.error` is STILL set and
    `errorStep(0) !== step(1)`, snapped back to step 0. They could never reach
    step 3 again, so they could never submit again. Account creation was dead
    until a full page reload.

    Comparing against the previous `state` object makes the jump fire once per
    action result, which is what "jump to the error" meant all along. This is
    React's documented adjust-state-when-a-prop-changes shape.
  */
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    if (state?.error && errorStep !== undefined && errorStep !== step) {
      setStep(errorStep);
      /* Focus the field that failed, the same way the client-side path already
         does. Without it a screen-reader user pressed "Create account", the form
         silently became a different step, and focus stayed on a button whose
         label had changed. */
      requestAnimationFrame(() => {
        document.querySelector<HTMLInputElement>("[data-invalid='true']")?.focus();
      });
    }
  }

  /*
    Server-side field errors have to be dismissable too.

    `onChange` below clears the client `errors` map, but `state` cannot change
    until the next submission — so a server error like "there is already an
    account on that address" kept `aria-invalid`, the description and the red
    border on the field for the whole time the reader was correcting it. That is
    exactly what the client path was written to avoid: "an error that stays put
    while somebody fixes it is the form telling them they are still wrong."
  */
  const [dismissed, setDismissed] = useState<string | null>(null);
  const serverErrorFor = (name: string) =>
    state?.field === name && dismissed !== name ? state.error : "";

  const [values, setValues] = useState<Record<string, string>>({});
  const [role, setRole] = useState("");
  const [source, setSource] = useState("");

  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const uid = useId();

  const set = (name: string, value: string) =>
    setValues((v) => ({ ...v, [name]: value }));

  function goTo(next: number) {
    setStep(next);
    /* After paint, or the heading is not yet the one being focused. A
       `requestAnimationFrame` rather than a `useEffect`, so the guard against
       focusing on first render stays local to the navigation that caused it. */
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  function validateAccount() {
    const next: Record<string, string> = {};
    if (!values["first-name"]?.trim()) next["first-name"] = "Your first name, so we know what to call you.";
    if (!values["last-name"]?.trim()) next["last-name"] = "Your last name.";
    const email = values.email?.trim() ?? "";
    if (!email) next.email = "An email address, so you can sign back in.";
    /* Deliberately not a full RFC pattern. Anything stricter than "has an @ with
       something either side" rejects addresses that are valid, and the only
       check that proves an address works is sending to it. */
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "That does not look like an email address.";
    const password = values.password ?? "";
    if (!password) next.password = "A password.";
    else if (password.length < 8) next.password = "Eight characters or more.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function onContinue() {
    if (step === 0 && !validateAccount()) {
      /* Focus the first field that failed, so a keyboard user is taken to the
         problem rather than told there is one somewhere above. */
      requestAnimationFrame(() => {
        const first = document.querySelector<HTMLInputElement>("[data-invalid='true']");
        first?.focus();
      });
      return;
    }
    if (step < steps.length - 1) goTo(step + 1);
  }

  const current = steps[step];
  const isLast = step === steps.length - 1;

  /*
    The account exists and needs its email confirmed.

    This is a whole screen rather than a line under the button, because it is the
    end of the flow: the form has nothing left to collect and the next action is
    in another application. Rendering the wizard underneath it would invite a
    second submission that can only fail with "already registered".
  */
  if (state?.checkInbox) {
    return <CheckInbox email={state.checkInbox} />;
  }

  return (
    <div className="max-w-[440px]">
      {/*
        The step strip. An `<ol>`, because the steps are ordered and the order
        is the meaning, with the current one carrying `aria-current="step"`.

        Completed steps are links back rather than plain text: a reader who
        wants to fix their email on step 3 should not have to press Back twice.
        Steps ahead are not reachable, because step 1 has to validate first.
      */}
      <nav aria-label="Sign-up progress">
        <ol className="flex items-center gap-2">
          {steps.map((s, i) => {
            const done = i < step;
            const here = i === step;
            return (
              <li key={s.id} className="flex min-w-0 flex-1 items-center gap-2">
                {done ? (
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    className="group flex min-w-0 flex-1 flex-col gap-1.5 text-left"
                  >
                    <span className="h-1 w-full rounded-full bg-accent transition-colors group-hover:bg-accent-hover" />
                    <span className="t-micro inline-flex items-center gap-1 text-ink-secondary">
                      <CheckIcon size={11} weight="bold" aria-hidden="true" />
                      {s.label}
                      <span className="sr-only">, completed — go back to this step</span>
                    </span>
                  </button>
                ) : (
                  <span
                    aria-current={here ? "step" : undefined}
                    className="flex min-w-0 flex-1 flex-col gap-1.5"
                  >
                    <span
                      className={`h-1 w-full rounded-full ${here ? "bg-accent" : "bg-line"}`}
                    />
                    <span className={`t-micro ${here ? "text-ink" : "text-ink-muted"}`}>
                      {s.label}
                    </span>
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <p className="t-micro mt-5 text-ink-muted">
        {auth.stepCounter} {step + 1} of {steps.length}
        {current.optional ? " · optional" : ""}
      </p>

      {/* `tabIndex={-1}` so `goTo` can move focus here without putting the
          heading in the tab order. `outline-none` because the focus is
          programmatic and a ring on a heading nobody clicked reads as an
          error. */}
      <h1 ref={headingRef} tabIndex={-1} className="t-h2 mt-1 text-ink outline-none">
        {current.title}
      </h1>
      <p className="t-body mt-2.5 text-ink-secondary">{current.intro}</p>

      <form className="mt-7" noValidate action={formAction}>
        <input type="hidden" name="next" value={next} />
        {/* ------------------------------------------------------- step 1 */}
        <div hidden={step !== 0}>
          <div className="grid gap-4 sm:grid-cols-2">
            {auth.signUp.fields.map((f) => {
              /* Client error first, then the server's for the same field. They
                 use the same strings for the same failures, so a reader who
                 trips both does not get two differently-worded complaints. */
              const error = errors[f.name] || serverErrorFor(f.name);
              return (
                <div key={f.name} className={f.half ? "" : "sm:col-span-2"}>
                  <label htmlFor={f.name} className="t-field block text-ink-secondary">
                    {f.label}
                  </label>
                  <input
                    id={f.name}
                    name={f.name}
                    type={f.type}
                    autoComplete={f.autoComplete}
                    value={values[f.name] ?? ""}
                    onChange={(e) => {
                      set(f.name, e.target.value);
                      /* Clear this field's error as soon as it is touched. An
                         error that stays put while somebody fixes it is the
                         form telling them they are still wrong. Both sources —
                         the client map and the latched server result. */
                      if (errors[f.name]) setErrors((v) => ({ ...v, [f.name]: "" }));
                      if (state?.field === f.name) setDismissed(f.name);
                    }}
                    aria-invalid={error ? true : undefined}
                    data-invalid={error ? "true" : undefined}
                    aria-describedby={error ? `${uid}-${f.name}-error` : undefined}
                    className={`t-body mt-1.5 h-11 w-full rounded-[var(--radius-control)] border bg-surface px-3 text-ink outline-none transition-colors placeholder:text-ink-muted focus:ring-2 ${
                      error
                        ? "border-danger focus:border-danger focus:ring-danger/25"
                        : "border-line focus:border-accent focus:ring-accent/25"
                    }`}
                  />
                  {error ? (
                    <p id={`${uid}-${f.name}-error`} className="t-micro mt-1.5 text-danger">
                      {error}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* ------------------------------------------------------- step 2 */}
        <div hidden={step !== 1}>
          <div>
            <label htmlFor="company" className="t-field block text-ink-secondary">
              {auth.work.companyLabel}
            </label>
            <input
              id="company"
              name="company"
              type="text"
              autoComplete="organization"
              value={values.company ?? ""}
              onChange={(e) => set("company", e.target.value)}
              className="t-body mt-1.5 h-11 w-full rounded-[var(--radius-control)] border border-line bg-surface px-3 text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25"
            />
            <p className="t-micro mt-1.5 text-ink-muted">{auth.work.companyHint}</p>
          </div>

          <ChoiceGroup
            name="role"
            legend={auth.work.roleLabel}
            options={auth.work.roles}
            value={role}
            onChange={setRole}
            otherLabel={auth.work.otherLabel}
            otherPlaceholder={auth.work.otherPlaceholder}
            otherValue={values["role-other"] ?? ""}
            onOtherChange={(v) => set("role-other", v)}
            className="mt-6"
          />
        </div>

        {/* ------------------------------------------------------- step 3 */}
        <div hidden={step !== 2}>
          <ChoiceGroup
            name="source"
            legend={auth.source.label}
            options={auth.source.options}
            value={source}
            onChange={setSource}
            otherLabel={auth.source.otherLabel}
            otherPlaceholder={auth.source.otherPlaceholder}
            otherValue={values["source-other"] ?? ""}
            onOtherChange={(v) => set("source-other", v)}
          />
        </div>

        {/* ------------------------------------------------------ controls */}
        <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => goTo(step - 1)}
              className="t-button inline-flex min-h-[44px] items-center gap-1.5 text-ink-secondary transition-colors hover:text-ink"
            >
              <ArrowLeftIcon size={15} weight="bold" aria-hidden="true" />
              {auth.back}
            </button>
          ) : null}

          <div className="min-w-[180px] flex-1">
            {/*
              One control, two behaviours. On the last step it is a real submit
              so the browser's own Enter-to-submit works; before that it is a
              button that advances, because a submit on step 1 would post a
              third of a form.

              ------------------------------------------------ THE STEP-2 SKIP
              `preventDefault` is load-bearing and the reason is not obvious.

              This is ONE DOM node whose `type` is derived from `step`. Clicking
              Continue on step 2 calls `onContinue` → `goTo(2)`, and React
              flushes that synchronously because a click is a discrete event. By
              the time the browser gets round to running the click's DEFAULT
              action, the very node it was dispatched on has been re-rendered
              with `type="submit"` — so the browser submits the form.

              The effect in the browser was that step 3 never appeared: pressing
              Continue on step 2 posted the whole form, the action came back with
              a Supabase error attached to `email`, and the error latch above
              dutifully sent the reader back to step 1. It looked like a wizard
              that refused to reach its last step.

              Cancelling the default on the click that advances is the whole fix.
              The `key` is belt and braces — it makes the advance button and the
              submit button separate elements, so React swaps the node rather
              than mutating the one under the cursor.
            */}
            <LiquidButton
              key={isLast ? "submit" : "advance"}
              type={isLast ? "submit" : "button"}
              variant="accent"
              size="lg"
              disabled={pending}
              className="t-button w-full disabled:opacity-60"
              onClick={
                isLast
                  ? undefined
                  : (e) => {
                      e.preventDefault();
                      onContinue();
                    }
              }
            >
              {pending ? "Creating your account…" : current.next}
            </LiquidButton>
          </div>
        </div>

        {current.optional && !isLast ? (
          <button
            type="button"
            onClick={() => goTo(step + 1)}
            className="t-meta mt-3 text-ink-muted underline underline-offset-2 transition-colors hover:text-ink-secondary"
          >
            {auth.skip}
          </button>
        ) : null}

        {isLast ? (
          <>
            <p className="t-micro mt-4 text-ink-muted">
              {auth.terms.lead}{" "}
              {auth.terms.links.map((l, i) => (
                <span key={l.href}>
                  {i > 0 ? " and " : ""}
                  <Link
                    href={l.href}
                    className="text-ink-secondary underline underline-offset-2"
                  >
                    {l.label}
                  </Link>
                </span>
              ))}
              .
            </p>

            {/*
              Where the "this form is not live" note used to sit.

              It is now an error slot, and it only carries errors that belong to
              no field — a field error renders under its own field on step 1, and
              repeating it here would say the same thing twice. `role="alert"`
              rather than the old `role="status"`, because this only ever renders
              when something has actually failed.
            */}
            {state?.error && !state.field ? (
              <p
                role="alert"
                className="t-body-sm mt-4 rounded-[var(--radius-card)] border border-danger/30 bg-danger/5 p-4 text-danger"
              >
                {state.error}
              </p>
            ) : (
              <p className="t-micro mt-3 text-ink-muted">
                One free account opens modules 2 to 8 in every course, and the account
                stays free.
              </p>
            )}
          </>
        ) : null}
      </form>

      <p className="t-body-sm mt-7 border-t border-line pt-5 text-ink-secondary">
        {auth.signUp.altPrompt}{" "}
        <Link
          href={auth.signUp.altHref}
          className="t-button text-accent no-underline transition-colors hover:text-accent-hover hover:underline"
        >
          {auth.signUp.altLabel}
        </Link>
      </p>
    </div>
  );
}

/**
 * A radio group with an "Other" escape hatch that opens a text field.
 *
 * ------------------------------------------------------------ RADIOS, NOT A SELECT
 *
 * A native `<select>` would be four lines and it is the wrong control here. Ten
 * options on a phone becomes a system picker that hides every option but one, so
 * a reader cannot see the range they are choosing from — and the range is the
 * useful part, because "Revenue or sales operations" only reads as the right
 * answer next to "Marketing or growth". Radios show all of them and cost one tap
 * each.
 *
 * They are laid out as pills rather than as a column of circles, which is a
 * visual change and not a semantic one: the input stays a real
 * `<input type="radio">`, kept off-screen with `sr-only` rather than
 * `display: none`, so it is still focusable, still in the tab order, still
 * announced, and arrow keys still move within the group. `peer-checked` and
 * `peer-focus-visible` do the styling. A `<div role="radio">` reimplementation
 * would have had to rebuild all of that by hand.
 *
 * `<fieldset>` and `<legend>` rather than a heading and an `aria-labelledby`,
 * because that is what groups controls natively and what a screen reader
 * announces when focus enters the group.
 *
 * --------------------------------------------------------------------- OTHER
 *
 * "Other" is the last option in both lists and content.ts keeps the string once
 * so the two cannot drift. Selecting it reveals a text input, and the input is
 * only in the tree while selected — this one *is* conditional, unlike the steps,
 * because an always-present field that is only sometimes relevant is a field
 * screen readers announce in a group it does not belong to.
 */
function ChoiceGroup({
  name,
  legend,
  options,
  value,
  onChange,
  otherLabel,
  otherPlaceholder,
  otherValue,
  onOtherChange,
  className = "",
}: {
  name: string;
  legend: string;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  otherLabel: string;
  otherPlaceholder: string;
  otherValue: string;
  onOtherChange: (v: string) => void;
  className?: string;
}) {
  const uid = useId();
  const isOther = value === auth.otherOption;

  return (
    <fieldset className={className}>
      <legend className="t-field text-ink-secondary">{legend}</legend>

      <div className="mt-2.5 flex flex-wrap gap-2">
        {[...options, auth.otherOption].map((option) => {
          const id = `${uid}-${option.replace(/\W+/g, "-")}`;
          return (
            <div key={option}>
              <input
                type="radio"
                id={id}
                name={name}
                value={option}
                checked={value === option}
                onChange={() => onChange(option)}
                className="peer sr-only"
              />
              <label
                htmlFor={id}
                className="t-body-sm inline-flex min-h-[38px] cursor-pointer items-center rounded-full border border-line bg-surface px-3.5 text-ink-secondary transition-colors hover:border-line-strong peer-checked:border-accent peer-checked:bg-accent-tint peer-checked:text-accent peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[color:var(--focus)]"
              >
                {option}
              </label>
            </div>
          );
        })}
      </div>

      {isOther ? (
        <div className="mt-3">
          <label htmlFor={`${uid}-other`} className="t-field block text-ink-secondary">
            {otherLabel}
          </label>
          <input
            id={`${uid}-other`}
            name={`${name}-other`}
            type="text"
            /* Focused on reveal. The reader has just said "none of those", so
               the next thing they want is the cursor in the box, and a field
               that appears 200px down the page without focus is a field that
               gets missed. */
            autoFocus
            placeholder={otherPlaceholder}
            value={otherValue}
            onChange={(e) => onOtherChange(e.target.value)}
            className="t-body mt-1.5 h-11 w-full rounded-[var(--radius-control)] border border-line bg-surface px-3 text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/25"
          />
        </div>
      ) : null}
    </fieldset>
  );
}
