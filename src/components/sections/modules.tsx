import {
  ChartLineUpIcon,
  FileTextIcon,
  RocketLaunchIcon,
  TargetIcon,
  WrenchIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import { VideoPlayer } from "@/components/video-player";
import { CheckList, EnrollButton, Section, SectionHeader, StatusChip } from "@/components/ui";
import { method, moduleFormat } from "@/lib/content";

/**
 * The method and the module format, in one band. Merged 7 Aug at Roan's
 * request; the note over `method` in content.ts has the copy side of it.
 *
 * WHAT MERGED. This section was the course preview beside a five-row outline
 * card, and the method section 5,000px below it was the same five steps as a
 * horizontal timeline. Two lists of Profile, Build, Deploy, Measure, Document
 * in one page, each holding the half of the story the other did not: the
 * timeline had the sentence explaining each step and the artifact it produces,
 * the card had the access state. The card below is both halves at once, and the
 * standalone section is gone.
 *
 * WHAT THE TIMELINE LEFT BEHIND. Its horizontal five-across row does not fit a
 * 592px column, so the steps run vertically here, which is the form that row
 * already took below lg. What came with it is the glyph per node and the accent
 * fill on step 1 — the glyphs are the reason the row was legible before it was
 * read, and a reader scanning for the step where the thing goes live finds the
 * rocket faster than the numeral 03. The numeral is still printed on every step
 * because the brief names this a five-step method and learners refer to steps by
 * number, and the connector rule between the nodes is now the card's own row
 * dividers doing the same job.
 *
 * ------------------------------------- ONE SCREEN ON A 14IN MACBOOK, 7 Aug
 *
 * Roan's requirement, restated after the merge and now the hard constraint on
 * this file: heading to the last item of the includes strip, readable without
 * scrolling on a 14in MacBook. That machine is 1512x982 logical, so the budget
 * is about 780px once the browser chrome and the 72px sticky header are out.
 *
 * The merged band measured 1027. It is 737, and every one of those 290px came
 * from layout or from copy that was saying something twice — none from cutting
 * a step, a sentence, an artifact or a row of the includes strip:
 *
 *   -60  The intro moved onto the heading's row (`asideIntro`, ui/index.tsx),
 *        which is free space next to a heading that wraps to two lines anyway.
 *   -66  The intro stopped walking the five steps. The card below states each
 *        one in a full sentence, so that clause was the card read aloud first.
 *   -130 The artifact left its own third line and joined the title line, where
 *        the row was empty from the step name to the right edge.
 *   -60  The columns went 1fr / 1.2fr. Giving the *taller* column the width is
 *        what turns width into height: at 681px three of the five sentences
 *        fit one line instead of two. The even split dates from when the video
 *        was the taller half and is exactly backwards now.
 *   -20  Row padding 14 to 10. The rows are two lines now, not three.
 *
 * The rest is distribution. The includes strip sits in the left column under
 * the video rather than full width under both, so the two columns end within
 * 16px of each other instead of one running 250px past the other.
 *
 * If a sixth step or a longer sentence ever arrives, the budget is spent: take
 * it out of the video, which is the shorter column, rather than out of the card.
 */
const glyphs: Record<number, Icon> = {
  1: TargetIcon,
  2: WrenchIcon,
  3: RocketLaunchIcon,
  4: ChartLineUpIcon,
  5: FileTextIcon,
};

export function HowModulesWork() {
  return (
    <Section id="method" compressed>
      {/* `asideIntro`, and this is the only section that asks for it: the intro
          sits on the heading's row, in the space a two-line heading leaves
          empty, rather than under it. 60px, and `SectionHeader` has the note. */}
      <SectionHeader
        asideIntro
        label={method.eyebrow}
        heading={method.headline}
        intro={method.intro}
      />

      {/*
        THE INCLUDES STRIP MOVED INTO THE LEFT COLUMN, and it is placed rather
        than reordered.

        The merge made the two halves of this row very different heights. The
        steps card carries a sentence and an artifact per step, so at 1440 it
        runs 705px against the video's 371, and the first build of this section
        left a 334px hole of white under the video with the includes strip
        stranded below both columns. A hole that size directly under the one
        photograph in the band reads as a missing element, not as air.

        The tracks are 1fr / 1.2fr rather than even, and the reason is the same
        one: the steps card is the taller column, so it is the one that converts
        width into height. Three of its five sentences fit on one line at 681px
        and on two at 600. The even split it replaces was correct when the video
        was the taller half, which stopped being true at the merge.

        `col-start` / `row-start` rather than `order`, because DOM order is
        already the right order everywhere else: stacked on a phone a reader
        gets the video, the five steps, the access note, the button, then what
        every module includes, which is the sequence the copy argues in. Only
        the desktop placement changes, and only at lg, where the strip fills the
        column it was leaving empty.

        It goes to one column in the process. Two columns of 280px wrapped
        "Recorded lessons from people who run these systems" onto two lines
        while its neighbour sat on one, which is the same ragged-pair problem
        that took this list from three columns to two in the first place.
      */}
      {/* `grid-rows-[auto_1fr]`, and the explicit track is load-bearing. With
          both rows auto, the steps card spanning them is taller than they are
          and the browser hands the surplus to *each* spanned row equally, which
          pushed 68px of white between the video and the strip under it and left
          the strip floating in its own column. Sized this way the first row is
          the video and the second takes every remaining pixel, so the slack
          collects once, at the foot of the column, where a column ending is all
          it reads as. */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:grid-rows-[auto_1fr] lg:gap-x-8 lg:gap-y-7">
        <figure className="m-0 min-w-0 lg:col-start-1 lg:row-start-1">
          <VideoPlayer
            src={moduleFormat.video.src}
            poster={moduleFormat.video.poster}
            posterAlt={moduleFormat.video.posterAlt}
            card={moduleFormat.video.card}
          />
          <figcaption className="t-meta mt-2 text-ink-muted">
            {moduleFormat.video.caption}
          </figcaption>
        </figure>

        <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          {/*
            No label over the card, and this is the fix for the thing Roan could
            not name.

            It was `t-meta` at 18px over a 12px margin, which is 30px, and 30px
            is exactly how far the card sat below the video beside it: measured,
            video top 212, card top 242, and nothing else in the section
            starting at 242. Two large rectangles side by side whose top edges
            miss by half a line is the most visible kind of misalignment there
            is, and it was caused by a label the section did not need. The
            heading above already says "in five steps" and the rows are numbered
            01 to 05.
          */}
          <ol className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
            {method.steps.map((step) => {
              const Glyph = glyphs[step.n];

              return (
                <li
                  key={step.n}
                  className="flex gap-3 border-b border-line px-4 py-2.5 last:border-b-0"
                >
                  {/*
                    The node, at 32px rather than the timeline's 40. It sits
                    against two lines of type here instead of over a column, and
                    a 40px disc beside a 20px title reads as the row's subject
                    rather than as its marker.

                    Step 1 is the free one, so it takes the section's single
                    filled element, which is the same rule the timeline ran and
                    the same signal the "Open" chip carries on that row.
                  */}
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full border-2 ${
                      step.n === 1
                        ? "border-accent bg-accent text-white"
                        : "border-line-strong bg-surface text-ink"
                    }`}
                  >
                    {Glyph ? <Glyph size={16} weight="regular" /> : null}
                  </span>

                  <div className="min-w-0 flex-1">
                    {/*
                      TWO LINES PER ROW, not three, and this is where the height
                      budget was found.

                      The artifact used to be a third line under the sentence,
                      labelled and left-aligned, which is the shape the timeline
                      gave it when each step owned a 220px column. In a 600px row
                      it is a 130px value sitting alone on a 26px line, five
                      times over: 130px of the band, spent on white either side
                      of two words. On the title line it costs nothing, because
                      the line was half empty from "Profile" to the right edge,
                      and it lands beside the step it belongs to rather than
                      under a sentence about that step.

                      `flex-wrap` with `sm:ml-auto` is what makes that safe at
                      390px, where the pair drops to its own line under the name
                      and reverts to reading left-aligned.
                    */}
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      {/*
                        Numeral and name share a baseline. A circle has no
                        baseline and bare text does, which is why the numeral is
                        set as text beside the name rather than inside the node:
                        in the ring it landed in the gutter between two lines
                        while being set in exactly the meta style, and a reader
                        reads it as the same rank as the line under it.
                      */}
                      <span className="t-meta w-5 flex-none tabular-nums text-ink-muted">
                        {`0${step.n}`}
                      </span>
                      <span className="t-card-title min-w-0 text-ink">{step.name}</span>
                      {/*
                        Only the open step gets a chip, and it sits next to the
                        name rather than at the row's right edge, because the
                        right edge now belongs to the artifact on every row and
                        one row breaking that column would read as a fifth
                        artifact that happens to be green.

                        Four identical "Free account" pills down the right edge
                        of a five-row card was a constant repeated four times,
                        and the note directly under the card already states it
                        once and better. The green "Open" is the only signal in
                        the column and it was competing with four decoys.
                      */}
                      {/* `flex items-center`, not bare `flex-none`. As a plain
                          flex item this span was blockified and established a
                          line box whose 16/24 strut is taller than the 24px
                          chip inside it, so the chip baseline-aligned to the
                          bottom of it and rode 1px low. */}
                      {step.access === "Open" ? (
                        <span className="flex flex-none items-center self-center">
                          <StatusChip open>{step.access}</StatusChip>
                        </span>
                      ) : null}
                      <span className="t-meta flex w-full flex-wrap items-baseline gap-x-2 pl-8 text-ink-muted sm:ml-auto sm:w-auto sm:pl-0">
                        <span className="t-field">{method.produces}</span>
                        <span className="font-semibold text-ink-secondary">{step.output}</span>
                      </span>
                    </div>
                    <p className="t-body-sm mt-1 pl-8 text-ink-secondary">{step.text}</p>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="t-body-sm mt-3 text-ink-secondary">{moduleFormat.accessNote}</p>

          <EnrollButton withDate className="mt-4" />
        </div>

        {/*
          No rule above this block.

          The rule was `border-line`, the same 1px token the page uses for
          section boundaries, so a divider meaning "next part of this section"
          was drawn identically to the ones meaning "next section" immediately
          above and below. It also sat 58px under the left column and 32px under
          the right, because the two end at different heights, so it was
          parallel to nothing. Whitespace separates this block without claiming
          to be a boundary.

          `mt-6` below lg only. Stacked, it needs the gap it always had; in the
          left column at lg the grid's own 28px row gap does the same job and
          the margin would double it.
        */}
        <div className="mt-6 lg:col-start-1 lg:row-start-2 lg:mt-0">
          <p className="t-meta font-semibold text-ink-secondary">{moduleFormat.includesLabel}</p>
          {/* Extracted to ui/CheckList when the course page needed the same rows.
              Same markup, same 16px bold glyph on the cap line, one definition. */}
          <CheckList items={moduleFormat.includes} className="mt-3" />
        </div>
      </div>
    </Section>
  );
}
