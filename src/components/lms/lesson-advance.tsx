"use client";

import { useActionState, useOptimistic } from "react";
import Link from "next/link";
import { ArrowRightIcon, CheckIcon, CircleNotchIcon } from "@phosphor-icons/react/dist/ssr";
import { toggleLesson, type ToggleState } from "@/app/actions/lms";

/**
 * Finishing a lesson, and getting to the next one.
 *
 * ------------------------------------------------------------ the third design
 *
 * This control has been wrong twice and the two failures are opposites, so it is
 * worth writing down what each got right before this one is judged.
 *
 * It began as "Complete and continue": one press, mark done, redirect. The write
 * landed every time — verified in Postgres — and Roan reported it as the button
 * not working, because the page you arrive on says nothing about the lesson you
 * just finished. The tick moved in a syllabus rail 300px away, inside a
 * `<details>` that is collapsed below `lg`. That is not an acknowledgement.
 *
 * The fix was to split it: one control to complete, a second to move on. That
 * cured the symptom by deleting the navigation, and left the actual defect
 * untouched — still nothing acknowledged the completion. It also introduced
 * three new problems. The forward control only rendered once `done` was true, so
 * a reader who had not ticked had no primary next step at all, and a signed-out
 * reader — every visitor to the free module 1, which is the entire funnel — could
 * never have one. It cost a second round trip for the common case. And the tick
 * button flipped in place to "Mark as not done", so the second press of an
 * impatient double-press silently untickeded the lesson.
 *
 * So: one press again, and the acknowledgement is on the destination. The lesson
 * page reads `?from=` and names what was just finished, with an undo. Completing
 * and advancing are one intention and they are one control; what was missing was
 * never a second button.
 *
 * ----------------------------------------------------------------- optimistic
 *
 * `useOptimistic` for the "stay" path. The measured server time for a press is
 * around 250ms after the region move and the RPC, and the honest answer is that
 * none of it needs to be waited for: `done` is a boolean whose next value the
 * client already knows. The tick flips on the next frame and the server
 * confirms behind it.
 *
 * `pending` disables the primary, which is not decoration. Next dispatches
 * server actions one at a time per client, so a second impatient click does not
 * race the first — it QUEUES behind it and doubles the wait. That is the
 * mechanism that turned a 1.2 second press into the ten seconds Roan reported.
 */
export function LessonAdvance({
  lessonId,
  slug,
  n,
  lessonSlug,
  done,
  next,
  artifact,
}: {
  lessonId: string;
  slug: string;
  n: string;
  lessonSlug: string;
  done: boolean;
  /** The next lesson in this module, or null on the last one. */
  next: { slug: string; name: string } | null;
  /** What this module produces, for the last lesson's hand-off. */
  artifact: string;
}) {
  const [state, formAction, pending] = useActionState<ToggleState, FormData>(toggleLesson, null);
  const [optimisticDone, setOptimisticDone] = useOptimistic(done);

  /* Where "next" goes. On the last lesson of a module that is the hand-in rather
     than the following module: every module ends in an artifact, and a learner
     who never writes one reaches the end of the course with nothing for the
     outcome sheet to be built from. */
  const forwardHref = next
    ? `/learn/${slug}/${n}/${next.slug}`
    : `/learn/${slug}/${n}#artifact-heading`;
  const forwardLabel = next
    ? `Next lesson: ${next.name}`
    : artifact
      ? `Write your ${artifact.toLowerCase()}`
      : "Finish the module";

  const primary =
    "t-button inline-flex h-11 items-center gap-2 rounded-[var(--radius-control)] bg-accent px-5 text-on-accent no-underline transition-colors hover:bg-accent-hover disabled:opacity-70";
  const quiet =
    "t-button inline-flex min-h-[44px] items-center gap-2 rounded-[var(--radius-control)] border border-line-control px-4 text-ink-secondary transition-colors hover:border-line-strong hover:text-ink disabled:opacity-70";

  /* Already finished, or finished a moment ago. The forward control is a link
     rather than a submit — there is nothing left to write — and undo is a
     separate element in a separate place, never the button the primary just
     was. */
  if (optimisticDone) {
    return (
      <div className="mt-10 border-t border-line pt-6">
        <div className="flex flex-wrap items-center gap-4">
          <Link href={forwardHref} className={primary}>
            {forwardLabel}
            <ArrowRightIcon size={15} weight="bold" aria-hidden="true" />
          </Link>

          <form action={formAction}>
            <Fields {...{ lessonId, slug, n, lessonSlug }} done intent="stay" />
            <button type="submit" disabled={pending} className={quiet}>
              {pending ? (
                <CircleNotchIcon size={15} className="animate-spin" aria-hidden="true" />
              ) : null}
              {pending ? "Saving…" : "Mark as not done"}
            </button>
          </form>
        </div>

        {/* The accent, not green. `state-open` is semantic — it means a module is
            open without an account — and this file's sibling records the rule:
            green is never success decoration. Completion is the accent. */}
        <p className="t-body-sm mt-3 inline-flex items-center gap-1.5 text-ink-secondary">
          <CheckIcon size={15} weight="bold" aria-hidden="true" className="text-accent" />
          {state?.message ?? "Done. It is saved to your account."}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 border-t border-line pt-6">
      <form
        action={(formData) => {
          /* Only the "stay" press flips optimistically. "advance" navigates, and
             flipping a control the reader is about to leave behind is a frame of
             flicker for nothing. */
          if (formData.get("intent") === "stay") setOptimisticDone(true);
          formAction(formData);
        }}
        className="flex flex-wrap items-center gap-x-4 gap-y-3"
      >
        <Fields {...{ lessonId, slug, n, lessonSlug }} done={false} />
        <input type="hidden" name="then" value={next ? forwardHref : ""} />

        <div>
          <button
            type="submit"
            name="intent"
            value="advance"
            disabled={pending}
            className={primary}
          >
            {pending ? (
              <CircleNotchIcon size={15} className="animate-spin" aria-hidden="true" />
            ) : (
              <CheckIcon size={15} weight="bold" aria-hidden="true" />
            )}
            {pending
              ? "Saving…"
              : next
                ? "Complete and open the next lesson"
                : artifact
                  ? `Complete and write your ${artifact.toLowerCase()}`
                  : "Complete and finish the module"}
            <ArrowRightIcon size={15} weight="bold" aria-hidden="true" />
          </button>
          {/* Name the destination. "Continue" is contextual and tells a reader
              nothing about where they are going. */}
          <span className="t-meta mt-1.5 block text-ink-muted">
            {next ? `Next: ${next.name}` : `Last lesson in module ${n}.`}
          </span>
        </div>

        <button
          type="submit"
          name="intent"
          value="stay"
          disabled={pending}
          className={quiet}
        >
          Mark done without leaving
        </button>
      </form>
    </div>
  );
}

function Fields({
  lessonId,
  slug,
  n,
  lessonSlug,
  done,
  intent,
}: {
  lessonId: string;
  slug: string;
  n: string;
  lessonSlug: string;
  done: boolean;
  intent?: string;
}) {
  return (
    <>
      <input type="hidden" name="lessonId" value={lessonId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="n" value={n} />
      <input type="hidden" name="lessonSlug" value={lessonSlug} />
      <input type="hidden" name="done" value={String(done)} />
      {intent ? <input type="hidden" name="intent" value={intent} /> : null}
    </>
  );
}
