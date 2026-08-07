import Image from "next/image";
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
 * opposite. His card is the only one with a photograph in it, which the size
 * difference now lets a reader see rather than infer.
 *
 * The specialist portraits are the illustrated placeholders, and they carry
 * their own coloured ground, so they fill a card the way a photograph does
 * instead of floating in one.
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
        <ul
          tabIndex={0}
          aria-label="Specialist instructors"
          className="rail -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 sm:-mx-5 sm:px-5 md:-mx-6 md:px-6 lg:col-span-7 lg:mx-0 lg:grid lg:grid-cols-2 lg:overflow-visible lg:px-0"
        >
          {specialists.map((person) => (
            <li
              key={person.id}
              className="flex w-[64vw] max-w-[260px] shrink-0 snap-start lg:w-auto lg:max-w-none"
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
        lead ? "h-[340px] sm:h-[400px] lg:h-full lg:min-h-[520px]" : "h-[230px] lg:h-[248px]"
      }`}
    >
      {person.photo ? (
        <Photo
          image={person.photo}
          width={lead ? 900 : 560}
          height={lead ? 1120 : 560}
          sizes={lead ? "(max-width: 1024px) 100vw, 500px" : "(max-width: 640px) 100vw, 300px"}
          /*
            No corrective scale on either variant.

            The specialist tiles ran at 1.2 for one pass, because the
            illustrations had come back matted: the model framed each figure as
            a print on paper, so every one carried a pale margin on all four
            sides and `object-cover` filled the tile with it, drawing a light
            border down both edges of a dark card. Scaling past the margin
            worked and was a patch on the wrong layer. The prompt now states
            full bleed as a construction rule rather than implying it with "no
            border", the artwork reaches its own edges, and the crop is back to
            an honest one.
          */
          className={`transition-transform duration-500 group-hover/tile:scale-[1.04] ${
            lead ? "object-[center_22%]" : "object-[center_28%]"
          }`}
        />
      ) : null}

      {/* Reading scrim. Deeper on the small tiles, because their type block
          starts higher up a shorter frame. */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 bg-linear-to-t from-[rgb(13_26_34/0.94)] to-transparent ${
          lead ? "via-[rgb(13_26_34/0.18)] via-42%" : "via-[rgb(13_26_34/0.34)] via-52%"
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
      {person.logo ? (
        <Image
          src={person.logo.src}
          alt=""
          width={260}
          height={84}
          sizes="88px"
          className="absolute right-4 top-5 h-[15px] w-auto opacity-80"
        />
      ) : null}

      {person.lead ? (
        <span className="t-label absolute left-4 top-5 inline-flex h-[22px] items-center rounded-full bg-white/20 px-2.5 text-white backdrop-blur-sm">
          Lead instructor
        </span>
      ) : null}

      <div className={`absolute inset-x-0 bottom-0 ${lead ? "p-6" : "p-4"}`}>
        <p className="t-label text-white/60">{person.scope}</p>
        <h3 className={`mt-1.5 text-white ${lead ? "t-h3" : "t-card-title"}`}>{person.name}</h3>
        <p className={`mt-0.5 text-white/70 ${lead ? "t-body-sm" : "t-meta"}`}>{person.role}</p>

        {/*
          The detail, revealed on hover and present in the document either way.

          A collapsed grid row rather than a mounted node, so a screen reader
          reads it, a keyboard user reaches it, and anyone whose browser never
          fires a hover still has it. The lead's is always open: his card has the
          height for it and he is the one person here a visitor has a reason to
          read about before they decide anything.
        */}
        {lead ? (
          <p className="t-body-sm mt-3 max-w-[42ch] text-white/85">{person.detail}</p>
        ) : (
          <p className="t-meta grid grid-rows-[0fr] text-white/0 transition-[grid-template-rows,color,margin] duration-300 group-hover/tile:mt-2 group-hover/tile:grid-rows-[1fr] group-hover/tile:text-white/85">
            <span className="overflow-hidden">{person.detail}</span>
          </p>
        )}
      </div>
    </article>
  );
}
