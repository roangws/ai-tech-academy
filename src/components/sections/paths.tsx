import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import {
  ButtonLink,
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
 * The grid is 3 x 2. The lead path takes the whole first column as a tall
 * featured card carrying its curriculum, and the other four fill the remaining
 * four cells. Six cells, five cards, no empty slot.
 *
 * Rebuilt on 6 Aug. Three things were wrong and all three were in the top half
 * of every card:
 *
 *   1. Five identical covers. One flat tile with the app icon centred, repeated
 *      five times with the hue varying by a few degrees, occupying roughly 40%
 *      of the section and carrying zero information. Covers are now drawn in the
 *      DOM on a ground unique to each path, and they state the path letter, the
 *      audience and the artifact.
 *   2. Identical meta. Paths A through D all read "5 modules, 6 weeks,
 *      Intermediate", so four cards showed the same three facts. Each card now
 *      carries what differs: the thing you build, what it runs on, and the level.
 *   3. Hollow second row. The featured card set the row height and the small
 *      cards padded out the difference with empty space. Each one now carries a
 *      three-row curriculum preview, which repeats the featured card's strongest
 *      idea four more times and fills the height with content.
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

      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
        <li className="flex items-start sm:col-span-2 lg:col-span-1 lg:row-span-2">
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
    <article className="flex w-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-e1">
      <PathCover
        ground={path.ground}
        badge={path.badge}
        letter={path.badge.replace("Path ", "")}
        audience={path.coverAudience}
        build={path.coverBuild}
        tall
      />

      <div className="flex min-w-0 flex-col p-5">
        <h3 className="t-h3 text-ink">{path.title}</h3>
        <p className="t-body-sm mt-2 text-ink-secondary">{path.summary}</p>

        <dl className="mt-3 space-y-1.5">
          <div className="flex gap-2">
            <dt className="t-meta w-[68px] flex-none text-ink-muted">For</dt>
            <dd className="t-meta min-w-0 flex-1 text-ink">{path.audience}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="t-meta w-[68px] flex-none text-ink-muted">Pace</dt>
            <dd className="t-meta min-w-0 flex-1 text-ink">
              {path.modules}
              <span className="px-1.5 text-line-strong">&middot;</span>
              {path.duration}
              <span className="px-1.5 text-line-strong">&middot;</span>
              {path.level}
            </dd>
          </div>
        </dl>

        {/*
          The card takes its natural height rather than stretching to fill the
          two-row cell. Stretching pooled the leftover into whichever child was
          allowed to grow: first a 421px field of flat cover colour, then a void
          under the buttons, then 78px gaps between module rows. Leftover in the
          grid cell is section ground, which is invisible, so the li aligns to
          the start and the card simply ends where its content ends.
        */}
        <div className="mt-4 border-t border-line pt-3">
          <p className="t-meta font-semibold text-ink-secondary">The five modules</p>
          <ol className="mt-2">
            {path.curriculum.map((m) => (
              <li key={m.n} className="flex items-center gap-2.5 py-1">
                <span className="t-meta w-5 flex-none text-ink-muted">{m.n}</span>
                <span className="t-body-sm min-w-0 flex-1 truncate text-ink">{m.name}</span>
                {m.open ? <StatusChip open>Open</StatusChip> : null}
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-4 border-t border-line pt-3">
          <p className="t-meta font-semibold text-ink-secondary">Skills you practice</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {path.skills.map((s) => (
              <li key={s}>
                <SkillChip>{s}</SkillChip>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-line pt-4">
          <ButtonLink href="#paths" tone="secondary" size="md">
            {cta.primary}
          </ButtonLink>
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
 */
function PathCard({ path }: { path: Path }) {
  const preview = path.curriculum.slice(0, 3);

  return (
    <article className="group relative flex h-full w-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-e1 transition-[border-color,box-shadow] duration-150 hover:border-line-strong hover:shadow-e2">
      <PathCover
        ground={path.ground}
        badge={path.badge}
        letter={path.badge.replace("Path ", "")}
        audience={path.coverAudience}
        build={path.coverBuild}
      />

      <div className="flex flex-1 flex-col p-5">
        <h3 className="t-card-title clamp-2 text-ink">
          <Link
            href={`/paths/${path.id}`}
            className="text-ink no-underline before:absolute before:inset-0"
          >
            {path.title}
          </Link>
        </h3>

        <p className="t-body-sm clamp-2 mt-1 text-ink-secondary">{path.summary}</p>

        <dl className="mt-3 grid grid-cols-3 gap-x-3 border-t border-line pt-3">
          {path.facts.map((f) => (
            <div key={f.label} className="min-w-0">
              <dt className="t-field text-ink-muted">{f.label}</dt>
              <dd className="t-meta mt-1 truncate text-ink">{f.value}</dd>
            </div>
          ))}
        </dl>

        <ol className="mt-3 border-t border-line pt-3">
          {preview.map((m) => (
            <li key={m.n} className="flex items-center gap-2.5 py-[3px]">
              <span className="t-meta w-5 flex-none text-ink-muted">{m.n}</span>
              <span className="t-body-sm min-w-0 flex-1 truncate text-ink-secondary">
                {m.name}
              </span>
              {m.open ? <StatusChip open>Open</StatusChip> : null}
            </li>
          ))}
          <li className="t-meta pl-[30px] pt-1 text-ink-muted">
            and {path.curriculum.length - preview.length} more
          </li>
        </ol>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3">
          <span className="t-meta text-ink-muted">{path.modules}</span>
          <span aria-hidden="true" className="t-button inline-flex items-center gap-1 text-accent">
            {cta.path}
            <ArrowRightIcon
              size={13}
              weight="bold"
              className="transition-transform duration-150 group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </div>
    </article>
  );
}
