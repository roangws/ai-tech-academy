import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { VideoPlayer } from "@/components/video-player";
import { EnrollButton, Section, SectionHeader, StatusChip } from "@/components/ui";
import { course } from "@/lib/content";

/**
 * The course preview plays here.
 *
 * It leads with the real footage and puts the module outline directly beside
 * it, so the access model reads at a glance: one open module, four behind a
 * free account.
 *
 * Changed on 6 Aug. The poster carries a title card, because the frame alone
 * showed a man pointing off-screen in red light and gave a reader nothing to go
 * on. The includes strip dropped from five columns to three, since at 1216px
 * five columns broke every item onto two ragged lines. And the button reads
 * "Watch module 1" rather than repeating the header's label a third time.
 *
 * ---------------------------------------- ONE SCREEN ON DESKTOP, as of 7 Aug
 *
 * Roan's requirement: the whole section, heading to the last item of the
 * includes strip, has to be readable without scrolling on a desktop. It ran
 * 855px, against roughly 780px of viewport on a 1440 x 900 laptop once the
 * browser has taken its chrome and the sticky header its 72, so a reader always
 * met it in two pieces.
 *
 * 116px came off, and none of it from content. Nothing here says less than it
 * did; five things that were each slightly larger than they needed to be are now
 * the size they need to be:
 *
 *   - `compressed` on the band, 64/64 down to 40/40. This section's own content
 *     is two large rectangles, which do their own separating; the padding was
 *     buying air next to air.
 *   - The columns are even, 1fr and 1fr, rather than 1.15 and 1. The video was
 *     the taller of the two halves at 1.15 and it was setting the row height
 *     while the outline beside it had room to spare, so the wider video was
 *     costing height on both sides of the grid.
 *   - Outline rows 64px to 56px. The tallest row's content is 43px, so 64 was
 *     21px of padding per row, five times over.
 *   - The includes strip comes up 16px closer, and its rows 2px.
 *
 * What was explicitly not done is dropping the includes strip, tightening the
 * type scale, or clipping the outline to four rows. A section that fits on one
 * screen by saying less has not been fixed.
 *
 * Which is why the 7 Aug copy rewrite, whose intro is twice the length of the one
 * it replaced, is paid for with the header's measure rather than with any of the
 * above: `wide` on the SectionHeader below, and the note there on the trade.
 */
export function Course() {
  return (
    <Section id="course" compressed>
      {/* `wide`, and this is the only section that asks for it. The rewritten
          intro is three lines at the default 640px cap and two at 760, and those
          24px are the whole margin this band has left; `SectionHeader` carries the
          note on why the height came from the measure rather than from the padding
          or the outline rows. */}
      <SectionHeader wide label={course.label} heading={course.headline} intro={course.intro} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-8">
        <figure className="m-0 min-w-0">
          <VideoPlayer
            src={course.video.src}
            poster={course.video.poster}
            posterAlt={course.video.posterAlt}
            card={course.video.card}

          />
          <figcaption className="t-meta mt-2 text-ink-muted">
            {course.video.caption}
          </figcaption>
        </figure>

        <div className="min-w-0">
          {/*
            No "Module outline" label, and this is the fix for the thing Roan
            could not name.

            It was `t-meta` at 18px over a 12px margin, which is 30px, and 30px
            is exactly how far the outline card sat below the video beside it:
            measured, video top 212, card top 242, and nothing else in the
            section starting at 242. Two large rectangles side by side whose top
            edges miss by half a line is the most visible kind of misalignment
            there is, and it was caused by a label the section did not need. The
            heading above already reads "One lesson and one lab, every module"
            and the rows are numbered 01 to 05.

            Removing it also settles the bottoms: the caption under the video
            ends at 594 and the button at 590, against 594 and 620 before.
          */}
          {/*
            `last:h-[63px]` on the rows below, because they are border-box.

            Rows 1 to 4 spend one of their 64 pixels on the divider they share
            with the row beneath. Row 5 has no divider, so it keeps all 64 and
            the list's own bottom border is added outside it: bands of 64, 64,
            64, 64, 65, measured off a pixel scan. One pixel, and it is the last
            one under the reader's eye.
          */}
          <ol className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
            {course.outline.map((m) => (
              <li
                key={m.n}
                className="flex min-h-[56px] items-center gap-3 border-b border-line px-4 py-3 last:min-h-[55px] last:border-b-0 sm:h-[56px] sm:py-0 sm:last:h-[55px]"
              >
                {/*
                  Numeral and title share a line, and that is the whole reason
                  this is nested rather than flat.

                  The ring around the numeral went in the last pass, correctly:
                  it was `--line` drawn a tenth time inside one card. But a
                  circle has no baseline and bare text does, and the numeral was
                  left centred against the two-line block beside it. Measured
                  off the glyph ink, it landed 7.1px under the title's baseline
                  and 12.9px over the detail's, floating in the gutter between
                  two lines while being set in exactly the detail's style. A
                  reader reads it as the same rank as "Baseline and brief" and
                  expects one baseline.

                  `items-baseline` on a row containing only the numeral and the
                  title gives it one, with no offset to keep in sync. The detail
                  is indented by the track plus the gap, so all three still line
                  up on the left.
                */}
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-3">
                    <span className="t-meta w-5 flex-none tabular-nums text-ink-muted">
                      {m.n}
                    </span>
                    <span className="t-card-title clamp-2 min-w-0 flex-1 text-ink sm:truncate">
                      {m.name}
                    </span>
                  </span>
                  <span className="t-meta block pl-8 text-ink-muted">{m.detail}</span>
                </span>
                {/*
                  Only the open module gets a chip.

                  Four identical "Free account" pills down the right edge of a
                  five-row card is a constant repeated four times, and the note
                  directly under the card already states it once and better. The
                  green "Open" is the only signal in the column and it was
                  competing with four decoys.

                  It was also costing the rows their width: at 1024 the chip ate
                  110px of a 432px row and module 02 truncated to "Build the
                  first working sy...". With the four gone nothing truncates at
                  any width.
                */}
                {/* `flex items-center`, not bare `flex-none`. As a plain flex
                    item this span was blockified and established a line box
                    whose 16/24 strut is taller than the 24px chip inside it, so
                    the chip baseline-aligned to the bottom of it and rode 1px
                    low on every row. */}
                {m.access === "Open" ? (
                  <span className="flex flex-none items-center">
                    <StatusChip open>{m.access}</StatusChip>
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
          <p className="t-body-sm mt-3 text-ink-secondary">{course.outlineNote}</p>

          <EnrollButton withDate className="mt-4" />
        </div>
      </div>

      {/*
        No rule above this block, and two columns rather than three.

        The rule was `border-line`, the same 1px token the page uses for section
        boundaries, so a divider meaning "next part of this section" was drawn
        identically to the ones meaning "next section" immediately above and
        below. It also sat 58px under the left column and 32px under the right,
        because the two end at different heights, so it was parallel to nothing.
        Whitespace separates this block without claiming to be a boundary.

        Three columns over five items left a 384px hole in the bottom right and
        wrapped the longest item while its neighbours sat on one line.

        Two columns, and they are the *same* two columns as the grid above
        rather than a fresh pair capped at some width. Capping it at 880px was
        the first attempt and it put this list's second column at x=568 against
        the grid's 777, a 209px miss directly under a block whose own columns
        the reader has just finished scanning. Matching the grid's track sizes
        is the only version where the strip belongs to the section above it, and
        since that grid went to even columns in the one-screen pass, this is a
        plain `sm:grid-cols-2` with nothing to restate at lg.
      */}
      <div className="mt-6 md:mt-8">
        <p className="t-meta font-semibold text-ink-secondary">{course.includesLabel}</p>
        <ul className="mt-3 grid grid-cols-1 gap-x-8 gap-y-2.5 sm:grid-cols-2">
          {course.includes.map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <CheckIcon size={16} weight="bold" className="mt-0.5 flex-none text-ink" />
              <span className="t-body-sm text-ink-secondary">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
