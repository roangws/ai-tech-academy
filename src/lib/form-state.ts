/**
 * What an action answers a form with.
 *
 * ------------------------------------------------------ why this is its own file
 *
 * It was declared in `components/lms/admin-form.tsx` beside the component that
 * renders it, which reads well and broke the build. That file is `"use client"`,
 * so importing the type from `app/actions/catalog.ts` — a `"use server"` module —
 * pulled a client module into the server action graph, and the whole site 500'd
 * with "You're importing a module that depends on next/headers … but you are
 * using it in the Pages Router". A misleading message for what it is: two
 * environments joined by an import that only ever carried a type.
 *
 * `import type` is not enough on its own here, because the boundary is resolved
 * by the module graph rather than by what the import is used for. A file with no
 * directive belongs to neither side and can be read by both.
 *
 * ------------------------------------------------------------------ the contract
 *
 * `error` is something the author can fix and is rendered on the form, with
 * every field they typed still in place. `ok` is a save that landed.
 *
 * Anything else still THROWS, and goes to the route's error boundary — a policy
 * refusal, a dropped connection, a constraint nobody anticipated. Two channels
 * with two meanings: this one is an answer, that one is a failure.
 */
export type FormState = { error?: string; ok?: string } | null;
