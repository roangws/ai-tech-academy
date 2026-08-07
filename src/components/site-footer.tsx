import Link from "next/link";
import { Logo } from "@/components/logo";
import { Container } from "@/components/ui";
import { brand, footer } from "@/lib/content";

/**
 * Dense sitemap footer, after Coursera. White, hairline top, 28px rows.
 *
 * Changed on 6 Aug. The footer ran four columns and nine of its twenty-two
 * links were on-page anchors dressed as destinations, so it implied a depth of
 * site that does not exist yet. It now says what it is: the paths, then the
 * sections on this page, then the legal row. Columns come back as the pages get
 * built.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
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

        {footer.columns.map((col) => (
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
