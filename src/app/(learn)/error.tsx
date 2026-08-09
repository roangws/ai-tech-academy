"use client";

import Link from "next/link";
import { Container } from "@/components/ui";

/**
 * When something in the LMS throws.
 *
 * ------------------------------------------------------------- why it exists
 *
 * There was no error boundary anywhere in the app. Every page under `(app)` is
 * force-dynamic and makes two to six database round trips, and the query layer
 * now throws on a failed read rather than rendering an empty list as fact — so
 * without this, a transient Supabase failure produced Next's unbranded 500 with
 * no header, no footer and no way back into the site.
 *
 * A client component, because that is what an error boundary has to be.
 *
 * The message is deliberately not `error.message`. Those strings are written for
 * whoever is reading the logs — "sheets for review: JWT expired" — and a reader
 * cannot act on any of them. `digest` is the one thing worth showing, because it
 * is the id that ties this screen to the log line.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Container className="py-20 md:py-28">
      <div className="max-w-[52ch]">
        <p className="t-label text-ink-muted">Something went wrong</p>
        <h1 className="t-h2 mt-2 text-ink">This page broke.</h1>
        <p className="t-body mt-3 text-ink-secondary">
          It failed to build this time. Everything you have saved is intact: your progress,
          your artifacts and your outcome sheets live on the server, and this screen leaves
          them exactly as they were.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
          <button
            type="button"
            onClick={reset}
            className="t-button h-11 rounded-[var(--radius-control)] bg-accent px-5 text-on-accent transition-colors hover:bg-accent-hover"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="t-button text-ink-secondary no-underline underline-offset-4 hover:text-ink hover:underline"
          >
            Back to your courses
          </Link>
        </div>

        {error.digest ? (
          <p className="t-micro mt-8 text-ink-muted">Reference {error.digest}</p>
        ) : null}
      </div>
    </Container>
  );
}
