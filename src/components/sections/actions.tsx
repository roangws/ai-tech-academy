import {
  ArrowRightIcon,
  PlayCircleIcon,
  SquaresFourIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import Link from "next/link";
import { Section } from "@/components/ui";
import { actions } from "@/lib/content";

/**
 * Three action tiles, ported from the marketplace `actions` block.
 *
 * The mockup puts a filled icon plate on each tile. These carry a tinted plate
 * with a neutral glyph instead. The accent lock allows one filled element per
 * section and the very next section is the final call to action, so three
 * saturated plates directly above it would spend the emphasis the page has been
 * saving. The plate still does the work the mockup wanted from it: three tiles
 * whose only difference was their text now differ before the text is read.
 *
 * The tiles restate destinations a reader has already passed rather than adding
 * new ones. That is the point of the block at this position: it is the last
 * chance to route someone who has read the page and not yet picked.
 */
const glyphs: Record<string, Icon> = {
  module: PlayCircleIcon,
  paths: SquaresFourIcon,
  teams: UsersThreeIcon,
};

export function Actions() {
  return (
    <Section hairlineTop compressed ariaLabelledBy="actions-heading">
      <h2 id="actions-heading" className="t-h2 mb-6 text-ink">
        {actions.headline}
      </h2>

      <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {actions.tiles.map((tile) => {
          const Glyph = glyphs[tile.id];
          return (
            <li key={tile.id} className="flex">
              <Link
                href={tile.href}
                className="group flex w-full items-center gap-4 rounded-[var(--radius-card)] border border-line bg-surface px-5 py-4 no-underline transition-colors hover:border-line-strong hover:bg-surface-subtle"
              >
                {Glyph ? (
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[var(--radius-control)] bg-surface-subtle text-ink transition-colors group-hover:bg-surface">
                    <Glyph size={20} weight="regular" aria-hidden="true" />
                  </span>
                ) : null}

                <span className="min-w-0 flex-1">
                  <span className="t-card-title block text-ink">{tile.title}</span>
                  <span className="t-meta mt-1 block text-ink-muted">{tile.detail}</span>
                </span>

                <ArrowRightIcon
                  size={16}
                  weight="bold"
                  aria-hidden="true"
                  className="flex-none text-line-strong transition-colors group-hover:text-accent"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
