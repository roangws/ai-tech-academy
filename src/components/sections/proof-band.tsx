import {
  BookOpenIcon,
  CertificateIcon,
  MicrophoneStageIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr";
/* Type-only, so this is erased at compile time and the client entry point never
   reaches the bundle. The /dist/ssr subpath ships the components but not the
   type. */
import type { Icon } from "@phosphor-icons/react";
import { Section } from "@/components/ui";
import { credibility } from "@/lib/content";

/**
 * Credibility band, hairline-bounded and compressed.
 *
 * This slot used to restate the hero: "5 role-based paths, 5 modules each" was
 * already in the facts cluster 200px above it, and all three items were claims
 * rather than facts. Every reference spends this position on borrowed or
 * checkable authority instead, so it carries the four records that exist: the
 * review board, the book, the keynote and the patent filing.
 *
 * Two changes on this pass. The first item's two lines were the wrong way
 * round, so a category sat above a proper noun and the row named a thing
 * without saying anything about it; content.ts has the note. And each item
 * gained a glyph, because four items in four columns separated only by a
 * hairline is the flattest a band of four distinct records can be drawn.
 *
 * Icons are 18px and neutral. They mark the item, they do not illustrate it,
 * which is why nothing here is filled or accented: the accent lock keeps that
 * for controls, and a coloured icon at this size reads as a status.
 *
 * Company logos belong in this band too and are deliberately absent until there
 * are partners to name.
 */
const glyphs: Record<string, Icon> = {
  board: UsersThreeIcon,
  book: BookOpenIcon,
  keynote: MicrophoneStageIcon,
  patent: CertificateIcon,
};

export function ProofBand() {
  return (
    <Section tint compressed ariaLabel="Credentials on record">
      <p className="t-label text-ink-muted">{credibility.label}</p>
      <ul className="mt-4 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
        {credibility.items.map((item) => {
          const Glyph = glyphs[item.id];
          return (
            <li key={item.id} className="border-t border-line-strong pt-3">
              <div className="flex items-center gap-2">
                {Glyph ? (
                  <Glyph
                    size={18}
                    weight="regular"
                    aria-hidden="true"
                    className="flex-none text-ink-secondary"
                  />
                ) : null}
                <p className="t-label text-ink-muted">{item.fact}</p>
              </div>
              <p className="t-card-title mt-2 text-ink">{item.detail}</p>
              <p className="t-meta mt-1 text-ink-muted">{item.meta}</p>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
