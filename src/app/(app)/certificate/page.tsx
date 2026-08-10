import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, SealCheckIcon } from "@phosphor-icons/react/dist/ssr";

import { Container } from "@/components/ui";
import { Empty, Meter } from "@/components/lms/ui";
import { claimCertificate } from "@/app/actions/lms";
import { requireUser } from "@/lib/auth";
import { certificatePaths, issuedOn, listMyCertificates } from "@/lib/lms/certificates";
import { getDashboard } from "@/lib/lms/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your certificates",
  robots: { index: false, follow: false },
};

/**
 * Every certificate this account holds, and anything it has earned but not been
 * given.
 *
 * ------------------------------------------------------------ the second list
 *
 * Finishing the last lesson issues the certificate, inside the same action that
 * ticks it. The band below exists for the two cases that path cannot cover:
 * somebody who completed a course before any of this shipped, and somebody whose
 * final tick landed while the claim behind it did not.
 *
 * It is a button rather than something this page does on its own, because a page
 * that writes to the database while rendering is a page that writes to the
 * database when a crawler opens it. The rule the whole app keeps: reads render,
 * writes are actions.
 */
export default async function CertificatesPage() {
  const viewer = await requireUser("/certificate");
  const [certificates, enrolled] = await Promise.all([
    listMyCertificates(),
    getDashboard(viewer.id),
  ]);

  const held = new Set(certificates.map((c) => c.course_id));
  const unclaimed = enrolled.filter(
    (e) => e.total > 0 && e.done >= e.total && !held.has(e.course.id),
  );
  /* The course nearest to finishing, for the empty state. Somebody with no
     certificate wants to know what to do next, and "you are 31 of 35 lessons
     through" is a considerably better answer than "none yet". */
  const nearest = enrolled
    .filter((e) => e.total > 0 && e.done > 0 && e.done < e.total)
    .sort((a, b) => b.done / b.total - a.done / a.total)[0];

  return (
    <Container className="py-10 md:py-12">
      <h1 className="t-h2 text-ink">Your certificates</h1>
      <p className="t-body-sm mt-2 max-w-[62ch] text-ink-secondary">
        One for each course you have finished. Each carries a reference anyone can
        check, and downloads as a PDF or an image.
      </p>

      {certificates.length ? (
        <ul className="mt-7 flex flex-col gap-3">
          {certificates.map((c) => (
            <li key={c.reference}>
              <Link
                href={certificatePaths.page(c.reference)}
                className="flex items-center gap-4 rounded-[var(--radius-feature)] border border-line bg-surface p-4 no-underline transition-colors hover:border-line-strong"
                style={c.course_ground ? { borderLeft: `3px solid ${c.course_ground}` } : undefined}
              >
                <SealCheckIcon
                  size={26}
                  weight="fill"
                  aria-hidden="true"
                  className="flex-none text-state-open"
                />
                <span className="min-w-0 flex-1">
                  <span className="t-label block text-ink-muted">{c.course_badge}</span>
                  <span className="t-card-title mt-0.5 block truncate text-ink">
                    {c.course_title}
                  </span>
                  <span className="t-meta mt-1 block text-ink-muted">
                    {c.reference} · issued {issuedOn(c.issued_at)}
                  </span>
                </span>
                <ArrowRightIcon
                  size={16}
                  weight="bold"
                  aria-hidden="true"
                  className="flex-none text-ink-muted"
                />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-7">
          <Empty
            title="No certificates yet"
            action={
              nearest ? (
                <Link
                  href={`/learn/${nearest.course.slug}`}
                  className="t-button inline-flex min-h-[48px] items-center gap-2 rounded-[var(--radius-control)] bg-accent px-6 text-on-accent no-underline transition-colors hover:bg-accent-hover"
                >
                  Continue {nearest.course.title}
                  <ArrowRightIcon size={15} weight="bold" aria-hidden="true" />
                </Link>
              ) : null
            }
          >
            {nearest
              ? `A certificate is issued the moment you finish the last lesson of a course. You are ${nearest.done} of ${nearest.total} through ${nearest.course.title}.`
              : "A certificate is issued the moment you finish the last lesson of a course. Module 1 of every course is open."}
          </Empty>
        </div>
      )}

      {unclaimed.length ? (
        <section aria-labelledby="unclaimed-heading" className="mt-10">
          <h2 id="unclaimed-heading" className="t-h3 text-ink">
            Finished, and waiting to be issued
          </h2>
          <ul className="mt-3 flex flex-col gap-3">
            {unclaimed.map((e) => (
              <li
                key={e.course.id}
                className="flex flex-wrap items-center gap-4 rounded-[var(--radius-feature)] border border-line bg-surface p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="t-card-title text-ink">{e.course.title}</p>
                  <Meter className="mt-2" done={e.done} total={e.total} />
                </div>
                <form action={claimCertificate}>
                  <input type="hidden" name="slug" value={e.course.slug} />
                  <button
                    type="submit"
                    className="t-button inline-flex min-h-[44px] items-center rounded-[var(--radius-control)] bg-accent px-5 text-on-accent transition-colors hover:bg-accent-hover"
                  >
                    Issue my certificate
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </Container>
  );
}
