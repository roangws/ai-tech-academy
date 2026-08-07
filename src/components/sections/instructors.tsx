import Image from "next/image";
import { ArrowUpRightIcon, LinkedinLogoIcon } from "@phosphor-icons/react/dist/ssr";
import { Photo, Section, SectionHeader } from "@/components/ui";
import { instructors, type Person } from "@/lib/content";

/**
 * The roster, in the review board's language: a bento of portrait cards.
 *
 * The previous version was a white card with a 56px avatar and three lines of
 * type beside it, four times. It was tidy and it was a table of roles. The board
 * two sections down had already worked out the better answer for the same
 * problem, so this section now speaks it:
 *
 *   - the portrait is the card, edge to edge, not an avatar sitting on one
 *   - the name and the role sit on the frame under an ink scrim
 *   - the hue bar is the tie to that path's cover in the catalog
 *   - what a person actually does arrives on hover, so the resting grid stays
 *     four faces and four titles rather than four paragraphs
 *
 * The bento is Roan at 5/12 of the row and the four specialists two by two
 * beside him. He is not one of five equal things: he writes the curriculum and
 * records every core lesson, and a grid of five identical cards said the
 * opposite.
 *
 * FIVE REAL PEOPLE, as of 7 Aug. This section spent its whole life working
 * around not having them. It ran grey monogram tiles, then text-only slots,
 * then faceless illustrations in path hues, each version an answer to the same
 * question: how do you show a roster you cannot name? The answer turned out to
 * be that you wait, and it arrived as five studio portraits from one shoot with
 * five profile links.
 *
 * Everything built for the old problem is gone with it. No illustrated figures,
 * no GMI stand-in wordmark, no footnote explaining what the frames are waiting
 * for, and no corrective scale on the crop.
 *
 * What has not arrived is job titles, so four of the five cards carry a name
 * and a profile link and nothing else. That is deliberate and it is not a
 * placeholder: a role line under a real person's photograph is a claim about
 * their employment. PersonTile renders every line conditionally so the card is
 * complete either way, and content.ts has the note on what fills them.
 *
 * BELOW LG THE FOUR SPECIALISTS RUN ON A RAIL. This was the single most
 * expensive section on a phone: the bento collapses to one column, so the lead
 * ran 420px and then four 248px cards stacked under it, and the roster alone
 * was 1,790px of a 14,955px page. Nobody scrolls past four near-identical dark
 * tiles reading each one.
 *
 * Sideways, the same four cost one card's height instead of four, and the
 * gesture is right for the content: a roster is a set to browse, not a sequence
 * to read down. The lead stays full width above them, because he is not one of
 * five equal things and putting him in the rail would say he was.
 *
 * No arrows and no indicator here, unlike the review board. Four cards at 64vw
 * means the second one is already half on screen at rest, which is the whole
 * affordance, and the board's controls exist because six cards is a set a
 * reader wants to know the size of.
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <PersonTile person={lead} lead />
        </div>

        {/*
          One element, two layouts. Below lg it is a full-bleed snap rail: the
          negative margin lets a card reach the screen edge while the matching
          padding keeps a snapped card on the content column. From lg it is the
          two-by-two grid the bento needs, and the flex, the scrolling and the
          bleed all switch off together.
        */}
        {/* `tabIndex` and a label, because below lg this is a scroll container
            with no focusable children in it. Chrome puts such a thing in the
            tab order by itself, as an anonymous stop with no accessible name;
            Safari does not put it there at all, which leaves three of the four
            specialists unreachable from a keyboard. Naming it fixes the first
            and having it fixes the second. */}
        {/*
          `auto-rows` is what makes the bento a bento.

          Without it the two specialist rows had no height of their own, so they
          stretched to whatever the lead card happened to be and distributed the
          slack as a 131px hole between them. Naming the row height inverts the
          dependency: these four set the row, and the lead takes `h-full` of it.
          That is also the only arrangement where the lead's height is a
          consequence of something rather than a number somebody has to keep in
          sync with 2 x 248 + 16.

          360 rather than 302, and the number is arithmetic rather than taste.

          `object-cover` scales a 2:3 portrait to the card's width, so at 343px
          across the head lands 202px tall whatever the card's height is. The
          text block under it is about 140px. 202 + 140 is 342, so at 302 the
          two could not both fit and the name was always printed across
          somebody's chin. 360 gives the head its 202, the text its 140, and
          18px between them.

          Making the card shorter and the head smaller is not available: the
          head's size is set by the card's width, and the width is the bento's.
        */}
        <ul
          tabIndex={0}
          aria-label="Specialist instructors"
          className="rail -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 sm:-mx-5 sm:px-5 md:-mx-6 md:px-6 lg:col-span-7 lg:mx-0 lg:grid lg:auto-rows-[360px] lg:grid-cols-2 lg:overflow-visible lg:px-0"
        >
          {specialists.map((person) => (
            <li
              key={person.id}
              className="flex w-[64vw] max-w-[260px] shrink-0 snap-start lg:h-full lg:w-auto lg:max-w-none"
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
 * One tile. The lead runs the full height of the row; a specialist takes a
 * quarter of the grid beside it, which is what makes the two heights line up
 * without either card being padded out.
 */
function PersonTile({ person, lead = false }: { person: Person; lead?: boolean }) {
  return (
    <article
      className={`group/tile relative w-full overflow-hidden rounded-[var(--radius-feature)] bg-ink-band ${
        /* No `min-h` on the lead any more. It takes the row the four specialists
           set; see the note at the rail. */
        /*
           Mobile heights are set the same way as the desktop rows: head height
           plus text height. A specialist card at 260px across puts the head at
           153px and its text at about 130, so 300 clears with room; the lead
           carries a headline, a three-line blurb, an investor line and two link
           chips, about 270px of text under a 211px head, so it needs 500.
        */
        lead ? "h-[520px] sm:h-[540px] lg:h-full" : "h-[300px] lg:h-full"
      }`}
    >
      {/*
        The photograph is taken out of flow, and it has to be.

        `PersonTile` sets `lg:h-full` on the lead so the four specialists decide
        the row. But an in-flow `<img>` contributes its own intrinsic height to
        that row, and once the file loads the browser swaps the declared ratio
        for the real one. These portraits are 2:3 and the old attributes said
        900 x 1120, so the lead measured 620 before the image arrived and 741
        after: the bento was correct on first paint and 120px out of alignment a
        moment later, which is why it looked fine in a DOM measurement taken
        above the fold and wrong in a screenshot taken at it.

        Absolutely positioned, the picture cannot contribute anything, and the
        row height has exactly one source. The attributes are corrected to the
        real 2:3 anyway, so the reserved box is right for anything that reads it.
      */}
      {person.photo ? (
        <span aria-hidden="true" className="absolute inset-0 block">
        <Photo
          image={person.photo}
          width={lead ? 800 : 520}
          height={lead ? 1192 : 775}
          sizes={lead ? "(max-width: 1024px) 100vw, 500px" : "(max-width: 640px) 66vw, 350px"}
          /*
            Crops for real head-and-shoulders frames.

            These are studio portraits at 2:3 with the face high in the frame,
            which is a different problem from the illustrations they replace.
            `object-cover` scales the source to the card's width, so in a 343px
            column the head is 202px tall whatever else changes, and it lands at
            y 20-222 of the 511px scaled frame. The card is 360 and its text
            block takes the bottom 140, which leaves the window two bounds:
            past 13% it cuts the crown, under 1.3% it pushes the chin behind the
            name. 8% is the middle of that, putting the head 8px below the top
            edge with 10px of clear frame under the jaw.

            The lead card is almost exactly the source's own ratio, so it crops
            about five pixels in total and the value barely matters there.

            No corrective scale on either. The specialist tiles ran at 1.2 for
            one pass to hide a pale margin the illustrations came back with, and
            that patch left with the illustrations.
          */
          className="object-[center_8%] transition-transform duration-500 group-hover/tile:scale-[1.04]"
        />
        </span>
      ) : null}

      {/*
        Reading scrim, retuned to stop at the chin.

        It used to ramp all the way to the top of the card, so the whole
        photograph sat under a wash and the faces went grey. It now runs solid
        under the text block, releases fast just above it, and is fully clear
        over the top half of the frame: `to-transparent` lands at 66% on a
        specialist and 74% on the lead, which is where each one's text stops.

        The percentages track the text block's own height, so if a card gains a
        line these have to move with it. Both are gradients up from the bottom,
        so `via-32%` is a third of the way up, not down.
      */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 bg-linear-to-t from-[rgb(13_26_34/0.96)] ${
          lead
            ? "via-[rgb(13_26_34/0.80)] via-38% to-transparent to-76%"
            : "via-[rgb(13_26_34/0.78)] via-32% to-transparent to-66%"
        }`}
      />

      {/*
        No hue bar across the top.

        The board carries one and it earns it there: those cards are otherwise
        identical, and the bar is the only thing telling six of them apart as
        they move past. Here every tile is a different size or a different
        person and each already states its path in words at the foot, so the bar
        was a fifth stripe of colour doing a job three other elements had
        already done. It also cut a hard line across the top of a photograph.
      */}
      {/*
        The employer mark, on a light chip.

        Two of these four marks are dark by design (a navy university wordmark
        and a black app icon), so laying them straight onto a dark photograph
        would show two of the four and lose two. A chip makes the card's
        treatment independent of what colour anyone's brand happens to be, which
        is the only version of this that keeps working as marks are added.

        `alt=""` on purpose. The organisation is named in text directly below,
        so a screen reader announcing the mark would read the same employer
        twice per card.
      */}
      {person.logo ? (
        <span className="absolute right-3 top-4 inline-flex h-8 items-center rounded-[7px] bg-white/92 px-2 shadow-[0_1px_3px_rgb(0_0_0/0.25)]">
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

      {person.lead ? (
        <span className="t-label absolute left-4 top-5 inline-flex h-[22px] items-center rounded-full bg-white/20 px-2.5 text-white backdrop-blur-sm">
          Lead instructor
        </span>
      ) : null}

      {/*
        Every line below is conditional, and that is the design rather than
        defensive coding.

        Four of these five are real, named people whose job titles nobody has
        supplied yet. A role line under a real person's photograph is a claim
        about their employment, so the card has to be able to say nothing where
        it does not know something. Rendered as written, a card with only a name
        and a profile link is a complete object: portrait, who it is, where to
        read more. content.ts has the full note.
      */}
      <div className={`absolute inset-x-0 bottom-0 ${lead ? "p-6" : "p-4"}`}>
        {person.scope ? <p className="t-label text-white/60">{person.scope}</p> : null}

        <h3
          className={`text-white ${lead ? "t-h3" : "t-card-title"} ${person.scope ? "mt-1.5" : ""}`}
        >
          {person.name}
        </h3>

        {person.role ? (
          <p className={`mt-0.5 text-white/75 ${lead ? "t-body-sm" : "t-meta"}`}>{person.role}</p>
        ) : null}

        {/* The second affiliation. Linked where a URL was supplied and plain
            text where one was not, rather than guessing at a domain. */}
        {person.org ? (
          <p className="t-meta mt-0.5 text-white/55">
            {person.org.url ? (
              <a
                href={person.org.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 underline decoration-white/30 underline-offset-2 transition-colors hover:text-white hover:decoration-white/70"
              >
                {person.org.name}
              </a>
            ) : (
              person.org.name
            )}
          </p>
        ) : null}

        {/*
          The detail, revealed on hover and present in the document either way.

          A collapsed grid row rather than a mounted node, so a screen reader
          reads it, a keyboard user reaches it, and anyone whose browser never
          fires a hover still has it. The lead's is always open: his card has the
          height for it and he is the one person here a visitor has a reason to
          read about before they decide anything.
        */}
        {person.detail ? (
          lead ? (
            <p className="t-body-sm mt-3 max-w-[42ch] text-white/85">{person.detail}</p>
          ) : (
            <p className="t-meta grid grid-rows-[0fr] text-white/0 transition-[grid-template-rows,color,margin] duration-300 group-hover/tile:mt-2 group-hover/tile:grid-rows-[1fr] group-hover/tile:text-white/85">
              <span className="overflow-hidden">{person.detail}</span>
            </p>
          )
        ) : null}

        {/*
          The profile link, always visible rather than revealed on hover.

          On the cards with no detail it is the only thing under the name, and a
          card whose one affordance appears on hover has no affordance at all on
          a phone. The accessible name carries the person, because five links
          reading "View profile" in a row is five identical destinations to
          anyone reading the page through the link list.
        */}
        {/*
          The investor line, for the one person who has one.

          Named and linked rather than counted: "investor in three companies"
          asks to be believed, three names a reader can open can be checked, and
          that is the standard the rest of this page holds itself to.
        */}
        {person.investments?.length ? (
          <p className="t-micro mt-2 text-white/55">
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

        {(person.linkedin || person.site) && (
          <span className="mt-2.5 flex flex-wrap items-center gap-2">
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
        )}
      </div>
    </article>
  );
}
