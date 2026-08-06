import { Section, SectionHeader, SkillChip } from "@/components/ui";
import { categories, paths } from "@/lib/content";

/**
 * Skill cloud, ported from the marketplace `categories` block.
 *
 * Grouped by path rather than run as one flat set. The flat version was
 * nineteen grey chips in a single wrapped blob, which is the least informative
 * shape available for a list where every item already belongs to a named group:
 * a reader could see that nineteen skills exist and learn nothing about which
 * path teaches which. Grouping is free here, because the five paths share no
 * skill between them, so nothing is duplicated and nothing is lost.
 *
 * Each group header carries its path's hue as a 8px dot, the same colour that
 * path's cover uses in the catalog two sections above. That is the only job the
 * colour does: it links the group to a card the reader has already seen.
 *
 * The list is derived from the five paths rather than retyped, so a skill added
 * to a path shows up here and a stale duplicate cannot drift in.
 *
 * The mockup's chips are links to category pages. These are not links. There is
 * no page behind a skill yet, and a chip that navigates nowhere is the dead
 * control this project removed from the header search once already.
 */
export function Categories() {
  return (
    <Section compressed hairlineTop ariaLabelledBy="categories-heading">
      <SectionHeader
        id="categories-heading"
        label={categories.label}
        heading={categories.headline}
        intro={categories.intro}
      />

      <ul className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {paths.map((p) => (
          <li key={p.id} className="border-t border-line pt-3">
            <p className="t-field flex items-center gap-2 text-ink-secondary">
              <span
                aria-hidden="true"
                className="h-2 w-2 flex-none rounded-full"
                style={{ background: p.ground }}
              />
              {p.badge}
            </p>
            {/* Two lines reserved. Path B's audience wraps and the others do
                not, so without the box the five chip stacks start at four
                different heights across one row. */}
            <p className="t-meta clamp-2 mt-1 text-ink-muted sm:min-h-9">{p.coverAudience}</p>

            <ul className="mt-3 flex flex-wrap gap-1.5">
              {p.skills.map((skill) => (
                <li key={skill}>
                  <SkillChip>{skill}</SkillChip>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </Section>
  );
}
