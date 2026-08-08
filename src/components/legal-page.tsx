import type { ReactNode } from "react";
import Link from "next/link";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { Section } from "@/components/ui";
import { legal } from "@/lib/content";

/**
 * The shell both legal pages render into.
 *
 * Terms and Privacy are the same document twice — a title, an intro, and a run
 * of headed prose — so they are one component and two data objects rather than
 * two nearly-identical pages. content.ts holds the words.
 *
 * ------------------------------------------------------------- THE DRAFT NOTE
 *
 * Printed at the top of both, before the first clause, and it is the reason
 * these pages can be published at all.
 *
 * The alternative was a generated policy covering cookie consent, third-party
 * processors, advertising identifiers and international transfers. Every clause
 * of that would describe something this site does not do. That is not the safe
 * direction: a policy overstating what is collected licenses collection that is
 * not happening, and it teaches a reader that the document is boilerplate to be
 * skipped. The auth screens already say the form is not live; these say the same
 * thing about themselves, in the same voice, for the same reason.
 *
 * ------------------------------------------------------------------ PLACEHOLDERS
 *
 * `{entity}`, `{address}`, `{jurisdiction}` and `{contact}` are substituted from
 * `legal.pending` and rendered as visibly marked gaps rather than as invented
 * text. A privacy policy that names a jurisdiction nobody chose is worse than
 * one that admits it does not have it yet — the first is a false statement about
 * where a reader's rights are enforced.
 *
 * They are `<mark>` elements, so they are announced as marked text and are
 * impossible to miss on a page skim. When the real values land, the tokens are
 * replaced in content.ts and this component keeps working unchanged.
 *
 * ------------------------------------------------------------------- THE MEASURE
 *
 * 68 characters, which is the site's measure everywhere else. Legal text is the
 * one place a reader is most likely to give up, so it gets the same care as the
 * marketing copy rather than being dumped full-bleed.
 */
export function LegalPage({ doc }: { doc: typeof legal.terms | typeof legal.privacy }) {
  return (
    <Section>
      <div className="max-w-[720px]">
        <nav aria-label="Breadcrumb" className="t-meta">
          <ol className="flex flex-wrap items-center gap-x-2">
            <li>
              <Link
                href="/"
                className="text-ink-muted no-underline transition-colors hover:text-accent hover:underline"
              >
                Home
              </Link>
            </li>
            <li aria-hidden="true" className="text-line-strong">
              /
            </li>
            <li>
              <span aria-current="page" className="text-ink-muted">
                {doc.title}
              </span>
            </li>
          </ol>
        </nav>

        {/*
          `t-h2`, and this said `t-h1` for an hour. There is no `t-h1` in the
          scale — it runs `t-display`, `t-h2`, `t-h3` — so the class matched no
          utility, the base layer's heading reset applied, and both legal pages
          rendered their title at body size. A missing utility is not an error
          anywhere; it is just a heading that quietly stops being one.

          `t-h2` rather than adding the missing entry or reaching for
          `t-display`. 28px is what the catalog page's own h1 renders at, so the
          two pages agree, and it leaves the `t-h3` section headings below a
          clear step down. `t-display` is 44px and belongs to a fold that is
          selling something.
        */}
        <h1 className="t-h2 mt-3 text-ink">{doc.title}</h1>
        <p className="t-meta mt-2 text-ink-muted">Last updated {legal.updated}</p>
        <p className="t-body mt-4 text-ink-secondary">{doc.intro}</p>

        {/*
          Tinted rather than accent-coloured, and no icon colour beyond
          `--ink-muted`. This is a statement of fact about the document's status,
          not a warning about danger, and dressing it as an alert would be the
          page shouting at a reader who has not done anything wrong.
        */}
        <div className="mt-6 flex gap-3 rounded-[var(--radius-card)] border border-line bg-surface-subtle p-4">
          <WarningCircleIcon
            size={18}
            aria-hidden="true"
            className="mt-0.5 flex-none text-ink-muted"
          />
          <p className="t-body-sm text-ink-secondary">{legal.draftNote}</p>
        </div>

        <div className="mt-9">
          {doc.sections.map((section) => (
            <section key={section.heading} className="mt-8 first:mt-0">
              <h2 className="t-h3 text-ink">{section.heading}</h2>
              {section.body.map((para) => (
                <p key={para.slice(0, 40)} className="t-body mt-3 text-ink-secondary">
                  {fillPlaceholders(para)}
                </p>
              ))}
            </section>
          ))}
        </div>

        <p className="t-body-sm mt-10 border-t border-line pt-5 text-ink-secondary">
          The other document is{" "}
          <Link
            href={doc.title === legal.terms.title ? "/privacy" : "/terms"}
            className="text-accent no-underline hover:underline"
          >
            {doc.title === legal.terms.title ? legal.privacy.title : legal.terms.title}
          </Link>
          .
        </p>
      </div>
    </Section>
  );
}

/**
 * `{entity}` and friends, swapped for the marked placeholders.
 *
 * A split on the whole token set in one pass rather than four sequential
 * `replace` calls, so a value that happens to contain another token's spelling
 * cannot be re-substituted. The capture group in the pattern keeps the
 * delimiters in the output array, which is what lets each part be tested against
 * the map.
 *
 * Returns an array of nodes rather than a string, because the placeholders have
 * to be elements. React handles the keying of a returned array of children, but
 * these need explicit keys since they come from a `map`.
 */
function fillPlaceholders(text: string): ReactNode[] {
  return text.split(/(\{[a-z]+\})/g).map((part, i) => {
    const key = part.slice(1, -1) as keyof typeof legal.pending;
    if (part.startsWith("{") && part.endsWith("}") && key in legal.pending) {
      return (
        <mark
          key={`${key}-${i}`}
          className="rounded-[3px] bg-accent-tint px-1 text-ink-secondary"
        >
          {legal.pending[key]}
        </mark>
      );
    }
    return <span key={`t-${i}`}>{part}</span>;
  });
}
