import Link from "next/link";
import { Logo } from "@/components/logo";
import { Container } from "@/components/ui";
import { brand, footer } from "@/lib/content";
import { getCatalog } from "@/lib/catalog";

/**
 * Dense sitemap footer, after Coursera. White, hairline top, 28px rows.
 *
 * Changed on 6 Aug. The footer ran four columns and nine of its twenty-two
 * links were on-page anchors dressed as destinations, so it implied a depth of
 * site that does not exist yet. It now says what it is: the paths, then the
 * sections on this page, then the legal row. Columns come back as the pages get
 * built.
 *
 * ------------------------------------------------- TINTED, CHANGED 7 AUG
 *
 * It was `bg-surface` with a hairline on top, and both pages end the same way: a
 * white section holding a dark panel, then this. So the last 200px of every page
 * were white, a 1px #d8e1e8 rule with 40px of air above it and 48 below, then
 * more white. With no ground change on either side the rule had nothing to
 * divide and read as a stray line drawn across the page, which is what Roan
 * photographed at the bottom of the course page.
 *
 * `--surface-subtle` makes the boundary a change of ground, which is how every
 * other band boundary on this site is drawn, and the hairline goes back to doing
 * what hairlines here do: sharpening an edge that already exists. Safe on both
 * pages under the no-two-adjacent-tints rule, because the section above the
 * footer is white on each.
 *
 * The inner rule above the legal row stays. That one separates two blocks on one
 * ground, which is the case a bare hairline is for.
 */
export async function SiteFooter() {
  /*
    The Courses column is built from the catalogue, not written down.

    It used to list all five by name through `courseHref(id)`, which was a
    hand-maintained copy of something the database already knows — so a course
    created in the console appeared on the homepage and in the nav and was
    missing from here. content.ts keeps the index link; the courses come from
    Postgres and follow whatever is published.
  */
  const catalog = await getCatalog();
  const columns = footer.columns.map((col) =>
    col.title === "Courses"
      ? {
          ...col,
          links: [
            ...col.links,
            ...catalog.map((c) => ({ label: c.title, href: `/courses/${c.slug}` })),
          ],
        }
      : col,
  );

  return (
    <footer className="border-t border-line bg-surface-subtle">
      {/*
        Two columns of links on a phone, not one.

        Twelve links at the 44px tap target ran 528px, and with the blurb and
        the legal row the footer was 1,057px: seven per cent of a 15,000px page
        spent on a sitemap. Two columns halves the rows without touching the tap
        target, since 44px is a minimum height and not a minimum width, and the
        three groups still read as three groups because each keeps its own
        heading. The brand block spans both.
      */}
      <Container className="grid grid-cols-2 gap-x-6 gap-y-7 pb-6 pt-9 md:gap-8 md:pt-12 lg:grid-cols-[300px_repeat(3,minmax(0,1fr))] lg:gap-8">
        <div className="col-span-2 md:col-span-2 lg:col-span-1">
          <Logo size={34} descriptor />
          <p className="t-body-sm mt-3 max-w-[280px] text-ink-secondary">{footer.blurb}</p>
        </div>

        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="t-label text-ink-muted">{col.title}</p>
            <ul className="mt-2 md:mt-3">
              {col.links.map((link) => (
                <li key={col.title + link.label} className="flex h-11 items-center lg:h-7">
                  <Link
                    href={link.href}
                    className="t-body-sm text-ink-secondary no-underline transition-colors hover:text-accent hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>

      <Container>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-line pb-6 pt-5">
        <p className="t-micro text-ink-muted">
          © 2026 AI Tech Education Academy. A free, non-commercial educational project by
          Roan Weigert. {brand.domain}
        </p>
        <ul className="flex flex-wrap gap-5">
          {footer.legal.map((l) => (
            <li key={l.label}>
              <Link
                href={l.href}
                className="t-micro text-ink-muted no-underline transition-colors hover:text-ink"
              >
                {l.label}
              </Link>
            </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}
