import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  CheckIcon,
  DownloadSimpleIcon,
  SealCheckIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Container, StatusChip } from "@/components/ui";
import { CoursePhoto } from "@/components/lms/course-photo";
import { Meter } from "@/components/lms/ui";
import { ActionForm, Save } from "@/components/lms/admin-form";
import { requireUser } from "@/lib/auth";
import { getMyCertifications } from "@/lib/lms/certifications";
import { claimCompletion } from "@/app/actions/certifications";
import { getCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Certifications",
  robots: { index: false, follow: false },
};

/**
 * What a learner has earned, and how to earn one.
 *
 * ------------------------------------------------------------------ the report
 *
 * Roan: "Since there's nothing, it has to be some instructions on what I need to
 * do to use it to get a certification: 1. Select one of the courses. 2. Complete
 * the course. 3. Show the certification."
 *
 * That is the correct shape for this screen and it is worth being precise about
 * why. An empty state has one job, and it is not to apologise for being empty —
 * it is to be the instructions for filling itself. Nobody arrives here holding a
 * certificate; everybody arrives here wondering how to get one. So the three
 * steps ARE the page until the first record exists, and they are numbered
 * because they are ordered and the third depends on the second.
 *
 * ----------------------------------------------------- the middle state matters most
 *
 * There are three states, not two, and the one in the middle is where the whole
 * feature is won or lost: a learner who has finished every lesson and has not
 * claimed. That row gets the accent control and sits at the top, because a
 * certificate nobody knows they can take is the same as no certificate.
 *
 * `claim_completion` is what decides — it refuses unless every lesson is done —
 * so the button is rendered from `finished`, which is computed from the same
 * counts, and the two agree. If they ever disagree the RPC wins and says so with
 * the real numbers.
 */
export default async function CertificationsPage() {
  const viewer = await requireUser("/dashboard/certifications");
  const rows = await getMyCertifications(viewer.id);
  const catalog = await getCatalog();

  const earned = rows.filter((r) => r.record);
  const claimable = rows.filter((r) => r.finished && !r.record);
  const inProgress = rows.filter((r) => !r.finished && !r.record);

  return (
    <Container className="py-10 md:py-12">
      <h1 className="t-h2 text-ink">Certifications</h1>
      <p className="t-body mt-2 max-w-[62ch] text-ink-secondary">
        {/* The canonical sentence from content.ts, unchanged. A course completes
            when the work is done, and this page is where that becomes a
            document you can show somebody. */}
        Finish every lesson in a course and it completes. What you get is a completion record — a
        reference you can share, tied to your name and the course.
      </p>

      {/* --------------------------------------------------- how it works */}
      {/*
        The instructions are ALWAYS here, not only when the list is empty.

        Written as an empty state they would disappear the moment somebody earned
        their first record — exactly when they start wondering how to get the
        second. They are three short lines; they cost a band and they answer the
        question the page exists to answer.
      */}
      <ol className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          {
            n: 1,
            title: "Pick a course",
            body: "Any of the five. Module 1 is open with no account.",
            href: "/courses",
            cta: "Browse the courses",
          },
          {
            n: 2,
            title: "Complete it",
            body: "Every lesson in every module. Your progress saves as you go.",
            href: "/dashboard",
            cta: "Your courses",
          },
          {
            n: 3,
            title: "Take your record",
            body: "It appears here the moment the last lesson is done, with a reference to share.",
            href: null,
            cta: null,
          },
        ].map((step) => (
          <li
            key={step.n}
            className="rounded-[var(--radius-card)] border border-line bg-surface-subtle p-4"
          >
            <span className="t-label text-ink-muted">Step {step.n}</span>
            <p className="t-card-title mt-0.5 text-ink">{step.title}</p>
            <p className="t-body-sm mt-1 text-ink-secondary">{step.body}</p>
            {step.href ? (
              <Link
                href={step.href}
                className="t-meta mt-2 inline-flex items-center gap-1 text-accent no-underline hover:underline"
              >
                {step.cta}
                <ArrowRightIcon size={12} weight="bold" aria-hidden="true" />
              </Link>
            ) : null}
          </li>
        ))}
      </ol>

      {/* --------------------------------------------------- ready to claim */}
      {claimable.length > 0 ? (
        <section aria-labelledby="claimable" className="mt-10">
          <h2 id="claimable" className="t-h3 text-ink">
            Ready to take
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {claimable.map((row) => (
              <li
                key={row.course.id}
                className="flex flex-wrap items-center gap-4 rounded-[var(--radius-feature)] border border-accent bg-accent-tint p-4"
              >
                <span className="relative size-14 flex-none overflow-hidden rounded-[var(--radius-control)]">
                  <CoursePhoto course={row.course} sizes="56px" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="t-card-title text-ink">{row.course.title}</p>
                  <p className="t-meta text-ink-secondary">
                    All {row.total} lessons complete.
                  </p>
                </div>
                <ActionForm action={claimCompletion}>
                  <input type="hidden" name="courseId" value={row.course.id} />
                  <Save>
                    <SealCheckIcon size={15} weight="bold" aria-hidden="true" />
                    Take your completion record
                  </Save>
                </ActionForm>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* --------------------------------------------------------- earned */}
      <section aria-labelledby="earned" className="mt-10">
        <h2 id="earned" className="t-h3 text-ink">
          Your completion records
        </h2>

        {earned.length === 0 ? (
          <p className="t-body-sm mt-3 rounded-[var(--radius-card)] border border-dashed border-line-control bg-surface-subtle p-4 text-ink-secondary">
            None yet. Finish a course and it appears here — the three steps above are the whole of
            it.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {earned.map((row) => (
              <li
                key={row.course.id}
                className="flex flex-wrap items-center gap-4 rounded-[var(--radius-feature)] border border-line bg-surface p-4"
              >
                <span className="relative size-14 flex-none overflow-hidden rounded-[var(--radius-control)]">
                  <CoursePhoto course={row.course} sizes="56px" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="t-card-title text-ink">{row.course.title}</p>
                    <StatusChip open>Complete</StatusChip>
                  </div>
                  <p className="t-meta mt-0.5 text-ink-muted">
                    {/* The reference is the fact worth surfacing on the row: it
                        is what somebody quotes when checking it. `tabular-nums`
                        so a column of them lines up. */}
                    <code className="tabular-nums">{row.record!.reference}</code>
                    <span className="px-1.5">·</span>
                    Issued{" "}
                    {new Date(row.record!.issued_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                <Link
                  href={`/dashboard/certifications/${row.course.id}`}
                  className="t-button inline-flex h-10 items-center gap-2 rounded-[var(--radius-control)] bg-accent px-4 text-on-accent no-underline transition-colors hover:bg-accent-hover"
                >
                  <DownloadSimpleIcon size={15} weight="bold" aria-hidden="true" />
                  Open and download
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ----------------------------------------------------- in progress */}
      {inProgress.length > 0 ? (
        <section aria-labelledby="progress" className="mt-10">
          <h2 id="progress" className="t-h3 text-ink">
            On the way
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {inProgress.map((row) => (
              <li key={row.course.id}>
                <Link
                  href={`/courses/${row.course.slug}/start`}
                  className="flex items-center gap-3.5 rounded-[var(--radius-card)] border border-line bg-surface p-3 no-underline transition-colors hover:border-line-strong"
                >
                  <span className="relative size-12 flex-none overflow-hidden rounded-[var(--radius-control)]">
                    <CoursePhoto course={row.course} sizes="48px" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="t-body-sm block clamp-1 text-ink">{row.course.title}</span>
                    <Meter className="mt-1.5" done={row.done} total={row.total} />
                  </span>
                  <ArrowRightIcon size={14} weight="bold" aria-hidden="true" className="flex-none text-ink-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Nothing started at all: point at the catalogue rather than leaving the
          three steps hanging over an empty page. */}
      {rows.length === 0 ? (
        <div className="mt-8 rounded-[var(--radius-feature)] border border-line bg-surface p-5">
          <p className="t-card-title text-ink">Start with any of the {catalog.length}</p>
          <p className="t-body-sm mt-1.5 text-ink-secondary">
            You are not on a course yet. Module 1 of every one of them opens with no account and no
            card.
          </p>
          <Link
            href="/courses"
            className="t-button mt-4 inline-flex h-11 items-center gap-2 rounded-[var(--radius-control)] bg-accent px-5 text-on-accent no-underline transition-colors hover:bg-accent-hover"
          >
            <CheckIcon size={15} weight="bold" aria-hidden="true" />
            Pick a course
          </Link>
        </div>
      ) : null}
    </Container>
  );
}
