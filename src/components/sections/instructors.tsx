import Image from "next/image";
import { ArrowUpRightIcon, LinkedinLogoIcon } from "@phosphor-icons/react/dist/ssr";
import { Photo, Section, SectionHeader } from "@/components/ui";
import { instructors, type Person } from "@/lib/content";

/**
 * The roster: one lead card, then four portraits at the size a portrait wants
 * to be.
 *
 * FIVE REAL PEOPLE, as of 7 Aug. This section spent its whole life working
 * around not having them. It ran grey monogram tiles, then text-only slots, then
 * faceless illustrations in path hues, each version an answer to the same
 * question: how do you show a roster you cannot name? The answer turned out to
 * be that you wait, and it arrived as five studio portraits from one shoot with
 * five profile links.
 *
 * What has not arrived is job titles for everyone, so a card renders every line
 * conditionally. That is deliberate and it is not a placeholder: a role line
 * under a real person's photograph is a claim about their employment. content.ts
 * has the note on what fills them.
 *
 * ============================================================================
 * REBUILT 7 AUG, because the faces were enormous. This is the arithmetic.
 * ============================================================================
 *
 * Roan's report was that the instructor images were too big and that the type
 * was landing on people's chins. Both were the same fault, and it was a fault
 * with one number in it: the width of the card.
 *
 * These portraits are 805 x 1200, and they are tight head-and-shoulders frames,
 * so the head occupies from y 40 to y 700 of the source. `object-cover` on a
 * card whose ratio is wider than 2:3 scales the source to the card's *width*,
 * which fixes the rendered head height at 0.93 x the card width regardless of
 * how tall the card is. The old bento put the four specialists two-by-two inside
 * seven of twelve columns, which is 343px each, so every specialist head
 * rendered 319px tall inside a 360px card: 89% of the card was face, the crown
 * was clipped, and the chin sat 3px above the name.
 *
 * Nothing that could be done to the *height* would have moved it. Taller rows
 * change the crop, not the scale. The card had to get narrower, and 343 came
 * from the bento, so the bento had to go.
 *
 * Four across the full twelve columns is 292px, and 292px is the number that
 * makes the rest of it fall out:
 *
 *   head          0.93 x 292 = 272px, down from 319
 *   card ratio    292 x 438 is 2:3, the source's own ratio, so `object-cover`
 *                 crops nothing at all and the framing on the page is the
 *                 framing the photographer shot
 *   chin          y 700 of 1200 lands at 58% of 438, which is 254px down
 *   text block    115px, so it starts at 323px
 *   clearance     69px of neck and shoulder between the chin and the type
 *
 * That last line is the one Roan asked for. The name is not near anybody's face
 * any more, and it did not have to move down the card to get there: the face
 * moved up out of its way by being the right size.
 *
 * THE TEXT BLOCK IS 147px: name, role over two reserved lines, affiliation, and
 * the "View profile" chip.
 *
 * The chip was cut for one build, on the theory that 36px of clearance had to be
 * bought from somewhere and the whole card could be the link instead. Both halves
 * of that were wrong. The clearance turned out to be 105px rather than the 40 the
 * estimate above predicted, because these heads sit higher in the frame than the
 * 700-of-1200 the arithmetic assumed, so nothing needed buying. And the card was
 * never the link: `before:absolute before:inset-0` resolves against the nearest
 * *positioned* ancestor, which is the bottom-anchored text block, not the article,
 * so the stretched pseudo-element was 292 x 115 and the top three quarters of
 * every card was dead. Worse than dead: `group-hover/tile` still zoomed the
 * photograph and underlined the name over that region, so the card advertised a
 * click it could not take.
 *
 * The chip is back, the cards are not links, and every affordance on them is one.
 *
 * The role reserves two lines whether it needs them or not. Without it Loc's
 * two-line title pushed his name 18px above the other three in the same row,
 * which is the fault the catalog cards fixed with `min-h` and the same fix
 * applies: four cards in a row share one internal grid or they read as four
 * different cards.
 *
 * THE LEAD CARD STOPPED BEING AN OVERLAY. He is 5/12 of nothing now; he is a
 * full-width feature with the portrait in a 292px column and the bio in the
 * space beside it. Same 292, same untouched 2:3 crop, same 272px head.
 *
 * The scrim went with the overlay, and that is the honest version of "reduce the
 * gradient": there is no type over this photograph, so there is nothing for a
 * gradient to make legible. His card was also the worst offender at the old
 * size, because 5/12 of the row is 497px and 0.93 x 497 is a 462px head.
 *
 * THE SCRIM ON THE FOUR, retuned rather than removed. It used to ramp to 66% of
 * the card, which put a wash over the whole face; every one of these five people
 * was shot on the same dark blue backdrop and the wash turned all five of them
 * grey. It is now solid under the type and fully clear by 46% up from the bottom.
 * Measured against the real frames rather than the estimate, the lowest chin of
 * the four sits at 50% up, so there are four points of margin and every pixel of
 * every face is unwashed photograph. The type still sits on 0.87 ink or better.
 *
 * BELOW XL THE FOUR RUN ON A RAIL. Four across needs 1216px of container to give
 * each card its 292; at 1024 the same grid is 228px per card and the whole
 * calculation above inverts. So the grid is xl and up, and below it the four are
 * a full-bleed snap rail with the cards held at the same 2:3 and a 292px cap.
 * The gesture is right for the content either way: a roster is a set to browse.
 */
export function Instructors() {
  const [lead, ...specialists] = instructors.people;

  return (
    <Section id="instructors">
      <SectionHeader
        label="Instructors"
        heading={instructors.headline}
        intro={instructors.intro}
      />

      <div className="flex flex-col gap-4">
        <LeadTile person={lead} />

        {/*
          One element, two layouts. Below xl it is a full-bleed snap rail: the
          negative margin lets a card reach the screen edge while the matching
          padding keeps a snapped card on the content column. From xl it is the
          four-column row the arithmetic at the head of this file is written
          against, and the flex, the scrolling and the bleed all switch off
          together.

          `tabIndex` and a label, because below xl this is a scroll container
          whose only focusable children are the cards themselves. Chrome puts
          such a thing in the tab order by itself, as an anonymous stop with no
          accessible name; naming it fixes that, and having it keeps the rail
          scrollable from a keyboard.
        */}
        {/*
          No `tabIndex` on the container. Chrome adds a scrollable box to the tab
          order by itself only when nothing inside it is focusable, and every card
          carries a profile link again, so the rail is already reachable and
          scrollable from a keyboard through its own contents. The explicit stop
          was there for the build where the cards had no links in them, and at xl
          it was a tab stop on an element that does not scroll.
        */}
        <ul
          aria-label="Specialist instructors"
          className="rail -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 sm:-mx-5 sm:px-5 md:-mx-6 md:px-6 xl:mx-0 xl:grid xl:grid-cols-4 xl:overflow-visible xl:px-0"
        >
          {specialists.map((person) => (
            <li
              key={person.id}
              className="flex w-[70vw] max-w-[292px] shrink-0 snap-start xl:w-auto xl:max-w-none"
            >
              <PersonTile person={person} />
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

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
function LeadTile({ person }: { person: Person }) {
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
          has exactly one source. PersonTile has the same note for the same
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
          left, the ways out on the right. Below sm they stack again, because at
          358px they have to.
        */}
        {person.investments?.length || person.linkedin || person.site ? (
          <div className="mt-6 flex flex-col gap-3 border-t border-white/15 pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
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
                    aria-label={`${person.name} on LinkedIn`}
                    className="t-meta inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 font-medium text-white no-underline ring-1 ring-inset ring-white/20 transition-colors hover:bg-white/25"
                  >
                    <LinkedinLogoIcon
                      size={14}
                      weight="fill"
                      aria-hidden="true"
                      className="flex-none"
                    />
                    View profile
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
function PersonTile({ person }: { person: Person }) {
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
        <p className="t-meta mt-0.5 min-h-[18px] text-white/70">
          {person.org ? (
            person.org.url ? (
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
            )
          ) : null}
        </p>

        {/*
          The profile link, always visible rather than revealed on hover.

          It is the only affordance on the card, and a card whose one affordance
          appears on hover has no affordance at all on a phone. The accessible name
          carries the person, because four links reading "View profile" in a row is
          four identical destinations to anyone reading the page through its link
          list.
        */}
        {person.linkedin ? (
          <a
            href={person.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${person.name} on LinkedIn`}
            className="t-meta mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 font-medium text-white no-underline ring-1 ring-inset ring-white/20 transition-colors hover:bg-white/25"
          >
            <LinkedinLogoIcon size={14} weight="fill" aria-hidden="true" className="flex-none" />
            View profile
          </a>
        ) : null}
      </div>
    </article>
  );
}
