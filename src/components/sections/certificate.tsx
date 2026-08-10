import { SealCheckIcon } from "@phosphor-icons/react/dist/ssr";

import { FactsLine, Section, SectionHeader, TextAction } from "@/components/ui";
import { certificate } from "@/lib/content";

/**
 * The certificate, in a third of a screen.
 *
 * ------------------------------------------------------------------ the size
 *
 * Deliberately the smallest section on this page. A certificate is a supporting
 * reason to take a free course and never the reason, and the two sections
 * directly above this one have already made the argument that matters: a
 * workflow that runs, and a measure that proves it changed something. A band
 * that shouted about the certificate would be advertising the receipt.
 *
 * ---------------------------------------------------------------- the ground
 *
 * White, and that is not a free choice. Outcomes above is tinted and Instructors
 * below is white, and two tinted bands cannot meet — the rule is in DESIGN-SPEC
 * §7 and restated in the page's own docblock. A tinted band here would have
 * moved the seam rather than removed it.
 *
 * ---------------------------------------------------------- no specimen image
 *
 * The four fields are the whole visual. A picture of a certificate on this page
 * would be either somebody's real record published as an advertisement or an
 * invented one printed with an invented name, and there is no third option. The
 * imagery policy in the design spec bans the second outright; the first is worse.
 */
export function Certificate() {
  return (
    <Section id="certificate" ariaLabelledBy="certificate-heading">
      <SectionHeader
        id="certificate-heading"
        label={certificate.label}
        heading={certificate.headline}
        intro={certificate.intro}
        action={<TextAction href={certificate.action.href}>{certificate.action.label}</TextAction>}
      />

      {/*
        Full width, in two rows, rather than a two-column split.

        The first draft put the heading beside the fields in a 1fr/600px grid,
        which left the left column three lines long against a four-item block and
        a third of the band empty under it. The four fields are the content here
        and they want the measure; the label and the facts are one row above
        them.
      */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 border-t border-line pt-6">
        <h3 className="t-h3 flex items-center gap-2.5 text-ink">
          <SealCheckIcon
            size={22}
            weight="fill"
            aria-hidden="true"
            className="flex-none text-state-open"
          />
          {certificate.fields.label}
        </h3>
        <FactsLine items={[...certificate.facts]} />
      </div>

      {/*
        A definition list, because that is what these four are: a term and the
        thing it means on the document. Rendering them as `<dl>` costs nothing and
        is the difference between a screen reader announcing four pairs and
        announcing eight unrelated lines.
      */}
      <dl className="mt-7 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
        {certificate.fields.items.map((f) => (
          <div key={f.title}>
            <dt className="t-card-title text-ink">{f.title}</dt>
            <dd className="t-body-sm mt-1.5 text-ink-secondary">{f.text}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
