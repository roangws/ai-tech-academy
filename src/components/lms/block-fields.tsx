"use client";

import { useState } from "react";
import { PlusIcon, TrashIcon } from "@phosphor-icons/react/dist/ssr";
import { RichText } from "@/components/lms/rich-text";

/**
 * Real inputs for every block kind, instead of a JSON textarea.
 *
 * ------------------------------------------------------------------ the report
 *
 * The old editor typed six of the eight kinds as "paste JSON here", and the page
 * itself argued for it: "a form that builds a nested array of quiz questions
 * with per-choice inputs is a real piece of software… worth building the day
 * somebody is writing quizzes every morning."
 *
 * That is a defensible trade and it was wrong about which day. Roan's report —
 * "I was not able to find any way to edit this as a final user. That's totally
 * broken" — is what a JSON textarea looks like to the person who owns the
 * product, and it does not become acceptable by being cheap. A console that can
 * only be operated by somebody who can hand-balance a nested array of quoted
 * strings is not a console.
 *
 * So this is that real piece of software. It is about two hundred lines.
 *
 * ----------------------------------------------------- how it reaches the server
 *
 * One hidden `payload` field, holding `JSON.stringify(state)`, and the server
 * action is completely unchanged — it still reads `payload` and still parses it,
 * so the storage format, the CHECK constraints and every renderer under
 * `blocks/` are untouched. What changed is who writes the JSON: a component that
 * cannot produce a trailing comma, rather than a person who can.
 *
 * The hidden field is rendered from state on every keystroke rather than
 * assembled on submit. A submit handler that serialises would have to intercept
 * the form, and these forms are plain `action={serverAction}` posts — no
 * JavaScript in the submit path is the property that makes them work while a
 * bundle is still loading.
 *
 * ---------------------------------------------------------------- ids are stable
 *
 * Quiz questions and checklist steps carry an `id`, and it is generated once
 * when the row is created rather than derived from its index. `block_responses`
 * stores a learner's answers keyed by those ids: deriving them from position
 * would mean inserting a question at the top silently reassigns every learner's
 * answers to the question below the one they answered. It is the same argument
 * the lesson `slug` settles one table up, and the same failure it prevents.
 */

/** A row id that cannot collide within a block and never moves. */
function rowId(prefix: string, taken: string[]): string {
  let n = taken.length + 1;
  while (taken.includes(`${prefix}${n}`)) n += 1;
  return `${prefix}${n}`;
}

const input =
  "t-body-sm h-10 w-full rounded-[var(--radius-control)] border border-line-control bg-surface px-3 text-ink transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25";
const label = "t-label block text-ink-muted";
const rowBox = "rounded-[var(--radius-control)] border border-line bg-surface-subtle p-3";
const iconButton =
  "grid size-9 flex-none place-items-center rounded-[var(--radius-control)] border border-line-control text-ink-secondary transition-colors hover:border-danger hover:text-danger";
const addButton =
  "t-meta inline-flex min-h-[36px] items-center gap-1.5 rounded-[var(--radius-control)] border border-dashed border-line-control px-3 text-ink-secondary transition-colors hover:border-accent hover:text-accent";

/* --------------------------------------------------------------------- quiz */

type Question = { id: string; q: string; choices: string[]; answer: string; why?: string };

function QuizFields({ initial }: { initial: Question[] }) {
  const [questions, setQuestions] = useState<Question[]>(
    initial.length ? initial : [{ id: "q1", q: "", choices: ["", ""], answer: "", why: "" }],
  );

  const update = (i: number, patch: Partial<Question>) =>
    setQuestions((qs) => qs.map((q, j) => (j === i ? { ...q, ...patch } : q)));

  return (
    <>
      <input type="hidden" name="payload" value={JSON.stringify({ questions })} />

      <div className="grid gap-3">
        {questions.map((q, i) => (
          <div key={q.id} className={rowBox}>
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <label className={label}>
                  Question {i + 1}
                  <input
                    value={q.q}
                    onChange={(e) => update(i, { q: e.target.value })}
                    placeholder="Which of these is the baseline?"
                    className={`${input} mt-1`}
                  />
                </label>
              </div>
              {questions.length > 1 ? (
                <button
                  type="button"
                  aria-label={`Remove question ${i + 1}`}
                  onClick={() => setQuestions((qs) => qs.filter((_, j) => j !== i))}
                  className={`${iconButton} mt-5`}
                >
                  <TrashIcon size={14} aria-hidden="true" />
                </button>
              ) : null}
            </div>

            <p className={`${label} mt-3`}>Choices, and which one is correct</p>
            <div className="mt-1 grid gap-1.5">
              {q.choices.map((choice, c) => (
                <div key={c} className="flex items-center gap-2">
                  {/*
                    The radio names the ANSWER, and it is scoped per question by
                    including the question id in `name`.

                    HTML groups radios by name within a form, so a shared name
                    across questions makes every radio on the page one group —
                    which is the exact data-corruption bug `saveJudgement` in
                    actions/lms.ts has a forty-line note about. It is worth
                    knowing that this control is not submitted at all: the answer
                    travels in the hidden `payload` above. The radio is the UI for
                    a piece of state, and the scoped name is what stops the
                    browser's own grouping fighting it.
                  */}
                  <input
                    type="radio"
                    name={`answer-${q.id}`}
                    checked={q.answer === choice && choice !== ""}
                    onChange={() => update(i, { answer: choice })}
                    aria-label={`Choice ${c + 1} is correct`}
                    className="size-4 flex-none accent-[color:var(--accent)]"
                  />
                  <input
                    value={choice}
                    onChange={(e) => {
                      const choices = q.choices.map((x, j) => (j === c ? e.target.value : x));
                      /* Retyping the correct choice must carry the answer with
                         it. Without this, fixing a typo in the right answer
                         silently unsets which one is right — the radio still
                         looks checked for a frame and the saved payload has an
                         `answer` matching no choice. */
                      const answer = q.answer === choice ? e.target.value : q.answer;
                      update(i, { choices, answer });
                    }}
                    placeholder={`Choice ${c + 1}`}
                    className={input}
                  />
                  {q.choices.length > 2 ? (
                    <button
                      type="button"
                      aria-label={`Remove choice ${c + 1}`}
                      onClick={() =>
                        update(i, { choices: q.choices.filter((_, j) => j !== c) })
                      }
                      className={iconButton}
                    >
                      <TrashIcon size={13} aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => update(i, { choices: [...q.choices, ""] })}
              className={`${addButton} mt-2`}
            >
              <PlusIcon size={13} aria-hidden="true" />
              Add a choice
            </button>

            <label className={`${label} mt-3`}>
              Why <span className="text-ink-muted">shown after they answer</span>
              <input
                value={q.why ?? ""}
                onChange={(e) => update(i, { why: e.target.value })}
                placeholder="Because the baseline is what you measured before you changed anything."
                className={`${input} mt-1`}
              />
            </label>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() =>
          setQuestions((qs) => [
            ...qs,
            { id: rowId("q", qs.map((q) => q.id)), q: "", choices: ["", ""], answer: "", why: "" },
          ])
        }
        className={`${addButton} mt-3`}
      >
        <PlusIcon size={13} aria-hidden="true" />
        Add a question
      </button>
    </>
  );
}

/* ---------------------------------------------------------------- checklist */

type Step = { id: string; text: string };

function ChecklistFields({ initial }: { initial: Step[] }) {
  const [steps, setSteps] = useState<Step[]>(initial.length ? initial : [{ id: "s1", text: "" }]);

  return (
    <>
      <input type="hidden" name="payload" value={JSON.stringify({ steps })} />

      <div className="grid gap-1.5">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center gap-2">
            <span className="t-meta w-5 flex-none tabular-nums text-ink-muted">{i + 1}.</span>
            <input
              value={step.text}
              onChange={(e) =>
                setSteps((ss) => ss.map((s, j) => (j === i ? { ...s, text: e.target.value } : s)))
              }
              placeholder="Write down the step you are about to automate"
              className={input}
            />
            {steps.length > 1 ? (
              <button
                type="button"
                aria-label={`Remove step ${i + 1}`}
                onClick={() => setSteps((ss) => ss.filter((_, j) => j !== i))}
                className={iconButton}
              >
                <TrashIcon size={13} aria-hidden="true" />
              </button>
            ) : null}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setSteps((ss) => [...ss, { id: rowId("s", ss.map((s) => s.id)), text: "" }])}
        className={`${addButton} mt-2.5`}
      >
        <PlusIcon size={13} aria-hidden="true" />
        Add a step
      </button>
    </>
  );
}

/* ------------------------------------------------- exercise, embed, and media */

function ExerciseFields({ initial }: { initial: { prompt?: string; placeholder?: string } }) {
  const [prompt, setPrompt] = useState(initial.prompt ?? "");
  const [placeholder, setPlaceholder] = useState(initial.placeholder ?? "");

  return (
    <>
      <input type="hidden" name="payload" value={JSON.stringify({ prompt, placeholder })} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={label}>
          Prompt
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Paste your process below and describe where it breaks."
            className={`${input} mt-1`}
          />
        </label>
        <label className={label}>
          Placeholder <span className="text-ink-muted">grey text in the empty box</span>
          <input
            value={placeholder}
            onChange={(e) => setPlaceholder(e.target.value)}
            placeholder="What came back"
            className={`${input} mt-1`}
          />
        </label>
      </div>
    </>
  );
}

function EmbedFields({ initial }: { initial: { src?: string; height?: number } }) {
  const [src, setSrc] = useState(initial.src ?? "");
  const [height, setHeight] = useState(String(initial.height ?? 520));

  return (
    <>
      <input
        type="hidden"
        name="payload"
        /* `Number()` rather than the string: the CHECK constraint on `payload`
           types `height` as a number, and `"520"` is refused with a message
           about a field the author never typed a quote around. */
        value={JSON.stringify({ src, height: Number(height) || 520 })}
      />
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
        <label className={label}>
          Source URL
          <input
            value={src}
            onChange={(e) => setSrc(e.target.value)}
            placeholder="https://www.figma.com/embed?…"
            className={`${input} mt-1`}
          />
        </label>
        <label className={label}>
          Height <span className="text-ink-muted">px</span>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className={`${input} mt-1`}
          />
        </label>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ dispatch */

/**
 * The fields for one block kind.
 *
 * `payload` arrives as whatever is in the column, typed `unknown`, because a row
 * written before a shape settled can be anything. Each reader below narrows it
 * defensively and falls back to an empty form rather than throwing — an editor
 * that crashes on a malformed row is an editor that cannot be used to fix one.
 */
export function BlockFields({
  kind,
  payload,
}: {
  kind: string;
  payload: unknown;
}) {
  const p = (payload ?? {}) as Record<string, unknown>;

  if (kind === "prose") {
    return (
      <RichText
        name="md"
        defaultValue={typeof p.md === "string" ? p.md : ""}
        placeholder={"## What this covers\n\nA paragraph.\n\n- a point\n- another"}
      />
    );
  }

  if (kind === "video") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={label}>
          YouTube id
          <input
            name="youtube_id"
            defaultValue={typeof p.youtube_id === "string" ? p.youtube_id : ""}
            placeholder="dQw4w9WgXcQ"
            className={`${input} mt-1`}
          />
        </label>
        <label className={label}>
          Poster path <span className="text-ink-muted">optional</span>
          <input
            name="poster"
            defaultValue={typeof p.poster === "string" ? p.poster : ""}
            placeholder="posters/gtm/01.jpg"
            className={`${input} mt-1`}
          />
        </label>
      </div>
    );
  }

  if (kind === "audio" || kind === "doc") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={label}>
          Storage path
          <input
            name="path"
            defaultValue={typeof p.path === "string" ? p.path : ""}
            placeholder={kind === "audio" ? "audio/gtm/01-episode.mp3" : "docs/gtm/brief.pdf"}
            className={`${input} mt-1`}
          />
        </label>
        <label className={label}>
          {kind === "audio" ? "Duration in seconds" : "Size in bytes"}{" "}
          <span className="text-ink-muted">optional</span>
          <input
            type="number"
            name={kind === "audio" ? "duration" : "bytes"}
            defaultValue={
              typeof p[kind === "audio" ? "duration" : "bytes"] === "number"
                ? String(p[kind === "audio" ? "duration" : "bytes"])
                : ""
            }
            className={`${input} mt-1`}
          />
        </label>
      </div>
    );
  }

  if (kind === "quiz") {
    return <QuizFields initial={Array.isArray(p.questions) ? (p.questions as Question[]) : []} />;
  }
  if (kind === "checklist") {
    return <ChecklistFields initial={Array.isArray(p.steps) ? (p.steps as Step[]) : []} />;
  }
  if (kind === "exercise") {
    return <ExerciseFields initial={p as { prompt?: string; placeholder?: string }} />;
  }
  if (kind === "embed") {
    return <EmbedFields initial={p as { src?: string; height?: number }} />;
  }

  /* An unknown kind is a row written by a future version of this schema. Showing
     its JSON is the honest fallback — it can still be read and repaired here
     rather than being invisible until somebody opens Postgres. */
  return (
    <label className={label}>
      Payload JSON <span className="text-ink-muted">unrecognised kind “{kind}”</span>
      <textarea
        name="payload"
        rows={5}
        defaultValue={JSON.stringify(payload ?? {}, null, 2)}
        className="t-meta mt-1 w-full rounded-[var(--radius-control)] border border-line-control bg-surface p-3 font-mono text-ink"
      />
    </label>
  );
}
