import type { Metadata } from "next";
import Link from "next/link";
import { ArrowSquareOutIcon } from "@phosphor-icons/react/dist/ssr";

import { Avatar } from "@/components/lms/avatar";
import { Empty } from "@/components/lms/ui";
import { listCertificates } from "@/lib/lms/admin";
import { certificatePaths, issuedOn } from "@/lib/lms/certificates";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Certificates",
  robots: { index: false, follow: false },
};

/**
 * The issue register.
 *
 * ---------------------------------------------------------------- why a page
 *
 * `/admin/learners` shows a reference against the enrolment that earned it,
 * which is the right answer to "how is this person doing" and the wrong answer
 * to "what have we issued". This is one row per record, in the order they were
 * issued, and it is the only surface that reads the whole register.
 *
 * Every row carries the public verification URL, because the useful check an
 * administrator makes is the one the outside world makes: open the link a
 * stranger would open and confirm it resolves to the person it names.
 *
 * -------------------------------------------------------------- what is here
 *
 * No issuing control. Both paths that write this table are elsewhere and should
 * stay there: a learner finishes a course and `claim_completion` issues it
 * inside the same action that ticks the last lesson, and an administrator who
 * needs to issue one early does it against the enrolment on /admin/learners,
 * where the meter that justifies overriding is on the same row as the override.
 * A second issuing control here, away from the evidence, is a button for
 * pressing without looking.
 */
export default async function AdminCertificates() {
  const certificates = await listCertificates();

  if (certificates.length === 0) {
    return (
      <>
        <h1 className="t-h2 text-ink">Certificates</h1>
        <div className="mt-6">
          <Empty title="Nothing issued yet">
            A certificate is issued the moment a learner ticks the last lesson of a
            course. You can also issue one early against an enrolment on Learners.
          </Empty>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="t-h2 text-ink">Certificates</h1>
      <p className="t-body-sm mt-1.5 max-w-[62ch] text-ink-secondary">
        {certificates.length} issued, most recent first. Each reference is public and
        permanent.
      </p>

      <ul className="mt-6 flex flex-col gap-3">
        {certificates.map((c) => {
          const name =
            [c.profile?.first_name, c.profile?.last_name].filter(Boolean).join(" ") ||
            c.profile?.email ||
            "Account removed";

          return (
            <li
              key={c.reference}
              /* The left rule is the course, exactly as it is on /admin/courses.
                 Scanning this list is mostly scanning for one course. */
              className="rounded-[var(--radius-feature)] border border-line border-l-[3px] bg-surface p-4"
              style={c.course.ground ? { borderLeftColor: c.course.ground } : undefined}
            >
              <div className="flex flex-wrap items-center gap-4">
                <Avatar
                  name={c.profile?.first_name ?? name}
                  email={c.profile?.email ?? null}
                  url={c.profile?.avatar_url ?? null}
                  size={38}
                />

                <div className="min-w-0 flex-1">
                  <p className="t-card-title truncate text-ink">{name}</p>
                  <p className="t-meta truncate text-ink-muted">
                    {c.course.badge} · {c.course.title}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="t-field text-ink-muted uppercase">Reference</p>
                  <p className="t-body-sm mt-0.5 break-all text-ink select-all">
                    {c.reference}
                  </p>
                </div>

                <div>
                  <p className="t-field text-ink-muted uppercase">Issued</p>
                  <p className="t-body-sm mt-0.5 text-ink">{issuedOn(c.issued_at)}</p>
                </div>

                <Link
                  href={certificatePaths.verify(c.reference)}
                  className="t-body-sm inline-flex min-h-[44px] items-center gap-1.5 text-accent no-underline underline-offset-4 hover:underline"
                >
                  Verification page
                  <ArrowSquareOutIcon size={15} aria-hidden="true" />
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
