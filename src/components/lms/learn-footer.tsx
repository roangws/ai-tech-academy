import Link from "next/link";
import { Container } from "@/components/ui";

export function LearnFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <Container className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-5">
        <p className="t-meta text-ink-muted">
          &copy; {new Date().getFullYear()} AI Tech Education Academy. A non-commercial
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
