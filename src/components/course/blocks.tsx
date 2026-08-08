import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { CourseCard } from "@/components/sections/courses";
import {
  CheckList,
  EnrollButton,
  Panel,
  Section,
  SectionHeader,
  SkillChip,
  TextAction,
} from "@/components/ui";
import { courses, cta, type Course } from "@/lib/content";

/**
 * The four bands under the two-column body, plus the "What you'll learn" box that
 * opens it.
 *
 * They are one file because each is between fifteen and forty lines and none has a
 * decision in it worth its own module. The two that do, the dark hero and the
 * sticky rail, live on their own.
 */

/**
 * The reference's bordered outcomes box, close to verbatim.
 *
 * Two columns of check rows inside a `--line` box, at the top of the left column,
 * above everything else. It is the single most copied element on the reference page
 * and it earns it: six specific promises is the fastest way for a reader to decide
 * whether the next twenty minutes are worth spending.
 *
 * What did not come across is the "Show more" fade. The reference hides four of its
 * eight items behind a gradient because it has eighteen. Six fit, and a disclosure
 * control over six items is a control that exists to be clicked once.
 *
 * The skills chips ride along underneath. They were pulled from the catalog card in
 * an earlier pass with a note saying they belonged on the course page, which is
 * here: somebody who has already chosen wants the technique names.
 */
export function WhatYouLearn({ course }: { course: Course }) {
  return (
    <section aria-labelledby="learn-heading">
      <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5 md:p-6">
        <h2 id="learn-heading" className="t-h3 text-ink">
          What you will learn
        </h2>
        <CheckList items={course.whatLearn} columns={2} className="mt-4" />
      </div>

      <ul className="mt-4 flex flex-wrap gap-1.5">
        {course.skills.map((s) => (
          <li key={s}>
            <SkillChip>{s}</SkillChip>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Requirements and description, the reference's two prose blocks, on one tinted
 * band.
 *
 * The reference gives each its own heading on the same white ground and hides most
 * of the description behind a "Show more". They are one band here for the same
 * reason the closing section is one band: both answer "is this for me", 200px
 * apart, and two headings for one question reads as two questions.
 *
 * No "Show more". Four paragraphs at a 640px measure is roughly 400px, which is
 * less than the control plus the fade it would sit under. The reference needs one
 * because its description runs to eleven paragraphs of marketing copy.
 *
 * `tint`, and it is the only tinted band in the page's top half, so the ground
 * sequence stays ink, white, white, tint, white, tint, white with no two tints
 * adjacent.
 */
export function About({ course }: { course: Course }) {
  return (
    <Section id="about" tint>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-12">
        <div>
          <h2 className="t-h3 text-ink">Requirements</h2>
          {/*
            A plain list rather than CheckList, and the difference is deliberate.

            A check mark asserts "you have this", which is right for the outcomes
            box above and wrong here, where the items are things a reader has to go
            and confirm. Dashes state them without claiming them.
          */}
          <ul className="mt-3">
            {course.requirements.map((r) => (
              <li key={r} className="flex items-start gap-2.5 py-1.5">
                <span aria-hidden="true" className="mt-2.5 h-px w-3 flex-none bg-line-strong" />
                <span className="t-body-sm text-ink-secondary">{r}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="t-h3 text-ink">About this course</h2>
          <div className="mt-3 max-w-[640px]">
            {course.description.map((para) => (
              <p key={para.slice(0, 40)} className="t-body mt-3 text-ink-secondary first:mt-0">
                {para}
              </p>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

/**
 * The other four courses.
 *
 * This is the reference's "Students also bought" and its three "More Courses by"
 * carousels, which between them run about 3,000px and are all recommendation
 * engines dressed as content. There is no purchase data here and nothing to
 * recommend from, so it is the honest version of the same slot: the four courses
 * this reader did not choose, and a route back to the catalog.
 *
 * `CourseCard` is reused rather than reimplemented. It was module-private in
 * sections/courses.tsx and is exported now, which was the point: it carries about
 * eighty lines of argued-over card anatomy, including the reserved heights that
 * keep a row of cards sharing one internal grid, and a second copy of that would
 * drift within a week.
 *
 * Its enrol control is `tone="secondary"`, which it already was, so this band adds
 * no filled accent and the page keeps one.
 */
export function MoreCourses({ currentId }: { currentId: string }) {
  const rest = courses.filter((c) => c.id !== currentId);

  return (
    <Section id="courses" tint>
      <SectionHeader
        label="The other courses"
        heading="Four more, one method"
        intro="Every course runs the same five steps on a different kind of work. Pick by the job you are responsible for."
        action={
          <TextAction href="/#courses">
            {cta.compare}
            <ArrowRightIcon size={14} weight="bold" />
          </TextAction>
        }
      />

      {/*
        Four across at lg, which is where it was and where it is again.

        This spent an hour at `xl:grid-cols-4`, to keep four covers of one height
        in a row: at lg the cards are 223 and the cover's 16:9 gives 125 where the
        type needs 150, so each cover grew past the ratio by whatever its own copy
        happened to need, and Course E's grew least. Moving the breakpoint did fix
        that, and it cost more than the problem. The section measured 1,475px at
        1279 and 749 at 1280 — a 726px jump across one pixel of viewport — and in
        between, a cross-sell card rendered a 596px cover beside a homepage catalog
        card showing the same course at 305.

        The reservation in `CourseCover` fixes the same thing at the source: the
        audience line and the artifact line each hold two lines whether or not they
        fill them, so every cover in a row resolves to the same height at every
        width. Sweeping 320 to 1920 on this page and the homepage, cover heights
        and card-title tops are identical within every row.
      */}
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
        {rest.map((c) => (
          <li key={c.id} className="flex">
            <CourseCard course={c} />
          </li>
        ))}
      </ul>
    </Section>
  );
}

/**
 * The close.
 *
 * ------------------------------------------------------------------- CONTRAST
 *
 * This was a bare light band: a `t-h3`, a line of secondary body and a button, on
 * white, directly under a tinted band. Nothing held it, so the page's last word
 * carried less weight than the cross-sell above it, and the two runs of prose read
 * as one continuous grey.
 *
 * It is a dark panel now, which is what the homepage's close does and for the same
 * reason: this is the one place on the page where the reader is deciding, and it
 * has to look like the end of an argument rather than another paragraph.
 *
 * A `Panel`, not a `Section dark`. Amendment 2 grants one dark *ground* per page
 * and the hero has taken it. A panel is inset, rounded and sits on the band's white
 * ground, so it is a card, the same way the instructor tile is. The distinction is
 * what keeps the page to one dark band while letting two objects be dark.
 *
 * `tone="onDark"` on the control, because on ink `--accent` is a low-contrast blue
 * rectangle. The accent lock's own escape clause is that white is primary on a dark
 * ground, and this is the page's second filled control after the rail's, 3,000px
 * apart and never in one viewport.
 *
 * ---------------------------------------------------------------------- COPY
 *
 * The line read "The GTM AI operating model. It opens for everyone, and you finish
 * it holding baseline and use-case map." Three problems in one sentence: the module
 * title ran into the next clause as though it were prose, "it" pointed at the title
 * rather than the module, and the artifact arrived lowercased mid-sentence with no
 * article, so "holding baseline and use-case map" read as a typo.
 *
 * The module name is its own line now, at card-title weight, which is what it is:
 * the name of the thing you are about to start. The sentence under it says the two
 * facts that matter and stops.
 *
 * ------------------------------------------------------------- NO `hairlineTop`
 *
 * It had one. That prop is for a band following one that draws no bottom border,
 * and the cross-sell above is tinted, so it already draws its own. The two rules
 * landed at the same boundary with a 0px gap: a doubled 2px hairline bracketing the
 * panel, which is the line in Roan's capture. One rule there is the normal band
 * rhythm; two is a seam.
 */
export function CourseClosing({ course }: { course: Course }) {
  const first = course.curriculum[0];

  return (
    <Section compressed>
      <Panel tone="dark">
        <div className="flex flex-wrap items-center justify-between gap-x-12 gap-y-6">
          <div className="max-w-[560px]">
            <h2 className="t-h2 text-white">Start with module 1</h2>
            {first ? (
              <p className="t-card-title mt-3 text-white/90">{first.name}</p>
            ) : null}
            <p className="t-body mt-2 text-[#c3d2dc]">
              Open to everyone, with no account. You finish it holding{" "}
              <span className="text-white">{article(first?.artifact)}</span>.
            </p>
          </div>

          <div>
            <EnrollButton withDate tone="onDark" href="/sign-up" />
            <p className="t-meta mt-2.5 text-white/60">A free account opens the rest.</p>
          </div>
        </div>
      </Panel>
    </Section>
  );
}

/**
 * "a baseline and use-case map", "an ICP and account brief".
 *
 * The artifacts are written in content.ts as bare noun phrases, because every other
 * place they appear is a label ("You finish with Baseline and use-case map") where
 * an article would be wrong. This is the one sentence that needs one.
 */
function article(artifact?: string) {
  if (!artifact) return "";
  const lower = artifact.charAt(0).toLowerCase() + artifact.slice(1);
  return `${/^[aeiou]/.test(lower) ? "an" : "a"} ${lower}`;
}
