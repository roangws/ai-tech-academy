import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Section, SectionHeader } from "@/components/ui";
import { goals, paths } from "@/lib/content";

/**
 * Role router, ported from the marketplace `goals` block.
 *
 * The mockup renders its tiles as pills centred in a tinted panel. Two changes
 * were needed for this page. The pills carry two lines here rather than one,
 * because a path letter and an audience are both worth stating, and a pill
 * cannot hold two ranks of type without losing its shape. And they align left
 * on a grid instead of centring, since five tiles centred leave a two-up orphan
 * row at every width this container resolves to.
 *
 * Each tile now carries the hue of the path it routes to, drawn as a 3px edge.
 * This is the first appearance of that colour on the page and the catalog is
 * two sections below, so the router doubles as the key: a reader who picks a
 * tile here meets the same colour on the cover when they get there. The hue is
 * looked up from `paths` by id rather than restated in `goals`, so one source
 * owns it.
 *
 * Every tile links to the catalog rather than to a path page, because the path
 * pages are unbuilt. The anchor is honest about where it lands.
 */
export function Goals() {
  const grounds = new Map(paths.map((p) => [p.id, p.ground]));

  return (
    <Section hairlineTop ariaLabelledBy="goals-heading">
      <SectionHeader id="goals-heading" heading={goals.headline} intro={goals.intro} />

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {goals.tiles.map((tile) => (
          <li key={tile.id} className="flex">
            <Link
              href="#paths"
              className="group relative flex w-full items-start justify-between gap-3 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface py-4 pl-[17px] pr-4 no-underline transition-colors hover:border-line-strong hover:bg-surface-subtle"
            >
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-[3px]"
                style={{ background: grounds.get(tile.id) }}
              />
              <span className="min-w-0">
                <span className="t-label block text-ink-muted">{tile.badge}</span>
                <span className="t-body-sm mt-1.5 block font-medium text-ink">{tile.label}</span>
              </span>
              <ArrowRightIcon
                size={14}
                weight="bold"
                aria-hidden="true"
                className="mt-0.5 flex-none text-line-strong transition-colors group-hover:text-accent"
              />
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
