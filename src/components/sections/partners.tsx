import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { Section, SectionHeader } from "@/components/ui";
import { partners } from "@/lib/content";

/**
 * The community partners. Two cards, one compressed band.
 *
 * ======================================================================= place
 *
 * Directly under the review board and above the FAQ, which puts it at the end
 * of the page's people run: who teaches, who learns together, who reviews, who
 * we run with. Then the questions, then the close.
 *
 * The obvious alternative was a logo strip under the fold, which is where every
 * marketplace capture in mockups/ puts one and where block 7 of
 * learning-marketplace-blocks.html sits. page.tsx has the note on why this page
 * does not do that: the band that used to live there was four credibility chips
 * asking to be believed 200px after a headline that promised to show, and it was
 * removed for it. Two partner marks are a better object than four chips were,
 * but they are still the site talking about itself, and the catalog's claim on
 * the first screen under the fold is the strongest lock the page has.
 *
 * ============================================================== ground and rule
 *
 * White, and it has to be. The board above is tinted and the page's one ground
 * rule is that no two tinted bands touch.
 *
 * The knock-on is one line in faq.tsx: the FAQ used to follow the tinted board,
 * which draws its own bottom rule, so it took no `hairlineTop`. It now follows
 * this white band and needs one. Nothing here takes a hairline for the mirror
 * reason — the tinted board above still draws the rule at this band's top edge,
 * and asking for a second stacks two into 2px.
 *
 * `compressed`, at 40/40. Two cards holding four lines between them do not need
 * a full band's 128px of air, and this is a band a reader passes rather than one
 * they stop in.
 *
 * ==================================================================== one shape
 *
 * Both marks are lockups now — a mark and the organisation's name in one file,
 * with a transparent ground — so both are drawn the same way: capped by HEIGHT
 * rather than by width, on the light chip the roster cards use, at 26px inside a
 * 44px chip.
 *
 * It was two shapes for one pass, and the branch is worth recording because it
 * will come back the next time somebody supplies an app icon. The Multimodal
 * Society's mark was the 256px black square their own site header renders: no
 * name in it, and a dark ground that is part of the artwork rather than a
 * background to be stripped. On the white chip it became a 36px stamp inside a
 * frame it never asked for, so it was drawn full-bleed at 44 (`markHasOwnGround`)
 * and the name was set in type beside it (`setNameInType`). Roan supplied the real
 * lockup on 9 Aug and both flags went with the file.
 *
 * The height cap is what makes two lockups of different aspect land at the same
 * optical size: this one is 5.2:1 and The AI Collective's is 3.7:1, and capping by
 * width would draw one of them half the height of the other.
 *
 * 38px inside a 64px chip, up from 26 inside 44 on Roan's instruction to make them
 * bigger. The old numbers came from a rule about wordmarks that does not apply here:
 * a wordmark set to an icon's full height reads as shouting NEXT TO AN ICON, and
 * there is no icon in this band. Both cards hold a lockup and nothing else, so the
 * pair only has to agree with each other, and at 26px they were the smallest thing
 * on a 600px card. `sizes` goes up with them, or the browser keeps picking a
 * candidate for the old box and scaling it up.
 */
export function Partners() {
  return (
    <Section id="partners" compressed ariaLabelledBy="partners-heading">
      <SectionHeader
        id="partners-heading"
        label={partners.label}
        heading={partners.headline}
        intro={partners.intro}
      />

      {/*
        Two cards, side by side from md. Not a logo row.

        A bare row of two marks is the block the mockups call `logostrip`, and at
        1216px it would be two images and 900px of nothing. It also cannot carry
        the thing that makes this band honest, which is each organisation saying
        what it is in its own words. Cards give the quotation somewhere to sit and
        give the link a target bigger than a logo.
      */}
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
        {partners.items.map((p) => (
          <li key={p.id} className="flex">
            {/*
              The whole card is the link, and it can be: there is exactly one
              destination per card and nothing else inside it is interactive, so
              there is no nested-affordance problem of the kind instructor-card
              has a long note about.
            */}
            <a
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex w-full flex-col rounded-[var(--radius-card)] border border-line bg-surface p-5 no-underline transition-colors hover:border-line-strong"
            >
              <span className="flex items-center gap-3">
                {/*
                  One treatment for both: the light chip, 44px tall, the mark
                  capped at 26px of height. The docblock has why, and why there
                  used to be two.

                  `width`/`height` are the intrinsic pixels of the wider of the two
                  files and exist only to give Next an aspect ratio to reserve — the
                  rendered size comes from `h-[26px] w-auto`. They do not need to
                  match either file exactly, and cannot match both.
                */}
                <span className="inline-flex h-16 flex-none items-center justify-center rounded-[var(--radius-control)] bg-white px-3.5 ring-1 ring-inset ring-line">
                  <Image
                    src={p.logo.src}
                    alt={p.logo.alt}
                    width={618}
                    height={120}
                    sizes="260px"
                    className="h-[38px] w-auto"
                  />
                </span>

                {/* The name is in both marks now, so it is never set in type
                    beside them — but it is still the card's accessible name, and a
                    card whose only label is inside an image is a card a screen
                    reader announces as a URL. `setNameInType` in content.ts is the
                    switch if a mark without a name ever arrives again. */}
                {p.setNameInType ? (
                  <span className="t-card-title min-w-0 text-ink group-hover:underline">
                    {p.name}
                  </span>
                ) : (
                  <span className="sr-only">{p.name}</span>
                )}

                <ArrowUpRightIcon
                  size={16}
                  weight="bold"
                  aria-hidden="true"
                  className="ml-auto flex-none text-ink-muted transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
                />
              </span>

              <span className="t-body-sm mt-3 block max-w-[52ch] text-ink-secondary">
                {p.blurb}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}
