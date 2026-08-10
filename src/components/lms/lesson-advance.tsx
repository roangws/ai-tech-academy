"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, CheckIcon } from "@phosphor-icons/react/dist/ssr";

/**
 * Finishing a lesson, and getting to the next one.
 *
 * ---------------------------------------------------------------- the fourth design
 *
 * This control has been wrong three times and the history is worth keeping,
 * because each fix created the next failure.
 *
 * 1. "Complete and continue": one press, mark done, redirect. The write landed
 *    every time and Roan reported it as broken, because the page you arrive on
 *    said nothing about the lesson you had just finished.
 * 2. Split in two — one control to complete, one to move on. That cured the
 *    symptom by deleting the navigation and left the real defect untouched. It
 *    also left a signed-out reader, which is every visitor to the free module 1,
 *    with no primary forward control at all.
 * 3. Joined back together, with the acknowledgement moved to the destination via
 *    `?from=`. Correct about where the acknowledgement belongs, and slow: the
 *    press ran a server action that did an RPC, four `revalidatePath` calls and a
 *    `redirect`, all in front of the reader. Roan reported it as taking too long,
 *    and timed against production it was one to two seconds. The screen then
 *    printed three lines about it — "Mark as not done", "Done. It is saved to
 *    your account.", "Next lesson: …" — which is a lot of ceremony for a fact the
 *    reader asserted themselves.
 *
 * ----------------------------------------------------------------- what this does
 *
 * The press navigates. That is the whole idea: completing a lesson and reading
 * the next one are independent, so the second does not queue behind the first.
 * The primary is a `<Link>`, so the router moves on the same frame it is pressed,
 * and the completion is posted to `/api/lesson-progress` on the way out.
 *
 * `keepalive` is what makes "saves the progress regardless" true rather than
 * hopeful. A client-side navigation keeps this JS context alive so an ordinary
 * fetch would finish anyway — but a reader who presses and then immediately
 * closes the tab, or hits back, or follows a link in the rail, would lose it.
 * Completion is a row that exists or does not, so a duplicate delivery is a no-op.
 *
 * `router.refresh()` after the write settles is what reconciles the surfaces that
 * count: the rail's ticks and the module's progress meter. It runs after the
 * navigation, so it costs the reader nothing.
 *
 * ------------------------------------------------------------------ the wording
 *
 * Three lines became one control and one quiet undo. "Done. It is saved to your
 * account." was explaining the product to somebody using it; the tick beside the
 * lesson in the rail says the same thing without a sentence. What survives is the
 * only part a reader cannot see for themselves — a way to take it back.
 */
export function LessonAdvance({
  lessonId,
  courseId,
  slug,
  n,
  done,
  next,
  artifact,
}: {
  lessonId: string;
  courseId: string;
  slug: string;
  n: string;
  done: boolean;
  /** The next lesson in this module, or null on the last one. */
  next: { slug: string; name: string } | null;
  /** What this module produces, for the last lesson's hand-off. */
  artifact: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  /*
    Optimistic, and plain `useState` rather than `useOptimistic`.

    `useOptimistic` reverts its value when the transition that owns it settles,
    which is exactly right for a form action and exactly wrong here: there is no
    action, the write is a background fetch, and the server state this would
    revert to arrives only on the next render of a page the reader has already
    left. The state is seeded from the server's `done` and corrected by
    `router.refresh()`, which is the same reconciliation by a slower and more
    honest route.
  */
  const [ticked, setTicked] = useState(done);
  const [failed, setFailed] = useState(false);

  /* Where "next" goes. On the last lesson of a module that is the hand-in rather
     than the following module: every module ends in an artifact, and a learner
     who never writes one reaches the end of the course with nothing for the
     outcome sheet to be built from. */
  const forwardHref = next
    ? `/learn/${slug}/${n}/${next.slug}`
    : `/learn/${slug}/${n}#artifact-heading`;
  const forwardLabel = next ? `Next: ${next.name}` : artifact ? `Write your ${artifact.toLowerCase()}` : "Finish the module";

  const save = useCallback(
    (wasDone: boolean) => {
      setFailed(false);
      void fetch("/api/lesson-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, courseId, n, done: wasDone }),
        keepalive: true,
      })
        .then((r) => {
          /* The tick is already drawn, so a refusal has to be able to take it
             back. Anything else leaves a learner looking at progress Postgres
             never recorded — the same class of lie the `must()` helper in
             actions/lms.ts exists to prevent. */
          if (!r.ok) {
            setTicked(wasDone);
            setFailed(true);
            return;
          }
          /* Reconcile the rail and the meters. In a transition so it does not
             block the navigation that is already under way. */
          startTransition(() => router.refresh());
        })
        .catch(() => {
          setTicked(wasDone);
          setFailed(true);
        });
    },
    [lessonId, courseId, n, router],
  );

  const primary =
    "t-button inline-flex h-11 items-center gap-2 rounded-[var(--radius-control)] bg-accent px-5 text-on-accent no-underline transition-colors hover:bg-accent-hover";
  const quiet =
    "t-button inline-flex min-h-[44px] items-center gap-2 rounded-[var(--radius-control)] border border-line-control px-4 text-ink-secondary transition-colors hover:border-line-strong hover:text-ink";

  return (
    <div className="mt-10 border-t border-line pt-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        {/*
          ONE CONTROL, AND IT IS A LINK.

          A `<button>` here would have to wait for something before it could
          navigate, which is the defect this design exists to remove. The write
          rides along in `onClick`; the browser follows the href on the same
          frame.

          The label no longer says "Complete and…". A reader at the bottom of a
          lesson pressing the forward control has completed it — that is what
          reaching the bottom and pressing forward means — so naming the
          bookkeeping in the label was the product describing its own database.
          It names the destination instead, which is the thing the reader does
          not know.
        */}
        <Link
          href={forwardHref}
          onClick={() => {
            if (ticked) return;
            setTicked(true);
            save(false);
          }}
          className={primary}
        >
          {forwardLabel}
          <ArrowRightIcon size={15} weight="bold" aria-hidden="true" />
        </Link>

        {/*
          Marking done without leaving, for the reader who wants to stay — and
          the undo, for the one who ticked by accident. One control, because it
          is one fact with two directions, and it is never the button the primary
          just was: an impatient double-press on the primary navigates twice
          rather than un-ticking anything.
        */}
        <button
          type="button"
          aria-pressed={ticked}
          onClick={() => {
            setTicked(!ticked);
            save(ticked);
          }}
          className={quiet}
        >
          {ticked ? (
            <>
              <CheckIcon size={15} weight="bold" aria-hidden="true" className="text-accent" />
              Done
            </>
          ) : (
            "Mark done"
          )}
        </button>
      </div>

      {/* Only ever shown when the write actually failed. Success says nothing,
          because the tick above already did. */}
      {failed ? (
        <p role="alert" className="t-body-sm mt-3 text-danger">
          That did not save. Check your connection and press it again.
        </p>
      ) : null}
    </div>
  );
}
