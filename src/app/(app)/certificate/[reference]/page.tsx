import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  DownloadSimpleIcon,
  FilePdfIcon,
  SealCheckIcon,
} from "@phosphor-icons/react/dist/ssr";

import { Container } from "@/components/ui";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { brand } from "@/lib/content";
import { requireUser } from "@/lib/auth";
import {
  certificatePaths,
  issuedOn,
  listMyCertificates,
  verifyCompletion,
} from "@/lib/lms/certificates";
import { CERTIFICATE_SIZE } from "@/lib/lms/certificate-image";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your certificate",
  robots: { index: false, follow: false },
};

/**
 * One certificate, the learner's own.
 *
 * ------------------------------------------------------------ what it shows
 *
 * The image, and then every fact on the image again as text.
 *
 * That is not redundancy. The certificate is a rendered PNG so that what somebody
 * downloads is exactly what they were looking at — see certificate-image.tsx for
 * why that is worth the trade — and the price of a rendered document is that a
 * screen reader gets one alt attribute for the whole of it, and nobody can select
 * their own reference to paste it into an application form. The block underneath
 * is the document in a form you can read out, copy, and search.
 *
 * ------------------------------------------------------- who can open this
 *
 * The holder. The reference resolves publicly — /verify/<reference> is a page for
 * strangers and the image behind it is deliberately unauthenticated — but this
 * page says "your" in six places and offers downloads, so it is looked up in the
 * caller's own list rather than through the public function. Somebody holding
 * another person's reference gets the verification page, which is the page for
 * them.
 */
export default async function CertificatePage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  await requireUser(certificatePaths.page(reference));

  const mine = await listMyCertificates();
  const held = mine.find((c) => c.reference === reference.toUpperCase());
  if (!held) notFound();

  /* The rendered record, for the fields the join above does not carry: the name
     as it is printed, and the date in the same form the document uses. One call,
     and it is the same one the image made, so React's cache serves it. */
  const record = await verifyCompletion(held.reference);
  if (!record) notFound();

  const verifyUrl = `${brand.domain}${certificatePaths.verify(held.reference)}`;

  return (
    <Container className="py-10 md:py-12">
      <Link
        href="/certificate"
        className="t-meta inline-flex items-center gap-1.5 text-ink-secondary no-underline underline-offset-4 hover:text-ink hover:underline"
      >
        <ArrowLeftIcon size={14} weight="bold" aria-hidden="true" />
        All certificates
      </Link>

      <h1 className="t-h2 mt-3 text-ink">{held.course_title}</h1>
      <p className="t-body-sm mt-2 max-w-[62ch] text-ink-secondary">
        Issued on {issuedOn(held.issued_at)}, when the last lesson of this course was
        marked complete. Anyone you send it to can check it against the reference on
        it.
      </p>

      {/*
        The mat.

        A document sits on something, and the something here is a hairline frame
        and 12px of white around the image rather than a shadow: the certificate
        has its own printed border, and a second heavy edge around it reads as a
        card containing a card.
      */}
      <div className="mt-7 rounded-[var(--radius-feature)] border border-line bg-surface p-2 shadow-e2 md:p-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- the certificate
            is a route that renders its own PNG at a fixed size. Passing it
            through the image optimiser would re-encode a document that was drawn
            once for this exact width. Same argument as components/lms/avatar. */}
        <img
          src={certificatePaths.image(held.reference)}
          width={CERTIFICATE_SIZE.width}
          height={CERTIFICATE_SIZE.height}
          alt={`Certificate of completion for ${held.course_title}, issued to ${
            record.holder ?? "this learner"
          } on ${issuedOn(held.issued_at)}, reference ${held.reference}.`}
          className="block h-auto w-full rounded-[var(--radius-card)]"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {/*
          Plain anchors, not `ButtonLink`.

          Both of these are route handlers that answer with a Content-Disposition
          rather than a page. `next/link` would prefetch them and then try to
          treat the response as a navigation, which downloads the file and leaves
          the router waiting for markup that is never coming. `download` on the
          anchor states the intent to the browser as well as to the reader.
        */}
        <LiquidButton asChild variant="accent" size="lg" className="t-button">
          <a href={certificatePaths.pdf(held.reference)} download>
            <FilePdfIcon size={17} weight="bold" aria-hidden="true" />
            Download PDF
          </a>
        </LiquidButton>
        <LiquidButton asChild variant="default" size="lg" className="t-button">
          <a href={certificatePaths.download(held.reference)} download>
            <DownloadSimpleIcon size={17} weight="bold" aria-hidden="true" />
            Download image
          </a>
        </LiquidButton>
      </div>

      {/* ------------------------------------------------- the document, as text */}
      <dl className="mt-9 grid gap-x-8 gap-y-5 border-t border-line pt-7 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="t-field text-ink-muted uppercase">Issued to</dt>
          <dd className="t-body mt-1 text-ink">{record.holder ?? "Your account"}</dd>
        </div>
        <div>
          <dt className="t-field text-ink-muted uppercase">Course</dt>
          <dd className="t-body mt-1 text-ink">
            {held.course_badge} · {held.course_title}
          </dd>
        </div>
        <div>
          <dt className="t-field text-ink-muted uppercase">Reference</dt>
          {/* Selectable and on its own line, because the single most common thing
              anybody does with this string is copy it into a form. */}
          <dd className="t-body mt-1 break-all text-ink select-all">{held.reference}</dd>
        </div>
        <div>
          <dt className="t-field text-ink-muted uppercase">Issued on</dt>
          <dd className="t-body mt-1 text-ink">{issuedOn(held.issued_at)}</dd>
        </div>
      </dl>

      <div className="mt-7 flex items-start gap-3 rounded-[var(--radius-card)] border border-line bg-surface-subtle p-4">
        <SealCheckIcon
          size={20}
          weight="fill"
          aria-hidden="true"
          className="mt-0.5 flex-none text-state-open"
        />
        <p className="t-body-sm text-ink-secondary">
          Anyone can check this at{" "}
          <Link
            href={certificatePaths.verify(held.reference)}
            className="text-accent no-underline underline-offset-4 hover:underline"
          >
            {verifyUrl}
          </Link>
          . That page shows the name, the course and the date, and nothing else about
          your account.
        </p>
      </div>
    </Container>
  );
}
