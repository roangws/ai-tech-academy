import Image from "next/image";
import { ArrowUpRightIcon, LinkedinLogoIcon } from "@phosphor-icons/react/dist/ssr";
import { Photo } from "@/components/ui";
import type { Person } from "@/lib/content";

/**
 * The two instructor cards, shared by the homepage band (sections/instructors.tsx)
 * and the full roster at /instructors, so each card stays one definition.
 *
 * They were private to the section until the roster got its own route, which is
 * the same move `board-card.tsx` made when the review board got one. The
 * arithmetic these two cards are built on — 292px wide, 2:3, a 272px head, a
 * 149px reserved text block — is written up at length at the head of
 * sections/instructors.tsx, and it travels with the card rather than with the
 * band, which is exactly why the card is now its own module: the page and the
 * band both have to honour it.
 */

/**
 * The lead card: a portrait column and a bio column, on the page's dark ground.
 *
 * It is not a bigger version of a specialist tile and it should not be. Roan
 * writes the curriculum and records every core lesson, he is the one person here
 * a visitor has a reason to read about before they decide anything, and he has
 * three affiliations and four outbound links. All of that is a column of text,
 * and a column of text laid over somebody's face is the thing this pass was sent
 * to fix.
 *
 * The portrait column is 292px and `aspect-[2/3]`, which is the source's own
 * ratio, so `object-cover` has nothing to crop. Below md it goes square on top
 * of the text instead: at 358px across, a 2:3 frame is 537px of photograph
 * before a phone reader reaches a word, and a square crop at the same width
 * still clears the chin by 47px.
 */
export function InstructorLeadCard({ person }: { person: Person }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-[var(--radius-feature)] bg-ink-band md:flex-row">
      {/*
        4:5 from md, not the source's 2:3.

        At 2:3 the portrait column was 438px against a bio of about 230, and even
        centred that is 104px of empty ink above and below the type in the widest
        card on the page. 4:5 brings the column to 365 and the slack to 68, which
        reads as padding. It costs nothing in the photograph: `object-cover` is
        still scaling to the 292px width, so the head is the same 272px it was, and
        the 70px the crop drops off the bottom is chest.
      */}
      <div className="relative aspect-square shrink-0 md:aspect-[4/5] md:w-[292px]">
        {/*
          Out of flow, and it has to be. `aspect-ratio` sets a box's height from
          its width only while nothing inside it is taller; an in-flow `<img>`
          carrying `h-full` inside an auto-height box resolves that percentage
          against nothing, falls back to its own intrinsic ratio, and grows the
          box to fit. Which is what happened: the mobile lead asked for a square
          and rendered 358 x 537, the source's own 2:3, so the crop this frame
          exists to make was never made.

          Absolutely positioned, the picture contributes no height and the ratio
          has exactly one source. InstructorCard has the same note for the same
          reason, arrived at from the other direction.
        */}
        {person.photo ? (
          <span aria-hidden="true" className="absolute inset-0 block">
            <Photo
              image={person.photo}
              width={805}
              height={1200}
              sizes="(max-width: 768px) 100vw, 292px"
              /*
                `object-top` matters only below md, where the square crop has to
                drop 179px of the source and the 179px it drops must be the chest
                rather than the crown. From md the frame is the source's own ratio
                and there is nothing to choose.
              */
              className="object-top"
            />
          </span>
        ) : null}

        {person.lead ? (
          <span className="t-label absolute left-4 top-4 inline-flex h-[22px] items-center rounded-full bg-[rgb(13_26_34/0.62)] px-2.5 text-white backdrop-blur-sm">
            Lead instructor
          </span>
        ) : null}
      </div>

      {/*
        The bio, centred against the portrait and set to the width of the card.
        Both halves of that are load-bearing.

        Centred, because the portrait is 438px at its own ratio and the bio is
        about 245px, and the alternative to splitting the difference is 193px of
        empty ink hanging under the last link chip. Centred it reads as padding,
        which is what it is.

        And set wide, because on the first build of this card it was not. The bio
        ran at `t-body-sm` inside `max-w-[58ch]`, which is about 480px of type in
        a 924px column, so two thirds of the widest card on the page was blank
        ink and the vertical space read as a void rather than as air. The detail
        runs at `t-h3` across 70ch now, which is a size a feature card can carry
        and which happens to be the size that makes this one measure its own
        width. Nothing was added to fill it: the same four facts are set as
        though this card were the feature it is.
      */}
      <div className="flex min-w-0 flex-1 flex-col justify-center p-5 md:p-7 lg:p-9">
        {person.scope ? <p className="t-label text-white/60">{person.scope}</p> : null}

        <h3 className="t-h2 mt-2 text-white">{person.name}</h3>

        {person.role ? <p className="t-body mt-1.5 text-white/70">{person.role}</p> : null}

        {person.detail ? (
          <p className="t-h3 mt-5 max-w-[70ch] font-normal text-white/90">{person.detail}</p>
        ) : null}

        {/*
          The investor line and the links share a row, on a rule.

          They were stacked, which cost 20px of height in a card that had none to
          spare and left both of them short lines against a wide column. Side by
          side they close the card the way a feature card closes: one fact on the
          left, the ways out on the right.

          SIDE BY SIDE AT LG, not at sm, corrected 8 Aug, and the breakpoint that
          was wrong is not the one that looks wrong. The split needs the card's
          text column to be wide. It is wide at sm — the card is still stacked
          there, so the column is the whole card — and it is wide again at lg. In
          between, at md, the card turns into a row and the portrait takes 292px
          off the front of it, so the text column is at its narrowest exactly
          where the layout had decided it was wide enough to split.

          Measured at 768: the investor line got 81px and set itself over six
          lines, one word per line, beside two chips that had taken 260. At 640
          it had 269px and at 900 it had 213. A column that shrinks as the
          viewport grows only happens across this one breakpoint, which is how it
          survived a build. Stacked below lg it is never squeezed, and the cost
          is one line of height at widths that have it to spare.
        */}
        {person.investments?.length || person.linkedin || person.site ? (
          <div className="mt-6 flex flex-col gap-3 border-t border-white/15 pt-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
            {/*
              Named and linked rather than counted: "investor in three companies"
              asks to be believed, three names a reader can open can be checked,
              and that is the standard the rest of this page holds itself to.
            */}
            {person.investments?.length ? (
              <p className="t-meta min-w-0 text-white/55">
                Investor in{" "}
                {person.investments.map((inv, i) => (
                  <span key={inv.href}>
                    {i > 0 ? (i === person.investments!.length - 1 ? " and " : ", ") : null}
                    <a
                      href={inv.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/75 underline decoration-white/30 underline-offset-2 transition-colors hover:text-white hover:decoration-white/70"
                    >
                      {inv.label}
                    </a>
                  </span>
                ))}
              </p>
            ) : null}

            {person.linkedin || person.site ? (
              <span className="flex flex-none flex-wrap items-center gap-2">
                {person.linkedin ? (
                  <a
                    href={person.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="t-meta inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 font-medium text-white no-underline ring-1 ring-inset ring-white/20 transition-colors hover:bg-white/25"
                  >
                    <LinkedinLogoIcon
                      size={14}
                      weight="fill"
                      aria-hidden="true"
                      className="flex-none"
                    />
                    {/*
                      The name is appended, not substituted.

                      This carried `aria-label={`${person.name} on LinkedIn`}`,
                      which replaces the accessible name outright — so the chip
                      read "View profile" and answered to "Patrick Kriwanek on
                      LinkedIn", and nothing a speech-input user could say
                      matched what they could see. WCAG 2.5.3 asks for the
                      visible label to be contained in the accessible name, and
                      an `aria-label` that drops it fails by construction.

                      Appending an `sr-only` span keeps both: the name announces
                      as "View profile, Patrick Kriwanek on LinkedIn", "click
                      view profile" still matches, and the disambiguation a
                      screen reader needed from a row of identical chips
                      survives.
                    */}
                    View profile
                    <span className="sr-only">{` — ${person.name} on LinkedIn`}</span>
                  </a>
                ) : null}

                {person.site ? (
                  <a
                    href={person.site.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${person.name} at ${person.site.label}`}
                    className="t-meta inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 font-medium text-white no-underline ring-1 ring-inset ring-white/20 transition-colors hover:bg-white/25"
                  >
                    <ArrowUpRightIcon
                      size={13}
                      weight="bold"
                      aria-hidden="true"
                      className="flex-none"
                    />
                    {person.site.label}
                  </a>
                ) : null}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

/**
 * One specialist: a portrait, who it is, and the way to their profile.
 *
 * NOT a stretched card link, and there is a note at the head of this file on the
 * build where it was one. The short version: `before:absolute before:inset-0`
 * resolves against the nearest positioned ancestor, the text block here is
 * `absolute bottom-0`, and the result was a 292 x 115 hit area on a 292 x 438
 * card whose hover effects fired across the whole surface. The chip it was meant
 * to replace is cheaper than the bug and it is what a reader can see.
 *
 * `aspect-[2/3]` and not a height. It is the source's own ratio, so the crop is
 * empty at every width the card is ever given, and the two type blocks are
 * positioned as percentages of it rather than against a pixel number that would
 * have to be kept in sync with a breakpoint.
 */
export function InstructorCard({ person }: { person: Person }) {
  return (
    <article className="group/tile relative aspect-[2/3] w-full overflow-hidden rounded-[var(--radius-feature)] bg-ink-band">
      {/*
        The photograph is out of flow, and it has to be. An in-flow `<img>`
        contributes its own intrinsic height, and once the file loads the browser
        swaps the declared ratio for the real one, so a row of four would be
        correct on first paint and out of alignment a moment later. Absolutely
        positioned, the picture cannot contribute anything and the ratio has one
        source.
      */}
      {person.photo ? (
        <span aria-hidden="true" className="absolute inset-0 block">
          <Photo
            image={person.photo}
            width={805}
            height={1200}
            /*
              `70vw` is only the card's real width below about 417px, because the
              `<li>` is `w-[70vw] max-w-[292px]` and pins there. Declaring 70vw all
              the way to 1280 asked the browser for 70% of a 1279px viewport and it
              obliged with the 1080px variant for a 292px box.
            */
            sizes="(max-width: 420px) 70vw, 292px"
            className="transition-transform duration-500 group-hover/tile:scale-[1.03]"
          />
        </span>
      ) : null}

      {/*
        Reading scrim, cut back to the type it exists for.

        It used to ramp to 66% of the card, which is well past the chin, so all
        four faces sat under a wash and went grey against the studio's blue
        backdrop. The numbers now come from the card's own geometry, measured off
        the real frames rather than estimated: the type starts 34% up from the
        bottom, the lowest of the four chins is at 50%, so the scrim holds 0.87 ink
        or better through the type and is fully clear by 46%. Every pixel of every
        face is unwashed photograph.

        Both stops are gradients up from the bottom, so `via-33%` is 33% of the
        way up. If the text block gains a line these have to move with it.
      */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-linear-to-t from-[rgb(13_26_34/0.95)] via-[rgb(13_26_34/0.88)] via-33% to-transparent to-46%"
      />

      {/*
        The employer mark, on a light chip.

        Two of these four marks are dark by design (a navy university wordmark
        and a black app icon), so laying them straight onto a dark photograph
        would show two of the four and lose two. A chip makes the card's
        treatment independent of what colour anyone's brand happens to be, which
        is the only version of this that keeps working as marks are added.

        `alt=""` on purpose. The organisation is named in text directly below, so
        a screen reader announcing the mark would read the same employer twice
        per card.
      */}
      {/* `min-w` and centred, because these four marks are 34, 140, 109 and 74
          pixels wide and the narrowest is a square app icon. Without a floor the
          n-aible chip collapsed to a 34px square beside a 140px CodeRabbit pill,
          and four cards in a row read as four different treatments. */}
      {person.logo ? (
        <span className="absolute right-3 top-3 inline-flex h-8 min-w-[56px] items-center justify-center rounded-[7px] bg-white/92 px-2 shadow-[0_1px_3px_rgb(0_0_0/0.25)]">
          <Image
            src={person.logo.src}
            alt=""
            width={260}
            height={36}
            sizes="130px"
            className="h-[18px] w-auto"
          />
        </span>
      ) : null}

      {/*
        Every line below is conditional, and that is the design rather than
        defensive coding. A card with only a name and a profile link is a
        complete object: portrait, who it is, where to read more.

        Which is exactly why the block reserves its height. The block is anchored
        to the bottom of the card, so a card missing a line does not end up with
        a gap under its type: it ends up with its name 18px lower than the three
        beside it. Patrick has no second affiliation and his name sat 18px below
        Aaron's, Hendrik's and Loc's across the same row, which is the same fault
        the catalog cards fixed with `min-h` and takes the same fix.

        149px is the full stack plus its own padding: name 25, role over two
        reserved lines 36, an affiliation line at 18, an 8px gap, a 26px chip, the
        two 2px gaps, and 16 above and below. Content is top-aligned inside it, so
        whatever a card is missing comes off the bottom, where there is photograph
        to spare, rather than off the top, where the names line up.

        Every row inside it reserves its own height for the same reason one level
        down. The floor on the block alone got the four names onto one line and left
        the four chips on three different ones, because Patrick has no second
        affiliation and the 18px his card does not spend came off the bottom of his
        stack rather than out of a reserved row.
      */}
      <div className="absolute inset-x-0 bottom-0 min-h-[149px] p-4">
        <h3 className="t-card-title text-white">{person.name}</h3>

        {/*
          Two lines, reserved. Three of these four titles are one line and Loc's
          is two, and without a floor his name sat 18px above the other three
          across the same row.
        */}
        {person.role ? (
          <p className="t-meta clamp-2 mt-0.5 min-h-[36px] text-white/75">{person.role}</p>
        ) : null}

        {/*
          The second affiliation. Linked where a URL was supplied and plain text
          where one was not, rather than guessing at a domain.

          No rest underline, and 70% rather than 55%. Three of these four lines are
          plain text and Loc's is a link, and with the link underlined at a
          different opacity the row carried three different treatments of the same
          rank: his read as a third line of his job title rather than as the
          company under it. Underlining on hover says the same thing to a mouse and
          says nothing to everyone else, which is the correct split here. The
          opacity is a contrast fix: 55% white over the scrim measures 4.1:1 on
          Hendrik's card, where a pale polo shows through, and 70% is 7.8:1 on all
          four.
        */}
        {/* Rendered whether there is one or not, which is what keeps the four chips
            below on one line. An empty 18px row is the reserved slot; see the note
            at the head of this block. */}
        {/* The role is printed outside the link and the organisation inside it,
            which is also what the link now means: "Co-founder, n-aible" as one
            anchor made the person's job title part of the company's address.
            content.ts has the note on why the two are separate fields. */}
        <p className="t-meta mt-0.5 min-h-[18px] text-white/70">
          {person.org ? (
            <>
              {person.org.role ? `${person.org.role}, ` : null}
              {person.org.url ? (
                <a
                  href={person.org.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 no-underline transition-colors hover:text-white hover:underline"
                >
                  {person.org.name}
                </a>
              ) : (
                person.org.name
              )}
            </>
          ) : null}
        </p>

        {/*
          The profile link, always visible rather than revealed on hover.

          It is the only affordance on the card, and a card whose one affordance
          appears on hover has no affordance at all on a phone. The accessible name
          carries the person, because four links reading "View profile" in a row is
          four identical destinations to anyone reading the page through its link
          list.

          It carries the person by ADDING to the visible label rather than
          replacing it — this was an `aria-label`, which overwrote "View profile"
          entirely and left voice control with nothing to match. The lead card
          above has the full note.
        */}
        {person.linkedin ? (
          <a
            href={person.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="t-meta mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 font-medium text-white no-underline ring-1 ring-inset ring-white/20 transition-colors hover:bg-white/25"
          >
            <LinkedinLogoIcon size={14} weight="fill" aria-hidden="true" className="flex-none" />
            View profile
            <span className="sr-only">{` — ${person.name} on LinkedIn`}</span>
          </a>
        ) : null}
      </div>
    </article>
  );
}
