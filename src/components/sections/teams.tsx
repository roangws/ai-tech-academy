import { ArrowRightIcon, CalendarBlankIcon } from "@phosphor-icons/react/dist/ssr";
import { ButtonLink, Photo, Section } from "@/components/ui";
import { cta, teams } from "@/lib/content";

/**
 * Learning as a team. One inset dark panel, photograph and all.
 *
 * Compressed on this pass. It was four stacked blocks: a headline, three
 * pseudo-steps, a photograph and a launch table, running roughly 700px to make
 * a single point. content.ts has the note on the copy, including the line that
 * caused most of the confusion, which was calling three things "steps" directly
 * under a headline about the five-step method.
 *
 * The structure that replaced it is a two-column panel with no padding of its
 * own: the photograph is a full-height column on the left, and the right column
 * carries the sentence, the launch table and the control. That is what took the
 * height out. Stacking the frame above the table made the right column two
 * objects tall against a left column of one, which is the imbalance the last
 * pass had to prop up with an `mt-auto` on the button; side by side, the
 * photograph simply takes whatever height the content sets and the problem
 * stops existing.
 *
 * Below lg the photograph goes back on top at 21:9, because a full-height image
 * column at 390px is a stripe.
 *
 * The section runs `compressed`, at 40/40 rather than 64/64. The panel carries
 * its own generous inner padding, so the band around it was spending another
 * 128px to separate a self-contained object from two hairlines.
 *
 * Refinements kept from earlier reviews: the table states "Ships" once as a
 * column header rather than repeating it on all three rows below the AA
 * contrast floor, and the panel is a designed artifact rather than a
 * screenshot, so its figures stay selectable and translatable.
 */
export function Teams() {
  return (
    <Section id="teams" compressed>
      <div className="overflow-hidden rounded-[var(--radius-feature)] bg-ink-band">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
          {/*
            The photograph column, recut.

            It was a 420px slot holding a 4:3 frame at `object-[center_35%]`, and
            at that width the crop landed between the two people on the left and
            the one on the right: the near subject was sliced down the middle by
            the panel edge and the group the frame is of was no longer in it.
            A photograph of three people around a table needs the table.

            Two changes. The column is wider, at 460px, and the crop moved to
            `center 42%` which is where the three heads actually sit. And the
            seam is a real fade now rather than a wash with a hard edge: the old
            version put a flat 20% ink over the whole frame and then a gradient
            that reached 90% at the inner edge, so the photograph ended in a
            visible vertical band against a panel that was already that colour.
            One gradient, running from clear at the outer edge to the panel's own
            ink at the inner one, dissolves the join instead of drawing it.
          */}
          <figure className="relative m-0 aspect-[16/8] sm:aspect-[21/9] lg:aspect-auto lg:h-full lg:min-h-[460px]">
            <Photo
              image={teams.image}
              width={1200}
              height={1400}
              sizes="(max-width: 1024px) 100vw, 460px"
              className="object-[center_42%]"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-linear-to-t from-[rgb(13_26_34/0.92)] via-[rgb(13_26_34/0.30)] via-55% to-[rgb(13_26_34/0.12)] lg:bg-linear-to-r lg:from-[rgb(13_26_34/0.12)] lg:via-[rgb(13_26_34/0.30)] lg:to-[rgb(13_26_34)]"
            />
          </figure>

          <div className="p-5 md:p-8 lg:p-10">
            <p className="t-label text-white/60">{teams.label}</p>
            <h2 className="t-h2 mt-2 max-w-[20ch] text-white">{teams.headline}</h2>
            <p className="t-body mt-3 max-w-[62ch] text-[#c3d2dc]">{teams.intro}</p>

            {/* Designed artifact rather than a photograph. */}
            <figure className="m-0 mt-6 overflow-hidden rounded-[var(--radius-card)] border border-white/18 bg-white/[0.045] md:mt-7">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/18 px-4 py-3 md:px-5 md:py-3.5">
                <div>
                  <p className="t-label text-white/60">{teams.panel.label}</p>
                  <h3 className="t-card-title mt-1 text-white">{teams.panel.title}</h3>
                </div>
                <span className="t-meta inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-white">
                  <CalendarBlankIcon size={14} weight="regular" className="flex-none" />
                  {teams.panel.date}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 border-b border-white/12 px-5 py-2">
                <span className="t-field text-white/60">{teams.panel.columns.who}</span>
                <span className="t-field text-white/60">{teams.panel.columns.ships}</span>
              </div>

              <ul>
                {teams.panel.seats.map((s) => (
                  <li
                    key={s.who}
                    className="flex items-center gap-3 border-b border-white/[0.08] px-5 py-2.5 last:border-b-0"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="t-card-title block truncate text-white">{s.who}</span>
                      <span className="t-meta block text-[#9db0bd]">{s.path}</span>
                    </span>
                    <span className="t-meta flex-none text-right text-[#c3d2dc]">{s.ships}</span>
                  </li>
                ))}
              </ul>

              <figcaption className="t-micro border-t border-white/12 px-5 pb-3.5 pt-3 text-[#8fa3b1]">
                {teams.panel.footnote}
              </figcaption>
            </figure>

            <ButtonLink href="#paths" tone="onDark" size="md" className="mt-6 md:mt-7">
              {cta.compare}
              <ArrowRightIcon size={14} weight="bold" />
            </ButtonLink>
          </div>
        </div>
      </div>
    </Section>
  );
}
