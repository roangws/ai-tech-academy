import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import {
  EnrollButton,
  PathCover,
  Section,
  SectionHeader,
  SkillChip,
  StatusChip,
  TextAction,
} from "@/components/ui";
import { cta, paths, type Path } from "@/lib/content";

/**
 * One catalog, one reading order.
 *
 * The grid is 3 x 2 and the lead path takes two cells of the first row as a
 * wide horizontal card: cover on the left, its full curriculum on the right.
 * The other four fill the remaining four cells. Six cells, five cards, no empty
 * slot.
 *
 * RESTORED 7 AUG, and worth recording why it left and why it came back.
 *
 * It was flattened to five equal summary cards for one pass, on the argument
 * that nothing about this program ranks Path A above the others: it is not the
 * introductory path (E is), there is no enrolment data, and all five run the
 * same five modules on the same method, so emphasis on A was an accident of it
 * being first in the array. The argument is sound and the result was worse.
 * Five identical cards is a grid rather than a catalog: there is no entry
 * point, nothing shows what a path actually contains until you leave the page,
 * and the section reads as a specimen sheet. Roan looked at both and kept this
 * one, which is the right call — a lead card is not a claim that Path A is
 * better, it is a worked example of what any of the five looks like inside.
 *
 * What did carry over from that pass stays: the badge chip can no longer wrap,
 * the small cards' titles and summaries reserve their height so four cards in a
 * row share their internal grid, and the covers run 16:6 below sm.
 *
 * WHY THIS SHAPE AND NOT A TALL FEATURE. It used to take the first column as a
 * tall card spanning both rows, and that arrangement could not be made to land.
 * A feature sharing a two-row column with two stacked cards has to carry
 * roughly twice their content to finish level with them, and this one carries
 * about one and a half times: the full five modules against one, plus a For and
 * Pace row, plus two actions. Measured at 1440 it came out 872px against a
 * 1211px cell, so the catalog's first column stopped 339px short of the two
 * beside it.
 *
 * Both ways of closing that gap were worse than the gap. Stretching the card
 * pools the leftover into whichever child can grow, which is how this section
 * previously produced a 421px field of flat cover colour and 78px gaps between
 * module rows. Growing the cover to a 3:4 portrait closed the distance and
 * spent it on 380px of empty ground, which is the same failure with a ratio in
 * front of it.
 *
 * Turned on its side the problem disappears, because the row's height is then
 * set by an ordinary card next to it and the cover has a number to fill rather
 * than one to invent.
 */
export function Paths() {
  const [featured, ...rest] = paths;

  return (
    <Section id="paths" tint>
      <SectionHeader
        label="Learning paths"
        heading="Find a path for your role"
        intro="The five steps stay the same. The tools, the examples and the workflow you deploy change by role."
        action={
          <TextAction href="/paths">
            {cta.compare}
            <ArrowRightIcon size={14} weight="bold" />
          </TextAction>
        }
      />

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        <li className="flex sm:col-span-2">
          <FeaturedCard path={featured} />
        </li>
        {rest.map((p) => (
          <li key={p.id} className="flex">
            <PathCard path={p} />
          </li>
        ))}
      </ul>
    </Section>
  );
}

function FeaturedCard({ path }: { path: Path }) {
  return (
    <article className="flex h-full w-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-e1 md:flex-row">
      {/*
        Below md the cover goes back on top, because a side-by-side split at
        400px leaves neither half a usable column. It takes the same ratio the
        four catalog cards use: the featured card runs full width down here, and
        at 660px across, a taller ratio is 495px of flat ground before a reader
        reaches a word of the card.
      */}
      <div className="md:w-[44%] md:flex-none">
        <span className="block md:hidden">
          <PathCover
            ground={path.ground}
            badge={path.badge}
            letter={path.badge.replace("Path ", "")}
            audience={path.coverAudience}
            build={path.coverBuild}
            image={path.cover}
          />
        </span>
        <span className="hidden h-full md:block">
          <PathCover
            ground={path.ground}
            badge={path.badge}
            letter={path.badge.replace("Path ", "")}
            audience={path.coverAudience}
            build={path.coverBuild}
            image={path.cover}
            fill
          />
        </span>
      </div>

      {/*
        The content column.

        It was five stacked blocks separated by hairlines: a title, a summary, a
        two-row definition list, a numbered list, a chip set and a button row.
        Every one of them was correct and the whole thing read as a form. Three
        changes, each taking a block that was describing itself and letting it
        show itself instead.

          1. The pace facts were a `dt`/`dd` pair with a 68px label column, so
             "5 modules . 6 weeks . Intermediate" arrived as the value half of a
             row labelled "Pace". They are three chips now, which is one line
             instead of two and scans without reading. The audience keeps a
             label, because "Marketing ops, RevOps, growth analysts and GTM
             engineers" is a sentence and a chip is not.
          2. The five modules run on a rail with numbered nodes, the same shape
             as the method section's timeline. This is the one card on the page
             that shows a whole path end to end, and a rail says "these are
             consecutive" in a way five left-aligned numerals never did.
          3. The free module is called out on the rail rather than chipped at
             the end of a row. Its node is filled, its title is the only one at
             full ink, and the chip sits with it. It is the single most
             important row in this card and it used to be the first of five
             identical ones.

        The skills block came out at the same time. Four chips naming techniques
        do not help anyone choose a path, and they were the fourth labelled
        block in a column that already had three. The `skills` array stays in
        content.ts for the path pages, which is where somebody who has already
        chosen will want the detail.
      */}
      <div className="flex min-w-0 flex-1 flex-col p-5 md:p-6">
        <h3 className="t-h3 text-ink">{path.title}</h3>
        <p className="t-body-sm mt-2 text-ink-secondary">{path.summary}</p>

        <ul className="mt-3 flex flex-wrap gap-1.5">
          {[path.modules, path.duration, path.level].map((fact) => (
            <li key={fact}>
              <SkillChip>{fact}</SkillChip>
            </li>
          ))}
        </ul>

        <p className="t-meta mt-3 text-ink-muted">
          <span className="text-ink-muted">For </span>
          <span className="text-ink">{path.audience}</span>
        </p>

        <div className="mt-4 border-t border-line pt-3.5">
          <p className="t-field text-ink-muted">The five modules</p>

          <ol className="relative mt-2.5">
            {/* The rail runs node centre to node centre, so it stops at module
                05 rather than trailing into the padding below it. */}
            <span
              aria-hidden="true"
              className="absolute left-[11px] top-3 bottom-3 w-px bg-line"
            />

            {/*
              `py-2`, up from 5px. The four cards beside this one each grew by
              about 40px in this pass, from the module-count label and the enrol
              control, and the row's height is set by the tallest of them, so all
              of that arrived here as slack above the footer rule. The rail is the
              right place to spend it: five rows at 18px apart is a readable list
              and it is the one block in this card that was tighter than it needed
              to be.

              Not `flex-1` on the list, which is the obvious way to absorb the
              rest of it and the way that produced the 78px inter-row gaps this
              card shipped with two passes ago.
            */}
            {path.curriculum.map((m) => (
              <li key={m.n} className="relative flex items-center gap-3 py-2">
                <span
                  aria-hidden="true"
                  className={`relative z-10 flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full border text-[11px] font-semibold leading-none ${
                    m.open
                      ? "border-accent bg-accent text-white"
                      : "border-line bg-surface text-ink-muted"
                  }`}
                >
                  {m.n}
                </span>
                <span
                  className={`t-body-sm min-w-0 flex-1 truncate ${
                    m.open ? "font-medium text-ink" : "text-ink-secondary"
                  }`}
                >
                  {m.name}
                </span>
                {m.open ? <StatusChip open>Open</StatusChip> : null}
              </li>
            ))}
          </ol>
        </div>

        {/*
          The actions take the leftover, and only the actions. Stretching this
          card used to pool every spare pixel into whichever child could grow: a
          421px field of flat cover colour, or 78px gaps between module rows.
          The content above runs at its natural height and `mt-auto` sends what
          remains here, where a gap above a button row is a margin rather than a
          hole.
        */}
        {/*
          The one filled control in this section, and it is here rather than
          nowhere.

          All five cards close with the same pair now, and five saturated blue
          buttons in one band would break the accent lock in globals.css: one
          filled primary per section, or the colour stops meaning "this is the
          thing to press". Five glass ones keep the lock and give the section no
          entry point at all, which is the failure the lead card exists to
          prevent. So the lead card's is filled and the four beside it are glass,
          which is the same hierarchy the cards already have in every other
          respect.
        */}
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-line pt-4">
          <EnrollButton withDate size="md" />
          <TextAction href={`/paths/${path.id}`}>
            {cta.path}
            <ArrowRightIcon size={14} weight="bold" />
          </TextAction>
        </div>
      </div>
    </article>
  );
}

/**
 * Catalog card. There are no ratings and no price, because neither exists; the
 * access state occupies the slot Udemy gives to price, which is the honest
 * equivalent.
 *
 * The card used to preview modules 01 to 03 and close the list with "and 2
 * more". Across the four small cards that was twelve rows, and the five-step
 * spine those rows describe is stated in full by the method section and again
 * by the course outline with its access states attached. A reader met Profile,
 * Build and Deploy for the third time in a row that could not fit their titles
 * without truncating.
 *
 * Module 01 stays, on its own, because it is the free one and that "Open" chip
 * is the offer.
 *
 * ---------------------------------- TWO REAL CONTROLS, at Roan's instruction
 *
 * All five paths are available, so all five cards now close with the same pair
 * the lead card closes with: enrol, and view the path. These four used to close
 * with one word of blue text reading "View path" that was `aria-hidden` and did
 * nothing, because the whole card was a link: the title carried
 * `before:absolute before:inset-0` and the arrow was a picture of an affordance
 * rather than one.
 *
 * That pattern and two real buttons cannot coexist. A stretched pseudo-element
 * covers its own card, so any control placed under it is unreachable, and
 * raising the controls back out with `relative z-10` leaves a card where two
 * thirds of the surface goes one place and two islands go two others. So the
 * stretched link is gone and the title is an ordinary link. The card loses its
 * click-anywhere, and gains the enrol control the section is for.
 *
 * `path.modules` moved with it. It was the left half of the old footer row, and
 * with the footer now holding a button and a link there is nowhere in it for a
 * bare "5 modules" to sit that does not read as a third action. It labels the
 * module preview instead, which is what the lead card does with the same fact
 * and reads better than it did: "5 modules", then the first one, then its Open
 * chip.
 */
function PathCard({ path }: { path: Path }) {
  const first = path.curriculum[0];

  return (
    <article className="group relative flex h-full w-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-e1 transition-[border-color,box-shadow] duration-150 hover:border-line-strong hover:shadow-e2">
      <PathCover
        ground={path.ground}
        badge={path.badge}
        letter={path.badge.replace("Path ", "")}
        audience={path.coverAudience}
        build={path.coverBuild}
        image={path.cover}
      />

      <div className="flex flex-1 flex-col p-5">
        {/*
          Both blocks reserve their height. Without it a two-line title on one
          card pushes its meta row 25px below the meta rows either side of it,
          and the cards with one-line titles pool the difference into a void
          above their footers: four cards in a row, four different internal
          grids. Measured at 1024 before the fix, the `dl` sat at 273 / 273 /
          298 across three cards in the same row.
        */}
        <h3 className="t-card-title clamp-2 min-h-[44px] text-ink md:min-h-[50px]">
          <Link
            href={`/paths/${path.id}`}
            className="text-ink no-underline hover:underline"
          >
            {path.title}
          </Link>
        </h3>

        <p className="t-body-sm clamp-2 mt-1 min-h-[40px] text-ink-secondary">{path.summary}</p>

        <dl className="mt-3 grid grid-cols-3 gap-x-3 border-t border-line pt-3">
          {path.facts.map((f) => (
            <div key={f.label} className="min-w-0">
              <dt className="t-field text-ink-muted">{f.label}</dt>
              <dd className="t-meta mt-1 truncate text-ink">{f.value}</dd>
            </div>
          ))}
        </dl>

        {/* Module 01, the free one, and nothing else from the curriculum.
            Two lines are allowed now that it is not sharing the block with two
            more rows, so the title states itself instead of truncating. */}
        {/* The count labels the block, the way "The five modules" labels the
            lead card's rail. See the note at the head of this component for
            where it came from. */}
        <div className="mt-3 border-t border-line pt-3">
          <p className="t-field text-ink-muted">{path.modules}</p>
          <div className="mt-1.5 flex items-start gap-2.5">
            <span className="t-meta w-5 flex-none pt-px text-ink-muted">{first.n}</span>
            <span className="t-body-sm clamp-2 min-w-0 flex-1 text-ink-secondary">
              {first.name}
            </span>
            {first.open ? <StatusChip open>Open</StatusChip> : null}
          </div>
        </div>

        {/* The same two controls the lead card closes with, in the same order.
            `gap-y-2.5` rather than the lead's `gap-y-3`, because at 292px these
            two can wrap onto separate lines and the lead's never do. */}
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2.5 border-t border-line pt-3.5">
          <EnrollButton withDate tone="secondary" size="md" />
          <TextAction href={`/paths/${path.id}`}>
            {cta.path}
            <ArrowRightIcon
              size={13}
              weight="bold"
              className="transition-transform duration-150 group-hover:translate-x-0.5"
            />
          </TextAction>
        </div>
      </div>
    </article>
  );
}
