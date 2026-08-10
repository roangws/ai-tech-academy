/**
 * Two charts, drawn in CSS. No library.
 *
 * A charting package is 40–120KB of client JavaScript to draw shapes whose
 * values are already known on the server. These render as plain elements in the
 * server pass, so the admin console ships no chart code at all, works with
 * JavaScript off, and picks up the dark theme for free because the bars are
 * painted with the same tokens as everything else.
 *
 * Both carry their numbers as text as well as height. A bar a reader has to
 * measure against an axis is a bar that needs an axis; a bar with the figure on
 * it does not, and it is the only version that works for somebody using a screen
 * reader.
 */

import { cn } from "@/lib/utils";

/* --------------------------------------------------------------- bar column */

export type Bar = { label: string; value: number; sub?: number };

/**
 * A column chart over time.
 *
 * `sub` draws a second, quieter bar behind the first, used for "signed up" against
 * "came back", where the pair is the interesting shape and two separate charts would
 * make the reader hold one in their head.
 *
 * ------------------------------------------------------------ THE LABELS FIT NOW
 *
 * Roan's screenshot of "Who arrived, and who came back": twelve x-axis labels reading
 * "25 ...", "8 J...", "15 ...", "22 ...". Every one truncated, so the chart had no
 * usable axis at all, and the report was simply "data not visible".
 *
 * The cause was `truncate` on a label in a column that is a twelfth of the card.
 * Twelve weekly labels at "25 May" need about 44px each; at two columns on a 1280
 * screen the card is roughly 600px wide, so each column is 48px minus the gap. It was
 * always going to be one character short, and `truncate` hid that by design.
 *
 * Three changes, and the first is the one that matters:
 *
 *   1. THE LABEL IS ROTATED, not shrunk. Rotating 45 degrees takes the label out of
 *      the column's width budget entirely, so it can be as long as it likes at any
 *      column count. This is what an axis on a dense time series normally does, and it
 *      is the only fix that does not degrade as weeks are added.
 *   2. `whitespace-nowrap` replaces `truncate`. A rotated label has no width to
 *      truncate against, and leaving `truncate` on would clip it against a box that no
 *      longer describes it.
 *   3. A ZERO ROW STILL DRAWS. `bar.value === 0` painted a transparent bar and printed
 *      an empty string for its figure, so eleven of Roan's twelve weeks were blank
 *      space with no indication they were weeks at all rather than missing data. A
 *      2px stub on the baseline and a muted "0" say "measured, and it was none",
 *      which is a different claim from saying nothing.
 */
export function BarChart({
  bars,
  caption,
  unit = "",
  className,
}: {
  bars: readonly Bar[];
  caption: string;
  unit?: string;
  className?: string;
}) {
  const peak = Math.max(1, ...bars.map((b) => Math.max(b.value, b.sub ?? 0)));

  return (
    <figure className={cn("rounded-[var(--radius-feature)] border border-line bg-surface p-5", className)}>
      <figcaption className="t-card-title text-ink">{caption}</figcaption>

      {/* `pb-9` reserves the room the rotated labels hang into. Without it they
          overlap whatever follows the figure, which on the admin overview is the
          paragraph explaining what the two bars mean. */}
      <div className="mt-5 flex h-[132px] items-end gap-1.5 pb-9">
        {bars.map((bar) => (
          <div key={bar.label} className="flex min-w-0 flex-1 flex-col items-center justify-end">
            <div className="relative flex w-full justify-center" style={{ height: 112 }}>
              {/*
                THE FIGURE SITS ON TOP OF ITS OWN BAR, and it was a fixed row above
                the plot.

                As a flex child above a fixed-height bar box, every figure landed on
                one line at the top of the chart whatever its bar did — so twelve weeks
                of mostly-zero data read as a header row of numbers with an unrelated
                column underneath, which is half of why Roan could not see the data.
                Positioned from the bottom by the same percentage the bar uses, each
                number rides its own column.

                `bottom` is the bar's own height plus 4px of air, and the zero case is
                pinned to the 2px stub rather than computed, so a zero label does not
                sit on the baseline.
              */}
              <span
                style={{ bottom: bar.value === 0 ? 8 : `calc(${(bar.value / peak) * 100}% + 4px)` }}
                className={cn(
                  "t-meta absolute tabular-nums leading-none",
                  bar.value === 0 ? "text-ink-muted/60" : "text-ink-secondary",
                )}
              >
                {bar.value}
              </span>
              {bar.sub !== undefined ? (
                <span
                  aria-hidden="true"
                  style={{ height: `${(bar.sub / peak) * 100}%` }}
                  className="absolute bottom-0 w-full rounded-t-[3px] bg-surface-sunken"
                />
              ) : null}
              <span
                aria-hidden="true"
                /* A 2px stub for a zero week, so the column reads as a measured
                   nothing rather than as a gap in the data. */
                style={{ height: bar.value === 0 ? 2 : `${(bar.value / peak) * 100}%` }}
                className={cn(
                  "absolute bottom-0 w-full rounded-t-[3px]",
                  bar.value === 0 ? "bg-line-strong" : "bg-accent",
                )}
              />
            </div>
            {/*
              Rotated out of the column's width budget. `origin-top-right` with a
              `translate-x-1/2` puts the label's right end under the centre of its own
              bar, which is where an eye looks for it; rotating about the centre walks
              the whole run left as the labels lengthen.

              `absolute`, so the rotated box contributes no layout height and the
              columns stay the same height whatever the labels say. The `pb-9` on the
              row above is what holds the space for them.
            */}
            <span className="relative block h-0 w-full">
              <span className="t-micro absolute right-1/2 top-1 origin-top-right translate-x-1/2 -rotate-45 whitespace-nowrap text-ink-muted">
                {bar.label}
              </span>
            </span>
          </div>
        ))}
      </div>

      {/* The same data as a sentence, for anything that cannot read a bar. */}
      <p className="sr-only">
        {bars.map((b) => `${b.label}: ${b.value}${unit}`).join(". ")}
      </p>
    </figure>
  );
}

/* ------------------------------------------------------------------- funnel */

export type FunnelStep = { label: string; value: number };

/**
 * A drop-off curve as horizontal bars.
 *
 * The admin overview drew this as a row of bare numbers across eight columns,
 * which is a table pretending to be a chart: the shape of the drop is the entire
 * point and a reader had to derive it. Each bar is a proportion of the first
 * step, so the fall is visible without an axis, and the percentage is printed
 * because "half" and "48%" are different claims.
 */
export function Funnel({
  steps,
  caption,
  className,
}: {
  steps: readonly FunnelStep[];
  caption: string;
  className?: string;
}) {
  const first = Math.max(1, steps[0]?.value ?? 1);

  return (
    <figure className={cn("rounded-[var(--radius-feature)] border border-line bg-surface p-5", className)}>
      <figcaption className="t-card-title text-ink">{caption}</figcaption>

      <ul className="mt-4 flex flex-col gap-2">
        {steps.map((step) => {
          const pct = Math.round((step.value / first) * 100);
          return (
            <li key={step.label} className="flex items-center gap-3">
              <span className="t-meta w-[52px] flex-none text-ink-muted">{step.label}</span>
              <span className="relative h-6 flex-1 overflow-hidden rounded-[4px] bg-surface-sunken">
                <span
                  aria-hidden="true"
                  style={{ width: `${Math.max(step.value === 0 ? 0 : 2, pct)}%` }}
                  className="absolute inset-y-0 left-0 rounded-[4px] bg-accent"
                />
              </span>
              <span className="t-meta w-20 flex-none text-right tabular-nums text-ink-secondary">
                {step.value}
                <span className="text-ink-muted"> · {pct}%</span>
              </span>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
