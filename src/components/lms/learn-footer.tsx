import Link from "next/link";
import { Container } from "@/components/ui";

/**
 * The footer under a lesson.
 *
 * `SiteFooter` is a sixteen-link marketing sitemap — 335px on desktop, 864px on
 * a phone, which is 37% of the scroll height of a lesson page. Every one of
 * those links leaves the course, and none of them goes anywhere inside the
 * product. Putting it under the screen a learner is meant to be concentrating on
 * is sixteen exits arranged in four columns.
 *
 * So learn mode gets this instead: the legal row that has to appear on every
 * page, and nothing else. The route back into the course is the rail and the
 * pagination, both of which are above this and both of which stay put.
 *
 * `(app)` keeps `SiteFooter` — a dashboard is a place you arrive and choose from,
 * and a sitemap is useful there.
 */
export function LearnFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <Container className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-5">
        <p className="t-meta text-ink-muted">
          &copy; {new Date().getFullYear()} AI Tech Education Academy. A free, non-commercial
          educational project by Roan Weigert.
        </p>
        <nav aria-label="Legal" className="flex items-center gap-5">
          <Link
            href="/terms"
            className="t-meta text-ink-muted no-underline underline-offset-4 hover:text-ink hover:underline"
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            className="t-meta text-ink-muted no-underline underline-offset-4 hover:text-ink hover:underline"
          >
            Privacy
          </Link>
        </nav>
      </Container>
    </footer>
  );
}
