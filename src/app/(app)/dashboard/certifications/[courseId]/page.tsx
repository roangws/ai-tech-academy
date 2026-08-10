import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, SealCheckIcon } from "@phosphor-icons/react/dist/ssr";
import { Container } from "@/components/ui";
import { Certificate } from "@/components/lms/certificate";
import { PrintButton } from "@/components/lms/print-button";
import { requireUser } from "@/lib/auth";
import { getMyCertification } from "@/lib/lms/certifications";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Completion record",
  robots: { index: false, follow: false },
};

/**
 * One completion record, as a document.
 *
 * ------------------------------------------------------- "download it and things like that"
 *
 * Downloading is printing, and printing is a stylesheet — there is no PDF
 * library here and adding one would be the wrong trade twice over. `@react-pdf`
 * or `puppeteer` is somewhere between 300KB and a headless Chromium, in a
 * project that has been careful enough about weight to hand-roll a Markdown
 * renderer rather than ship `react-markdown`. And the browser's own print
 * dialogue already offers "Save as PDF" on every platform this site supports,
 * produces real vector text rather than a rasterised screenshot, and prints at
 * the paper size the reader actually uses.
 *
 * So the certificate is HTML, and `@media print` in globals.css hides the chrome
 * around it. What comes out is the thing on screen, at A4, with the reference
 * selectable as text.
 *
 * ------------------------------------------------------------------- the guard
 *
 * `getMyCertification` reads through `completion_read_own`, so a signed-in
 * reader can only ever resolve their own record — putting somebody else's course
 * id in the URL returns nothing and 404s here. That is Postgres refusing, not a
 * check in this file, which is why there is no `record.user_id === viewer.id`
 * line: it would be a second copy of a rule that already holds.
 */
export default async function CertificatePage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  /* `?earned=1` is set by the redirect out of `claimCompletion`, and it is the
     only thing that distinguishes "I just earned this" from "I came back to
     print it". It is a hint for one line of copy and nothing more — it grants
     no access and forging it changes nothing, which is why it needs no
     validation. */
  searchParams: Promise<{ earned?: string }>;
}) {
  const { courseId } = await params;
  const { earned } = await searchParams;
  const viewer = await requireUser(`/dashboard/certifications/${courseId}`);
  const row = await getMyCertification(viewer.id, courseId);

  /* No record is a 404 rather than an "not earned yet" page. The only way to
     reach this URL is a link from the list, which only renders for records that
     exist; anything else is a typed or stale address. */
  if (!row?.record) notFound();

  const name =
    [viewer.profile?.first_name, viewer.profile?.last_name].filter(Boolean).join(" ") || viewer.name;

  return (
    <Container className="py-8 md:py-10">
      {/* `print:hidden` on everything that is not the document. The reader
          pressed Print because they want the certificate, not the navigation
          that got them to it. */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link
          href="/dashboard/certifications"
          className="t-meta inline-flex items-center gap-1.5 text-ink-secondary no-underline hover:text-ink hover:underline"
        >
          <ArrowLeftIcon size={13} aria-hidden="true" />
          All certifications
        </Link>
        <PrintButton />
      </div>

      {earned ? (
        <p
          role="status"
          className="t-body-sm mt-4 inline-flex items-center gap-2 rounded-[var(--radius-card)] border border-line bg-surface-subtle px-3.5 py-2.5 text-ink-secondary print:hidden"
        >
          <SealCheckIcon size={16} weight="fill" aria-hidden="true" className="text-accent" />
          <span>
            <strong className="font-medium text-ink">This is yours.</strong> It is saved to your
            account — come back to it any time from Certifications.
          </span>
        </p>
      ) : null}

      <div className="mt-6">
        <Certificate
          name={name}
          course={row.course}
          reference={row.record.reference}
          issuedAt={row.record.issued_at}
        />
      </div>

      <p className="t-meta mt-4 max-w-[62ch] text-ink-muted print:hidden">
        Print to PDF to save or send it. The reference is what somebody quotes to check this record
        with us.
      </p>
    </Container>
  );
}
