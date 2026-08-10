import type { Metadata } from "next";
import Link from "next/link";
import { SealCheckIcon, WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";

import { Certificate } from "@/components/lms/certificate";
import { Container, Section } from "@/components/ui";
import { getCourseById } from "@/lib/catalog";
import { brand } from "@/lib/content";
import { verifyCompletion, verifyPath } from "@/lib/lms/certifications";

/**
 * The page a stranger lands on.
 *
 * ------------------------------------------------------------ what it is for
 *
 * A reference printed on a document that nobody outside this site can check is
 * decoration. This is the page that makes it evidence, and it is the reason
 * `verify_completion` exists as a SECURITY DEFINER function rather than as an
 * anon policy on `completion_records`: it answers "is this document real" and it
 * cannot be asked "who else has one".
 *
 * ------------------------------------------------- the same document, not a copy
 *
 * It renders `<Certificate>` — the component the holder's own page renders. A
 * second drawing of a certificate for the public page would be two things that
 * have to be kept looking alike, and the first CSS change would separate them.
 * What a verifier sees here is what the holder printed, because it is the same
 * component with the same props.
 *
 * ----------------------------------------------------------------- indexable
 *
 * Individually, deliberately, and not in the sitemap. A certificate somebody
 * pastes into a profile should resolve for whoever follows it, including a
 * crawler that later shows it as a result — that is what makes it worth pasting.
 * References are not enumerable, so there is no list to publish and nothing here
 * invites one.
 *
 * ------------------------------------------------------------------- caching
 *
 * `revalidate = 3600`. The record is immutable once issued; the name and the
 * portrait on it are the only things that can change under it, and an hour of
 * staleness on those is a fair price for a page mostly read by machines.
 */

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ reference: string }>;
}): Promise<Metadata> {
  const { reference } = await params;
  const record = await verifyCompletion(reference);

  if (!record) {
    return { title: "Certificate not found", robots: { index: false, follow: false } };
  }

  const title = `${record.holder ?? "Completion record"} · ${record.course_title}`;
  const description = `${record.reference} was issued on ${new Date(
    record.issued_at,
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })} for completing ${record.course_title} at ${brand.name}.`;

  return {
    title,
    description,
    alternates: { canonical: verifyPath(record.reference) },
  };
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const record = await verifyCompletion(reference);

  if (!record) {
    /*
      Not `notFound()`.

      A 404 tells somebody checking a reference that the page is missing. What
      they need to know is that the reference is, which is a different sentence
      and the only one this page exists to say. Typos are the common case, so it
      says what a real one looks like.
    */
    return (
      <Section ariaLabel="Certificate not found">
        <Container className="max-w-[640px]">
          <div className="flex items-start gap-3">
            <WarningCircleIcon
              size={24}
              weight="fill"
              aria-hidden="true"
              className="mt-1 flex-none text-ink-muted"
            />
            <div>
              <h1 className="t-h2 text-ink">No completion record with that reference</h1>
              <p className="t-body mt-3 text-ink-secondary">
                Nothing has been issued under{" "}
                <span className="break-all text-ink">{reference}</span>. A reference from
                this program reads like AITE-GTM-2026-K4TQMR, with six characters at the
                end and no letter O or digit zero among them.
              </p>
              <p className="t-body-sm mt-4 text-ink-muted">
                Check it against the document it came from, then try again.
              </p>
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  /* The full `Course`, because that is what the document takes. `getCourseById`
     reads the published catalogue with the anonymous key, so this stays a page
     that works signed out and caches for everybody. */
  const course = await getCourseById(record.course_id);
  const issued = new Date(record.issued_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Section ariaLabel="Completion record">
      <Container className="max-w-[960px]">
        <div className="flex items-center gap-2">
          <SealCheckIcon
            size={20}
            weight="fill"
            aria-hidden="true"
            className="flex-none text-state-open"
          />
          <p className="t-label text-state-open">Verified</p>
        </div>

        <h1 className="t-h2 mt-2 text-ink">
          {record.holder ?? "This learner"} completed {record.course_title}
        </h1>
        <p className="t-body mt-3 max-w-[62ch] text-ink-secondary">
          Reference {record.reference} was issued by {brand.name} on {issued}. It records
          that every lesson, lab and template in the course was finished by the person
          named on it.
        </p>

        {course ? (
          <div className="mt-8">
            <Certificate
              name={record.holder ?? "A learner"}
              course={course}
              reference={record.reference}
              issuedAt={record.issued_at}
              photoUrl={record.avatar_url}
            />
          </div>
        ) : null}

        {/*
          What it says, and what it does not.

          Stated on the page rather than left to the reader, because the whole
          value of a record is that its claim is exact. The result a learner
          produced is a separate document that a judge scores, and a record that
          let itself be read as that judgement would be the site claiming
          something it has not checked.
        */}
        <dl className="mt-9 grid gap-x-8 gap-y-5 border-t border-line pt-7 sm:grid-cols-3">
          <div>
            <dt className="t-field text-ink-muted uppercase">Issued to</dt>
            <dd className="t-body mt-1 text-ink">{record.holder ?? "A learner"}</dd>
          </div>
          <div>
            <dt className="t-field text-ink-muted uppercase">Course</dt>
            <dd className="t-body mt-1 text-ink">
              {record.course_badge} · {record.course_title}
            </dd>
          </div>
          <div>
            <dt className="t-field text-ink-muted uppercase">Issued on</dt>
            <dd className="t-body mt-1 text-ink">{issued}</dd>
          </div>
        </dl>

        <p className="t-body-sm mt-7 max-w-[62ch] text-ink-secondary">
          This record covers the course. The result a learner produced with it is a
          separate document, the outcome sheet, which a judge scores against a published
          rubric.{" "}
          <Link
            href="/courses"
            className="text-accent no-underline underline-offset-4 hover:underline"
          >
            See the five courses
          </Link>
          .
        </p>
      </Container>
    </Section>
  );
}
