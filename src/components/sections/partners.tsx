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
 * ================================================================== two shapes
 *
 * The two marks are not the same kind of file, and the card handles it rather
 * than the assets: one is a lockup with the name set into it, the other is a
 * square mark whose owner pairs it with the name in type. content.ts carries the
 * reasoning; the visible rule here is that the row's identity block is 44px tall
 * either way, so the two cards agree on their first baseline no matter which
 * shape fills it.
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
                  Two mark treatments, 44px tall either way.

                  A lockup goes on the light chip the roster cards use, capped by
                  height rather than width so it lands at the same optical size
                  whatever its aspect. 26px inside a 44px chip, because a
                  wordmark set to an icon's full height reads as shouting next to
                  one.

                  A mark that ships its own ground is drawn edge to edge instead.
                  The Multimodal Society's is a black square with the ground as
                  part of the design, and on a white chip it became a 36px stamp
                  inside a frame it never asked for. Full-bleed at 44 it reads as
                  what it is. content.ts has the flag and the precedent, which is
                  `keepBox` in scripts/prepare-logos.mjs.
                */}
                {p.markHasOwnGround ? (
                  <Image
                    src={p.logo.src}
                    alt={p.logo.alt}
                    width={256}
                    height={256}
                    sizes="88px"
                    className="h-11 w-11 flex-none rounded-[var(--radius-control)] object-cover ring-1 ring-inset ring-black/10"
                  />
                ) : (
                  <span className="inline-flex h-11 flex-none items-center justify-center rounded-[var(--radius-control)] bg-white px-2.5 ring-1 ring-inset ring-line">
                    <Image
                      src={p.logo.src}
                      alt={p.logo.alt}
                      width={442}
                      height={120}
                      sizes="180px"
                      className="h-[26px] w-auto"
                    />
                  </span>
                )}

                {/* Printed only for a mark that does not contain its owner's
                    name. See content.ts. */}
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
