"use client";

import { useId, useState } from "react";
import { CheckCircleIcon, XCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

/**
 * A knowledge check.
 *
 * -------------------------------------------------------------- it grades nothing
 *
 * No server write, no stored score, nothing gated on the result. This exists so
 * a reader can find out whether they followed the last section, which is the
 * only thing retrieval practice needs to do. Making it count would turn a
 * two-second self-check into an assessment, and the product already has an
 * assessment — the module artifact, read by a human.
 *
 * That is also why the answer key riding along in the payload is acceptable: a
 * determined learner can read it in the network tab and has cheated at nothing.
 * The day a quiz gates completion it needs its own table with the key revoked
 * and grading behind a SECURITY DEFINER function, and that is a different
 * feature.
 *
 * ------------------------------------------------------- one radio group per question
 *
 * Every group is named `${uid}-${question.id}`. This repo has already shipped
 * the other version: the judge's rubric gave all five criteria `name="score"`,
 * which made them one HTML radio group, so a judge scoring four criteria filed
 * one score on the wrong criterion and the other three silently vanished. It
 * was found three times independently in review. `useId` also keeps two quiz
 * blocks on the same lesson from colliding.
 */
export function QuizBlock({
  title,
  questions,
}: {
  title: string | null;
  questions: readonly { id: string; q: string; choices: readonly string[]; answer: string; why?: string }[];
}) {
  const uid = useId();
  const [picked, setPicked] = useState<Record<string, string>>({});

  return (
    <section className="rounded-[var(--radius-feature)] border border-line bg-surface-subtle p-5">
      <h2 className="t-h3 text-ink">{title ?? "Check yourself"}</h2>
      <p className="t-meta mt-1 text-ink-muted">
        Nothing here is recorded. It is a check for you.
      </p>

      <ol className="mt-5 flex flex-col gap-6">
        {questions.map((question, qi) => {
          const chosen = picked[question.id];
          const correct = chosen === question.answer;

          return (
            <li key={question.id}>
              <fieldset>
                <legend className="t-body-sm font-medium text-ink">
                  {qi + 1}. {question.q}
                </legend>

                <div className="mt-3 flex flex-col gap-1.5">
                  {question.choices.map((choice) => {
                    const isChosen = chosen === choice;
                    const isAnswer = choice === question.answer;
                    const settled = chosen !== undefined;

                    return (
                      <label
                        key={choice}
                        className={cn(
                          "flex min-h-[44px] cursor-pointer items-center gap-3 rounded-[var(--radius-control)] border px-3.5 transition-colors",
                          settled && isAnswer
                            ? "border-[var(--state-open)] bg-state-open-surface"
                            : settled && isChosen
                              ? "border-danger"
                              : "border-line-control hover:border-accent",
                        )}
                      >
                        <input
                          type="radio"
                          name={`${uid}-${question.id}`}
                          value={choice}
                          checked={isChosen}
                          onChange={() =>
                            setPicked((p) => (p[question.id] ? p : { ...p, [question.id]: choice }))
                          }
                          className="size-4 flex-none accent-[var(--accent)]"
                        />
                        <span className="t-body-sm text-ink">{choice}</span>
                        {settled && isAnswer ? (
                          <CheckCircleIcon
                            size={17}
                            weight="fill"
                            className="ml-auto text-[var(--state-open)]"
                            aria-label="Correct answer"
                          />
                        ) : null}
                        {settled && isChosen && !isAnswer ? (
                          <XCircleIcon
                            size={17}
                            weight="fill"
                            className="ml-auto text-danger"
                            aria-label="Your answer, incorrect"
                          />
                        ) : null}
                      </label>
                    );
                  })}
                </div>

                {/*
                  Present in the DOM from first paint with `aria-live`, empty
                  until there is something to say. A live region created at the
                  moment it fills is not reliably announced — the screen reader
                  has to have been watching it.
                */}
                <p role="status" aria-live="polite" className="t-body-sm mt-2.5 text-ink-secondary">
                  {chosen === undefined
                    ? ""
                    : correct
                      ? (question.why ?? "That is the one.")
                      : `Not quite. ${question.why ?? `The answer is "${question.answer}".`}`}
                </p>
              </fieldset>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
