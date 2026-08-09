import { Container } from "@/components/ui";

/**
 * The gap between pressing a link and the server answering.
 *
 * Every route under `(app)` is force-dynamic and makes several database round
 * trips, and with no `loading.tsx` the browser showed the previous page until
 * the new one was fully rendered — so on a slow connection a reader pressing
 * "Continue" got no feedback at all and pressed it again.
 *
 * A skeleton rather than a spinner, and shaped like the page that is coming:
 * a title, a paragraph, then cards. A spinner says "wait"; a skeleton says what
 * you are waiting for, and it does not reflow the layout when the real content
 * lands on top of it.
 *
 * `aria-hidden` with an `sr-only` live message, because the visual placeholder
 * is meaningless to a screen reader and eight pulsing rectangles announced as
 * separate regions is worse than silence.
 */
export default function AppLoading() {
  return (
    <Container className="py-12 md:py-16">
      <p className="sr-only" role="status">
        Loading
      </p>

      <div aria-hidden="true" className="animate-pulse">
        <div className="h-9 w-[38ch] max-w-full rounded bg-surface-sunken" />
        <div className="mt-4 h-5 w-[52ch] max-w-full rounded bg-surface-subtle" />

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-[var(--radius-feature)] border border-line p-6">
              <div className="flex items-start gap-4">
                <div className="size-11 flex-none rounded-[var(--radius-card)] bg-surface-sunken" />
                <div className="min-w-0 flex-1">
                  <div className="h-3 w-20 rounded bg-surface-subtle" />
                  <div className="mt-2 h-5 w-[24ch] max-w-full rounded bg-surface-sunken" />
                </div>
              </div>
              <div className="mt-6 h-1.5 w-full rounded-full bg-surface-subtle" />
              <div className="mt-5 h-4 w-[30ch] max-w-full rounded bg-surface-subtle" />
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
