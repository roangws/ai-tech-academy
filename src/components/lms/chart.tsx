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
 * `sub` draws a second, quieter bar behind the first — used for "signed up"
 * against "came back", where the pair is the interesting shape and two separate
 * charts would make the reader hold one in their head.
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

      <div className="mt-5 flex h-[132px] items-end gap-1.5">
        {bars.map((bar) => (
          <div key={bar.label} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
            <span className="t-meta tabular-nums text-ink-secondary">{bar.value || ""}</span>
            <div className="relative flex w-full justify-center" style={{ height: 88 }}>
              {bar.sub !== undefined ? (
                <span
                  aria-hidden="true"
                  style={{ height: `${(bar.sub / peak) * 100}%` }}
                  className="absolute bottom-0 w-full rounded-t-[3px] bg-surface-sunken"
                />
              ) : null}
              <span
                aria-hidden="true"
                style={{ height: `${(bar.value / peak) * 100}%` }}
                className={cn(
                  "absolute bottom-0 w-full rounded-t-[3px]",
                  bar.value === 0 ? "bg-transparent" : "bg-accent",
                )}
              />
            </div>
            <span className="t-micro w-full truncate text-center text-ink-muted">{bar.label}</span>
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
