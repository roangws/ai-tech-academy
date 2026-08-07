import { SealCheckIcon } from "@phosphor-icons/react/dist/ssr";
import { outcomes } from "@/lib/content";

/**
 * The outcome sheet, in markup.
 *
 * This was a 1200x750 JPEG with the figures baked into the pixels: soft on a
 * retina screen, impossible to select or translate, silent to a screen reader,
 * fixed at one width, and needing a re-export to change a single number. It is
 * the most convincing object on the page, so it is worth having as real
 * elements.
 *
 * Each row now draws its after value as a fraction of its before value, and
 * states the reduction. This is the most persuasive object on the page and it
 * had been asking a reader to divide 40 minutes by six hours in their head to
 * see it. Both the bar and the percentage are computed from the two figures
 * already printed on the row, so the sheet claims nothing it was not claiming
 * before; it just stops making the reader do the arithmetic.
 *
 * The bar is decorative and marked so. Screen readers get the table, which
 * carries the same information with more precision than a bar can.
 *
 * The after column runs in --accent and both figure columns use tabular
 * numerals, so the before and after values line up down the sheet.
 */
export function OutcomeSheet() {
  const { sheet } = outcomes;

  return (
    <figure className="m-0 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-e1">
      <div className="border-b border-line px-4 pb-3.5 pt-3.5 md:px-5 md:pb-4 md:pt-4">
        <p className="t-label text-ink-muted">{sheet.label}</p>
        <h3 className="t-h3 mt-1.5 text-ink">{sheet.title}</h3>
        <p className="t-meta mt-1 text-ink-muted">
          {sheet.meta.map((m, i) => (
            <span key={m}>
              {i > 0 ? <span className="px-1.5 text-line-strong">&middot;</span> : null}
              {m}
            </span>
          ))}
        </p>
      </div>

      <table className="w-full border-collapse">
        <caption className="sr-only">
          {sheet.title}: measures recorded before and after deployment
        </caption>
        <thead>
          <tr>
            <th scope="col" className="t-field px-5 py-2.5 text-left text-ink-muted">
              {sheet.columns.measure}
            </th>
            <th scope="col" className="t-field px-3 py-2.5 text-right text-ink-muted">
              {sheet.columns.before}
            </th>
            <th scope="col" className="t-field px-5 py-2.5 text-right text-ink-muted">
              {sheet.columns.after}
            </th>
          </tr>
        </thead>
        <tbody>
          {sheet.rows.map((r) => {
            const share = r.n.after / r.n.before;
            const cut = Math.round((1 - share) * 100);

            return (
              <tr key={r.measure} className="border-t border-line">
                <th scope="row" className="px-5 py-3 text-left font-normal">
                  <span className="t-body-sm block text-ink">{r.measure}</span>

                  {/*
                    The track is the before value at full width and the fill is
                    the after value against it, so three rows at three different
                    scales stay comparable: every bar answers the same question,
                    which is how much of the original is left. A shared absolute
                    scale would put "3 people" and "360 minutes" on one axis and
                    flatten two of the three rows to nothing.
                  */}
                  <span
                    aria-hidden="true"
                    className="mt-2 flex items-center gap-2.5 pr-1"
                  >
                    <span className="block h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                      <span
                        className="block h-full rounded-full bg-accent"
                        style={{ width: `${Math.max(share * 100, 3)}%` }}
                      />
                    </span>
                    <span className="t-micro flex-none tabular-nums text-ink-muted">
                      {cut}% less
                    </span>
                  </span>
                </th>
                <td className="t-figure px-3 py-3 text-right align-top font-normal text-ink-muted">
                  {r.before}
                </td>
                <td className="t-figure px-5 py-3 text-right align-top text-accent">{r.after}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line px-5 pb-4 pt-3.5">
        {/*
          Neutral, on purpose. Green is reserved for one meaning on this page,
          a module that is open to everyone, and roughly ten green chips carry it
          above this point. An eleventh green chip saying something unrelated
          costs the other ten their meaning.
        */}
        <span className="t-meta inline-flex items-center gap-1.5 rounded-[6px] bg-surface-subtle px-2.5 py-1 font-semibold text-ink-secondary">
          <SealCheckIcon size={14} weight="regular" className="flex-none text-ink" />
          {sheet.status}
        </span>
        <span className="t-micro text-ink-muted">{sheet.footnote}</span>
      </figcaption>
    </figure>
  );
}
