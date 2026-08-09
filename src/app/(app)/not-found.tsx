import Link from "next/link";
import { Container } from "@/components/ui";

/**
 * A course, module or sheet that is not there.
 *
 * `notFound()` is called in four places across the LMS — an unknown course slug,
 * a module number that does not exist, a sheet outside the reader's seat — and
 * with no `not-found.tsx` under this group every one of them rendered Next's
 * bare 404: no chrome, no navigation, no route back.
 *
 * It lives inside `(app)` so it keeps the app header and footer, which is the
 * whole point. A reader who mistyped a module number wants the module list, and
 * this is the screen that can offer it.
 */
export default function AppNotFound() {
  return (
    <Container className="py-20 md:py-28">
      <div className="max-w-[52ch]">
        <p className="t-label text-ink-muted">Not found</p>
        <h1 className="t-h2 mt-2 text-ink">There is nothing at this address.</h1>
        <p className="t-body mt-3 text-ink-secondary">
          The course, module or sheet you asked for has either moved or belongs to somebody
          else. Both look the same from here on purpose.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
          <Link
            href="/dashboard"
            className="t-button inline-flex h-11 items-center rounded-[var(--radius-control)] bg-accent px-5 text-on-accent no-underline transition-colors hover:bg-accent-hover"
          >
            Your courses
          </Link>
          <Link
            href="/courses"
            className="t-button text-ink-secondary no-underline underline-offset-4 hover:text-ink hover:underline"
          >
            All five courses
          </Link>
        </div>
      </div>
    </Container>
  );
}
