import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  ChatCircleTextIcon,
  PencilSimpleLineIcon,
  SealCheckIcon,
  TableIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Container, StatusChip } from "@/components/ui";
import { CoursePhoto } from "@/components/lms/course-photo";
import { Meter, Empty } from "@/components/lms/ui";
import { requireUser } from "@/lib/auth";
import { getDashboard, type DashboardCourse } from "@/lib/lms/queries";
import {
  certificatePaths,
  listMyCertificates,
  type MyCertificate,
} from "@/lib/lms/certificates";
import { getCatalog, totalLessons } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your courses",
  robots: { index: false, follow: false },
};

/**
 * The signed-in home.
 *
 * ----------------------------------------------------------- what it was
 *
 * Five identical cards in a two-column grid, under a 44px greeting that ate 191px
 * of the first screen to say the reader's own name back to them. Nothing had
 * priority: the course a learner was six lessons into was styled the same as the
 * four they had never opened, distinguished only by a progress bar. "Continue"
 * went to the course table of contents, three clicks from where they actually
 * were, under a subtitle promising "Pick up where you left off".
 *
 * And three things the database already knew were on no screen at all: whether
 * an instructor had written back, whether a judge had scored the outcome sheet,
 * and whether anything was waiting to be sent.
 *
 * ------------------------------------------------------------- what it is now
 *
 * Four bands, in the order a returning learner needs them.
 *
 *   1. Continue     one card, deep-linked to the exact lesson, named
 *   2. Needs you    at most four imperatives, each a link that resolves itself
 *   3. Results      judge scores — which existed in Postgres and were read by
 *                   nothing, so a learner could be scored and never told
 *   4. Your courses the old grid, demoted to what it is: a place to start another
 *
 * No streaks. On a self-paced course measured in weeks, a streak mostly reports
 * failure, and the correct behaviour here includes spending two weeks waiting for
 * data to accumulate. No invented due dates either: the only real deadline the
 * product owns is `measured_after_days` on a submitted outcome sheet.
 */

type Action = { key: string; href: string; label: string; detail: string; Icon: typeof ArrowRightIcon };

/** The handful of things actually waiting on this learner, most useful first. */
function nextActions(rows: DashboardCourse[], certificates: MyCertificate[]): Action[] {
  const out: Action[] = [];

  /* First, and above the instructor replies, because it is the only row in this
     list that is a result rather than a chore. A learner who finishes a course
     and is told nothing has been given the thing and not shown it. */
  for (const c of certificates) {
    out.push({
      key: `cert-${c.reference}`,
      href: certificatePaths.page(c.reference),
      label: "Your certificate is ready",
      detail: c.course_title,
      Icon: SealCheckIcon,
    });
  }

  for (const row of rows) {
    for (const a of row.feedback) {
      out.push({
        key: `fb-${a.id}`,
        href: `/learn/${row.course.slug}/${a.modules.n}`,
        label: `Your instructor replied on ${a.modules.name}`,
        detail: row.course.title,
        Icon: ChatCircleTextIcon,
      });
    }
  }

  for (const row of rows) {
    for (const a of row.drafts) {
      out.push({
        key: `dr-${a.id}`,
        href: `/learn/${row.course.slug}/${a.modules.n}`,
        label: `Send your ${a.modules.name} artifact`,
        detail: "Started, not submitted",
        Icon: PencilSimpleLineIcon,
      });
    }
  }

  for (const row of rows) {
    if (row.sheet?.status === "draft") {
      out.push({
        key: `sh-${row.sheet.id}`,
        href: `/dashboard/outcome/${row.course.id}`,
        label: "Finish your outcome sheet",
        detail: `${row.course.title} · still a draft`,
        Icon: TableIcon,
      });
    }
  }

  /* Four is the cap. A list of eight things you are behind on is a list nobody
     reads, and the fifth item is never the one that matters. */
  return out.slice(0, 4);
}

export default async function DashboardPage() {
  const viewer = await requireUser("/dashboard");
  const [enrolled, certificates] = await Promise.all([
    getDashboard(viewer.id),
    listMyCertificates(),
  ]);

  const byCourseId = new Map(enrolled.map((e) => [e.course.id, e]));
  const certificateFor = new Map(certificates.map((c) => [c.course_id, c]));
  const started = enrolled.filter((e) => e.done > 0);
  const current = started[0] ?? null;
  const actions = nextActions(enrolled, certificates);
  const scored = enrolled.filter((e) => e.judgements.length > 0);

  const rest = (await getCatalog()).filter((c) => c.id !== current?.course.id);

  return (
    <Container className="py-10 md:py-12">
      {/*
        `t-h2`, not `t-display`. The greeting was 44px and consumed a quarter of a
        phone's first screen to say the reader's own name. It also said "Welcome
        back" to accounts that had never been here — the first sentence of the
        relationship, and factually wrong.
      */}
      <h1 className="t-h2 text-ink">
        {started.length ? `Welcome back, ${viewer.name}.` : `You're in, ${viewer.name}.`}
      </h1>

      {/* ------------------------------------------------------------ continue */}
      {current ? (
        <section aria-labelledby="continue-heading" className="mt-6">
          <h2 id="continue-heading" className="sr-only">
            Continue where you left off
          </h2>
          {/*
            The course they are actually doing, at the size of a decision.

            Five equal cards told a learner nothing about what to do next, and
            people take one course at a time: the other four are a shelf, not a
            choice they are making today. So this is the page, and the rest is a
            list under it.
          */}
          <div className="grid overflow-hidden rounded-[var(--radius-feature)] border border-line bg-surface shadow-e2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="relative aspect-[16/10] lg:aspect-auto lg:min-h-[300px]">
              <CoursePhoto course={current.course} sizes="(min-width: 1024px) 50vw, 100vw" priority />
            </div>

            <div className="flex min-w-0 flex-col justify-center p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <p className="t-label text-ink-muted">{current.course.badge}</p>
                {current.enrollment.status === "completed" ? (
                  <StatusChip>Complete</StatusChip>
                ) : null}
                {/* The chip says the course is finished. This says what the
                    learner got for finishing it, which is the part the chip has
                    never been able to carry. */}
                {certificateFor.get(current.course.id) ? (
                  <Link
                    href={certificatePaths.page(certificateFor.get(current.course.id)!.reference)}
                    className="t-meta inline-flex items-center gap-1.5 text-accent no-underline underline-offset-4 hover:underline"
                  >
                    <SealCheckIcon size={15} weight="fill" aria-hidden="true" />
                    Your certificate
                  </Link>
                ) : null}
              </div>
              <h2 className="t-h2 mt-1 text-ink">{current.course.title}</h2>

              <Meter className="mt-5" done={current.done} total={current.total} />

              {current.resume ? (
                <p className="t-body-sm mt-5 text-ink-secondary">
                  Next up
                  <span className="mt-0.5 block text-ink">{current.resume.lessonName}</span>
                  <span className="t-meta block text-ink-muted">{current.resume.moduleName}</span>
                </p>
              ) : null}

              <div className="mt-5">
                <Link
                  href={current.resume?.href ?? `/learn/${current.course.slug}`}
                  className="t-button inline-flex min-h-[48px] items-center gap-2 rounded-[var(--radius-control)] bg-accent px-6 text-on-accent no-underline transition-colors hover:bg-accent-hover"
                >
                  {current.resume ? "Continue" : "Open course"}
                  <ArrowRightIcon size={15} weight="bold" aria-hidden="true" />
                </Link>
                <Link
                  href={`/learn/${current.course.slug}`}
                  className="t-button ml-5 inline-flex min-h-[48px] items-center text-ink-secondary no-underline underline-offset-4 hover:text-ink hover:underline"
                >
                  All {current.course.curriculum.length} modules
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <p className="t-body mt-3 max-w-[58ch] text-ink-secondary">
          Every course is open. Start with the one closest to the work you already do.
        </p>
      )}

      {/* ---------------------------------------------------------- needs you */}
      {actions.length ? (
        <section aria-labelledby="actions-heading" className="mt-10">
          <h2 id="actions-heading" className="t-h3 text-ink">
            Waiting on you
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {actions.map((a) => (
              <li key={a.key}>
                <Link
                  href={a.href}
                  className="flex min-h-[56px] items-center gap-3.5 rounded-[var(--radius-card)] border border-line bg-surface px-4 py-3 no-underline transition-colors hover:border-line-strong"
                >
                  <a.Icon size={18} aria-hidden="true" className="flex-none text-ink-muted" />
                  <span className="min-w-0 flex-1">
                    <span className="t-body-sm block text-ink">{a.label}</span>
                    <span className="t-meta block text-ink-muted">{a.detail}</span>
                  </span>
                  <ArrowRightIcon
                    size={14}
                    weight="bold"
                    aria-hidden="true"
                    className="flex-none text-ink-muted"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* ------------------------------------------------------------ results */}
      {scored.length ? (
        <section aria-labelledby="results-heading" className="mt-10">
          <h2 id="results-heading" className="t-h3 text-ink">
            What the review board said
          </h2>
          {scored.map((row) => (
            <div
              key={row.course.id}
              className="mt-3 rounded-[var(--radius-feature)] border border-line bg-surface p-5"
            >
              <p className="t-label text-ink-muted">{row.course.title}</p>
              <ul className="mt-3 flex flex-col gap-3">
                {row.judgements.map((j) => (
                  <li key={j.id} className="flex items-start gap-3">
                    <span className="t-body-sm grid size-8 flex-none place-items-center rounded-full bg-accent-tint tabular-nums text-accent">
                      {j.score}
                    </span>
                    <span className="min-w-0">
                      <span className="t-body-sm block text-ink">{j.rubric_criteria.label}</span>
                      {j.notes ? (
                        <span className="t-meta block text-ink-secondary">{j.notes}</span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href={`/dashboard/outcome/${row.course.id}`}
                className="t-button mt-4 inline-flex min-h-[44px] items-center gap-1.5 text-accent no-underline hover:underline"
              >
                <SealCheckIcon size={15} aria-hidden="true" />
                See the sheet they scored
              </Link>
            </div>
          ))}
        </section>
      ) : null}

      {/* ------------------------------------------------------- your courses */}
      <section aria-labelledby="courses-heading" className="mt-10">
        <h2 id="courses-heading" className="t-h3 text-ink">
          {current ? "The other courses" : "Every course, free"}
        </h2>

        {/*
            A shelf, not five more cards. Photographs at card size here competed
            with the course above them for the same attention, which is the thing
            this layout exists to stop.
        */}
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {rest.map((course) => {
            const row = byCourseId.get(course.id);
            const done = row?.done ?? 0;
            const total = row?.total || totalLessons(course);
            const isStarted = done > 0;

            return (
              <li key={course.id}>
                <Link
                  href={row?.resume?.href ?? `/learn/${course.slug}`}
                  className="flex items-center gap-3.5 rounded-[var(--radius-card)] border border-line bg-surface p-3 no-underline transition-colors hover:border-line-strong"
                >
                  <span className="relative size-14 flex-none overflow-hidden rounded-[var(--radius-control)]">
                    <CoursePhoto course={course} sizes="56px" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="t-body-sm block clamp-1 text-ink">{course.title}</span>
                    <span className="t-meta block text-ink-muted">
                      {isStarted
                        ? `${done} of ${total} lessons`
                        : [course.level, course.duration].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <ArrowRightIcon
                    size={14}
                    weight="bold"
                    aria-hidden="true"
                    className="flex-none text-ink-muted"
                  />
                </Link>
              </li>
            );
          })}
        </ul>

        {rest.length === 0 ? (
          <Empty title="You are in every course.">
            Every course is open and none of them expire. Finish one, then pick the next.
          </Empty>
        ) : null}
      </section>
    </Container>
  );
}
