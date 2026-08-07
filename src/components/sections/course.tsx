import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { VideoPlayer } from "@/components/video-player";
import { ButtonLink, Section, SectionHeader, StatusChip } from "@/components/ui";
import { course, cta } from "@/lib/content";

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
 */
export function Course() {
  return (
    <Section id="course">
      <SectionHeader
        label={course.label}
        heading={course.headline}
        intro={course.intro}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-8">
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
          <ol className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
            {course.outline.map((m) => (
              <li
                key={m.n}
                className="flex min-h-[56px] items-start gap-3 border-b border-line px-4 py-3 last:border-b-0 sm:h-[64px] sm:items-center sm:py-0"
              >
                {/* A numeral, not a badge. The ring was `--line` drawn a tenth
                    time inside one card, after the card edge and four dividers,
                    and `rounded-full` on a numeral is outside the radius lock
                    besides: pills are for status chips and the path tab row. */}
                <span className="t-meta w-6 flex-none tabular-nums text-ink-muted">{m.n}</span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5 sm:gap-0">
                  <span className="t-card-title clamp-2 text-ink sm:truncate">{m.name}</span>
                  <span className="t-meta text-ink-muted">{m.detail}</span>
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
                {m.access === "Open" ? (
                  <span className="flex-none">
                    <StatusChip open>{m.access}</StatusChip>
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
          <p className="t-body-sm mt-3 text-ink-secondary">{course.outlineNote}</p>

          <ButtonLink href="#paths" className="mt-4">
            {cta.primary}
          </ButtonLink>
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
        wrapped the longest item while its neighbours sat on one line. Two
        columns capped at 880px gives every cell about 424px and nothing wraps.
      */}
      <div className="mt-8 md:mt-12">
        <p className="t-meta font-semibold text-ink-secondary">{course.includesLabel}</p>
        <ul className="mt-3 grid max-w-[880px] grid-cols-1 gap-x-8 gap-y-2.5 sm:grid-cols-2 md:gap-y-3">
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
